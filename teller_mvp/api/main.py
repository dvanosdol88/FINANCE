import os
from pathlib import Path
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import httpx

try:
    # Load .env if present (dev convenience)
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# ---- Configuration ----
TELLER_ENV = (os.getenv("TELLER_ENV") or "sandbox").lower().strip()
TELLER_CERT_PATH = os.getenv("TELLER_CERT_PATH")  # required for development/production
TELLER_KEY_PATH  = os.getenv("TELLER_KEY_PATH")   # required for development/production

# Teller API base is the same; sandbox just doesn't require mTLS.
TELLER_API_BASE = "https://api.teller.io"

def _make_client(access_token: str) -> httpx.Client:
    """
    Create an httpx client with:
      - Basic auth using the Teller access token as the username and blank password.
      - mTLS cert+key for development/production (NOT required for sandbox).
    """
    auth = (access_token, "")  # Authorization: Basic base64(f"{token}:")
    common_kwargs: Dict[str, Any] = {
        "base_url": TELLER_API_BASE,
        "auth": auth,
        "timeout": 30.0,
    }

    if TELLER_ENV in ("development", "production"):
        if not TELLER_CERT_PATH or not TELLER_KEY_PATH:
            raise RuntimeError("TELLER_CERT_PATH and TELLER_KEY_PATH are required in development/production.")
        return httpx.Client(cert=(TELLER_CERT_PATH, TELLER_KEY_PATH), **common_kwargs)

    # sandbox: no cert required
    return httpx.Client(**common_kwargs)

# ---- FastAPI app ----
app = FastAPI(title="Teller MVP API", version="0.1.0")

# Simple permissive CORS for MVP; tighten later as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# Serve static frontend
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/healthz")
def healthz():
    return {"ok": True, "env": TELLER_ENV}

@app.get("/")
def root():
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        return JSONResponse({"error": "index.html not found"}, status_code=404)
    return FileResponse(str(index_path))

@app.post("/api/fetch")
def fetch_all(payload: Dict[str, Any]):
    """
    Request body:
      {
        "accessToken": "string from Teller Connect onSuccess",
        "count": 50   # optional: max transactions per account
      }
    Response:
      {
        "accounts": [
          {
            "account": {...id,name,institution,last_four,type...},
            "balance": {"available": "...", "ledger": "..."},
            "transactions": [ ... ]
          },
          ...
        ]
      }
    """
    access_token = (payload or {}).get("accessToken")
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing 'accessToken' in request body")

    max_count = (payload or {}).get("count") or 50
    try:
        with _make_client(access_token) as client:
            # 1) list accounts
            r = client.get("/accounts")
            r.raise_for_status()
            accounts = r.json()
            if not isinstance(accounts, list):
                raise HTTPException(status_code=502, detail="Unexpected accounts payload")

            results: List[Dict[str, Any]] = []
            for acct in accounts:
                acct_id = acct.get("id")
                if not acct_id:
                    # skip malformed
                    continue

                # 2) balances
                rb = client.get(f"/accounts/{acct_id}/balances")
                rb.raise_for_status()
                balance = rb.json()

                # 3) transactions (limit via count parameter if supported)
                params = {"count": max_count}
                rt = client.get(f"/accounts/{acct_id}/transactions", params=params)
                rt.raise_for_status()
                transactions = rt.json()

                results.append({
                    "account": {
                        "id": acct_id,
                        "name": acct.get("name"),
                        "institution": (acct.get("institution") or {}).get("name"),
                        "last_four": acct.get("last_four"),
                        "type": acct.get("type"),
                    },
                    "balance": {
                        "available": (balance or {}).get("available"),
                        "ledger": (balance or {}).get("ledger"),
                    },
                    "transactions": transactions if isinstance(transactions, list) else [],
                })

        return {"accounts": results}

    except httpx.HTTPStatusError as e:
        # Bubble up Teller response body for easier debugging
        detail = f"Teller API error [{e.response.status_code}]: {e.response.text}"
        raise HTTPException(status_code=e.response.status_code, detail=detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
