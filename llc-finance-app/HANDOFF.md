LLC Finance — Frontend Handoff (Local Clone)

Summary
- This repo now includes minimal API wiring and a “↻ Refresh Balances” button.
- On load, the app fetches saved state from the backend; on Save actions, it persists back.
- The Refresh button calls the backend to pull Plaid balances, sets LLC Checking to the sum, updates the UI, and saves.

How To Point UI at Backend
- Open with query params once: `index.html?apiBase=https://<service-url>&apiKey=<YOUR_API_KEY>`
- The values persist in localStorage.

Deploy/Backend Quick Link
- See `../llc-finance-api/HANDOFF.md` for backend deploy steps (Render CLI) and Plaid setup.

What Changed
- `index.html`: added `<button id="refresh-balances-btn">↻ Refresh Balances</button>` in the header.
- `js/app.js`:
  - Reads API config from URL/localStorage.
  - Adds handlers to save state after edits.
  - Adds click handler for the Refresh button to call `POST /plaid/refresh-balances` and persist new balance.

Open a PR (if you haven’t yet)
1. `git checkout -b refresh-balances-button`
2. Save the patch from the handoff in `../llc-finance-api/HANDOFF.md` as `refresh-balances.patch`.
3. `git apply refresh-balances.patch`
4. `git commit -am "feat: add Refresh Balances button and Plaid wiring; persist updated balance"`
5. `git push origin refresh-balances-button`
6. `gh pr create --title "Add Refresh Balances button and Plaid wiring" --body "Adds header button and JS handler to call POST /plaid/refresh-balances, sum accounts, update LLC Checking, and persist via PUT /state."`

Help David Set Up Plaid (Quick)
- In Plaid dashboard: create app (Sandbox first), record `Client ID` and `Secret`, and set redirect URI.
- In Render backend service: set env vars `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox/development/production) and `FERNET_KEY`.
- Link UI (added): use the “Link Bank” button in the header which calls `/plaid/link-token` and then `/plaid/exchange` automatically after success.
- Click “↻ Refresh Balances” to fetch and persist balances.
