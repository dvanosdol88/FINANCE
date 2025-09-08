# Teller MVP — Balances & Transactions

Minimal FastAPI + static HTML that:
- uses **Teller Connect** (frontend) to enroll a bank and obtain an `accessToken`
- calls Teller API (backend) with **Basic auth (token as username)** and **mTLS** (in development/production)
- returns **accounts**, **balances**, and **recent transactions**

## Quick start (local)

1) Create venv and install:
```bash
cd api
python -m venv .venv && . .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
