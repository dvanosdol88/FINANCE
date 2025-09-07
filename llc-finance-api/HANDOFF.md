LLC Finance — Handoff

This doc summarizes what was built, how to deploy/run it, and what’s next.

1) What We Accomplished
- Backend API (FastAPI) in `llc-finance-api/`:
  - Endpoints: `GET/PUT /state`, `POST /plaid/link-token`, `POST /plaid/exchange`, `POST /plaid/refresh-balances`, `GET /healthz`.
  - Data: `app_state` (single JSON doc of your dashboard), `plaid_items` (encrypted Plaid tokens), `plaid_balances` (latest cache).
  - Auth: single user via `X-API-Key` header.
  - Security: Plaid access tokens encrypted with Fernet (`FERNET_KEY`).
  - DB: Postgres (SQLAlchemy + psycopg3). Auto-normalizes `postgres://` → `postgresql+psycopg://`.
- Render deployment setup:
  - `render.yaml` to deploy Docker web service and use your existing Postgres via `DATABASE_URL` secret.
  - `README.md` with CLI steps and env/secrets.
- Frontend wiring (repo: `owner-davidcfacfp/llc-finance-app`):
  - UI loads state from `GET /state` on boot; saves via `PUT /state` after Save actions.
  - Query-string config: `?apiBase=...&apiKey=...` stored in localStorage.
  - Added “↻ Refresh Balances” button → calls `POST /plaid/refresh-balances`, sums Plaid accounts into LLC Checking, updates UI, and persists.

2) Where the Files Are + How To Get There
- This handoff lives at `llc-finance-api/HANDOFF.md` (current workspace).
- Backend code: `llc-finance-api/` (Dockerfile, FastAPI app, models, schemas, security, Render blueprint).
- Frontend (local clone in this workspace): `llc-finance-app/` with changes in `index.html` and `js/app.js`.
  - To open locally on your machine (Windows):
    1. Clone the repo `owner-davidcfacfp/llc-finance-app` under `C:\Users\david\Projects\llc-finance-app` (or preferred folder).
    2. Apply the provided patch (see PR section below) or copy the updated `index.html` and `js/app.js` from the workspace clone.

3) Current Status
- Backend: ready to deploy on Render; database expected via `DATABASE_URL` secret (existing Postgres).
- Frontend: minimal API integration + “Refresh Balances” in local clone; a PR is prepared as a unified diff to apply from your account.
- Google Drive (G:) is not used in the runtime path. Everything runs from C:/ and Render.

4) Deploy on Render (using existing Postgres)
- Prereqs: Render CLI installed, you’re logged in: `render login`.
- From `llc-finance-api/`:
  - `render blueprint deploy`
  - Set secrets (via CLI or dashboard):
    - `DATABASE_URL` = `postgresql+psycopg://USER:PASS@HOST:PORT/DB?sslmode=require`
    - `API_KEY` = a long random string
    - `FERNET_KEY` = run `python - <<'PY'\nfrom cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\nPY`
    - Optional: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox/development/production)
- Verify: `curl https://<service-url>/healthz` → `{ "ok": true }`.
- Point your UI at the API once: open `index.html?apiBase=https://<service-url>&apiKey=<YOUR_API_KEY>`.

5) Help David Set Up His Plaid Credentials (Step-by-Step)
- In Plaid Dashboard:
  1. Create a Plaid application (Sandbox to start).
  2. Note `Client ID` and `Secret`. Set `Redirect URI` to a local/testing value if using Link (e.g., `https://your-ui-domain/link/return`), though balances-only refresh can be tested without Link using Sandbox items.
  3. Enable OAuth institutions as needed (TD/Chase when moving beyond Sandbox).
- In Render service (backend): set env vars
  - `PLAID_CLIENT_ID` = your client id
  - `PLAID_SECRET` = your secret
  - `PLAID_ENV` = `sandbox` (then `development`/`production` later)
- Linking flow (optional UI work to add later):
  - Frontend calls `POST /plaid/link-token` → receives `link_token`.
  - Initialize Plaid Link on the page using `link_token`. On success, the frontend gets a `public_token`.
  - Frontend calls `POST /plaid/exchange` with `{ public_token, institution }`.
  - Backend stores encrypted `access_token` for that item.
  - Click “↻ Refresh Balances” to call `POST /plaid/refresh-balances` (already wired); new balances flow into LLC Checking and are saved.
- Sandbox test accounts: use Plaid’s test institutions and credentials from their docs to simulate accounts/balances.

6) Roadmap / Next Steps (Still Simple)
- Add minimal “Link Plaid” UI in the header (open Link, exchange token) — backend ready.
- Tighten CORS to your UI origin in `app.main`.
- Optional: add Export/Import JSON of the `app_state` for quick backups.
- Optional: simple account mapping (split Plaid balances into LLC Checking vs Savings) — tiny UI list, no reconciliation logic.

7) PR Instructions (Frontend Changes)
- Since push from this environment wasn’t permitted, apply the prepared diff locally and open a PR from your account:
  1. `git checkout -b refresh-balances-button`
  2. Save the diff as `refresh-balances.patch` (from our last message) in the repo root.
  3. `git apply refresh-balances.patch`
  4. `git commit -am "feat: add Refresh Balances button and Plaid wiring; persist updated balance"`
  5. `git push origin refresh-balances-button`
  6. `gh pr create --title "Add Refresh Balances button and Plaid wiring" --body "Adds header button and JS handler to call POST /plaid/refresh-balances, sum accounts, update LLC Checking, and persist via PUT /state."`

Questions or tweaks you want me to do next:
- Add the Plaid Link UI and test with Sandbox
- Set up a Render cron for nightly balance refresh
- Restrict CORS to your UI’s origin
