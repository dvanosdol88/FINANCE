from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, insert, update

from .db import get_engine, init_db, db_session
from .models import app_state, plaid_items, plaid_balances
from .security import require_api_key, get_fernet
from .schemas import StatePayload, PlaidLinkTokenResponse, PlaidExchangeRequest, BalancesResponse, BalanceAccount
from .plaid_client import make_plaid_client

# Load environment variables from .env in local development
from dotenv import load_dotenv
load_dotenv()  # looks for a .env file in the current working directory or parents


app = FastAPI(title="LLC Finance API", version="0.1.0")

# Simple CORS for local dev; tighten in production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


ENGINE = get_engine()
init_db(ENGINE)


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/state", dependencies=[Depends(require_api_key)])
def get_state() -> Dict[str, Any]:
    with db_session(ENGINE) as conn:
        row = conn.execute(select(app_state.c.state).where(app_state.c.id == 1)).fetchone()
        if not row:
            return {"state": {}}
        return {"state": row[0]}


@app.put("/state", dependencies=[Depends(require_api_key)])
def put_state(payload: StatePayload) -> Dict[str, Any]:
    # Basic size guard: 1MB
    import json
    blob = payload.state or {}
    if len(json.dumps(blob)) > 1_000_000:
        raise HTTPException(status_code=413, detail="State too large")

    now = datetime.now(timezone.utc)
    with db_session(ENGINE) as conn:
        # Upsert id=1
        exists = conn.execute(select(app_state.c.id).where(app_state.c.id == 1)).fetchone()
        if exists:
            conn.execute(
                update(app_state)
                .where(app_state.c.id == 1)
                .values(state=blob, updated_at=now)
            )
        else:
            conn.execute(
                insert(app_state)
                .values(id=1, state=blob, updated_at=now)
            )
    return {"ok": True}


@app.post("/plaid/link-token", response_model=PlaidLinkTokenResponse, dependencies=[Depends(require_api_key)])
def plaid_link_token():
    client = make_plaid_client()
    if client is None:
        raise HTTPException(status_code=501, detail="Plaid not configured")

    from plaid.model.link_token_create_request import LinkTokenCreateRequest
    from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
    from plaid.model.products import Products
    from plaid.model.country_code import CountryCode

    req = LinkTokenCreateRequest(
        products=[Products("auth")],  # balances only path; products can be omitted for OAuth linking
        client_name="LLC Finance",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(client_user_id="single-user"),
    )
    resp = client.link_token_create(req)
    return PlaidLinkTokenResponse(link_token=resp["link_token"])  # type: ignore[index]


@app.post("/plaid/exchange", dependencies=[Depends(require_api_key)])
def plaid_exchange(body: PlaidExchangeRequest):
    client = make_plaid_client()
    if client is None:
        raise HTTPException(status_code=501, detail="Plaid not configured")

    # Exchange public_token → access_token
    token_resp = client.item_public_token_exchange({"public_token": body.public_token})
    access_token = token_resp["access_token"]  # type: ignore[index]
    item_id = token_resp["item_id"]  # type: ignore[index]

    fernet = get_fernet()
    enc = fernet.encrypt(access_token.encode("utf-8"))

    now = datetime.now(timezone.utc)
    with db_session(ENGINE) as conn:
        # Upsert by item_id
        existing = conn.execute(select(plaid_items.c.id).where(plaid_items.c.item_id == item_id)).fetchone()
        if existing:
            conn.execute(
                plaid_items.update()
                .where(plaid_items.c.item_id == item_id)
                .values(access_token_enc=enc, institution=body.institution, status="active", updated_at=now)
            )
        else:
            conn.execute(
                plaid_items.insert().values(
                    item_id=item_id,
                    access_token_enc=enc,
                    institution=body.institution,
                    status="active",
                    created_at=now,
                    updated_at=now,
                )
            )
    return {"ok": True, "item_id": item_id}


@app.post("/plaid/refresh-balances", response_model=BalancesResponse, dependencies=[Depends(require_api_key)])
def plaid_refresh_balances():
    client = make_plaid_client()
    if client is None:
        raise HTTPException(status_code=501, detail="Plaid not configured")

    fernet = get_fernet()
    now = datetime.now(timezone.utc)
    out_accounts: List[BalanceAccount] = []

    with db_session(ENGINE) as conn:
        items = conn.execute(select(plaid_items.c.item_id, plaid_items.c.access_token_enc)).fetchall()
        for (item_id, enc) in items:
            try:
                access_token = fernet.decrypt(bytes(enc)).decode("utf-8")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Decrypt failed for item {item_id}: {e}")

            resp = client.accounts_balance_get({"access_token": access_token})
            accounts = resp["accounts"]  # type: ignore[index]
            for acc in accounts:
                plaid_account_id = acc["account_id"]
                name = acc.get("name") or "Account"
                currency = (acc.get("balances", {}) or {}).get("iso_currency_code") or "USD"
                current = (acc.get("balances", {}) or {}).get("current") or 0.0

                # Upsert cache
                existing = conn.execute(
                    select(plaid_balances.c.id).where(plaid_balances.c.plaid_account_id == plaid_account_id)
                ).fetchone()
                cents = int(round(float(current) * 100))
                if existing:
                    conn.execute(
                        plaid_balances.update()
                        .where(plaid_balances.c.plaid_account_id == plaid_account_id)
                        .values(name=name, currency=currency, current_cents=cents, updated_at=now)
                    )
                else:
                    conn.execute(
                        insert(plaid_balances).values(
                            plaid_account_id=plaid_account_id,
                            name=name,
                            currency=currency,
                            current_cents=cents,
                            # raw=acc,
                            updated_at=now,
                        )
                    )

                out_accounts.append(
                    BalanceAccount(
                        plaid_account_id=plaid_account_id,
                        name=name,
                        currency=currency,
                        current=float(current),
                    )
                )

    return BalancesResponse(accounts=out_accounts)

