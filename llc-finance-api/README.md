LLC Finance API (Minimal, Single-User)

Purpose
- Persist the frontend dashboard state as a single JSON document.
- Optionally fetch bank balances via Plaid (TD/Chase, etc.).
- Single user, simple API key auth, no renters/invoices, no splits, no reconciliation.

Stack
- Python FastAPI + Uvicorn
- Postgres via SQLAlchemy + psycopg
- cryptography (Fernet) for encrypting Plaid access tokens
- plaid-python (optional paths)

API
- GET `/state` → returns the saved JSON state (document)
- PUT `/state` → replaces the saved JSON state
- POST `/plaid/link-token` → returns a Plaid Link token (if Plaid env configured)
- POST `/plaid/exchange` → exchange `public_token` → stores encrypted `access_token`
- POST `/plaid/refresh-balances` → fetches balances, upserts cache, returns balances

Auth
- All endpoints require header `X-API-Key: <API_KEY>`

Environment Variables
- `DATABASE_URL` (required): e.g. postgres://user:pass@host:5432/dbname
- `API_KEY` (required): shared secret for single-user access
- `FERNET_KEY` (required for Plaid): 32-byte base64 key (run `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)
- `PLAID_CLIENT_ID` (optional): for Plaid endpoints
- `PLAID_SECRET` (optional): for Plaid endpoints
- `PLAID_ENV` (optional): sandbox|development|production (default: sandbox)

Quick Start (local)
1) Create and activate a virtualenv
   - `python -m venv .venv && source .venv/bin/activate`
2) Install deps
   - `pip install -r requirements.txt`
3) Set env vars (see .env.example)
4) Run
   - `uvicorn app.main:app --reload --port 8000`

Endpoints (curl examples)
- Save state:
  - `curl -X PUT http://localhost:8000/state -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' -d '{"accountsData": {}}'`
- Load state:
  - `curl http://localhost:8000/state -H "X-API-Key: $API_KEY"`

Plaid (optional)
- Link token:
  - `curl -X POST http://localhost:8000/plaid/link-token -H "X-API-Key: $API_KEY"`
- Exchange public token:
  - `curl -X POST http://localhost:8000/plaid/exchange -H "X-API-Key: $API_KEY" -H 'Content-Type: application/json' -d '{"public_token":"PUBLIC-..."}'`
- Refresh balances:
  - `curl -X POST http://localhost:8000/plaid/refresh-balances -H "X-API-Key: $API_KEY"`

Render Deployment
- Create a new Web Service
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
- Set env vars (DATABASE_URL, API_KEY, FERNET_KEY, and Plaid vars if needed)

Blueprint via Render CLI
- Install CLI: `npm i -g @renderinc/cli` or follow Render docs
- Login: `render login` (opens a browser; complete auth)
- From this folder (`llc-finance-api/`), deploy:
  - `render blueprint deploy`  (uses `render.yaml`)
  - This creates both the Postgres database and the web service.
- Set secrets (if not already set during deploy):
  - `render secrets set llc-finance-api API_KEY=... FERNET_KEY=...`
  - Or via dashboard: define secrets `llc_finance_api_key`, `llc_finance_fernet_key`, `plaid_client_id`, `plaid_secret` used in render.yaml
- After deploy, fetch the service URL from the CLI or dashboard.

Notes
- The service listens on port 10000 in Docker, which Render expects.
- Health check is `/healthz`.
- DATABASE_URL is sourced from the managed Postgres defined in `render.yaml`. If you prefer an existing DB, remove the `databases:` block and set `DATABASE_URL` as an env var instead.
