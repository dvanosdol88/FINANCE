from __future__ import annotations

from datetime import datetime
from sqlalchemy import (
    MetaData, Table, Column, Integer, SmallInteger, Text, LargeBinary,
    BigInteger, JSON, DateTime, UniqueConstraint
)


metadata = MetaData()


app_state = Table(
    "app_state",
    metadata,
    Column("id", SmallInteger, primary_key=True),
    Column("state", JSON, nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)


plaid_items = Table(
    "plaid_items",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("item_id", Text, nullable=False, unique=True),
    Column("access_token_enc", LargeBinary, nullable=False),
    Column("institution", Text),
    Column("status", Text),
    Column("created_at", DateTime(timezone=True), nullable=False),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)


plaid_balances = Table(
    "plaid_balances",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("plaid_account_id", Text, nullable=False),
    Column("name", Text),
    Column("currency", Text),
    Column("current_cents", BigInteger),
    Column("raw", JSON),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("plaid_account_id", name="uq_plaid_balances_account"),
)

