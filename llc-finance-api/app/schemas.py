from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StatePayload(BaseModel):
    state: Dict[str, Any] = Field(default_factory=dict)


class PlaidLinkTokenResponse(BaseModel):
    link_token: str


class PlaidExchangeRequest(BaseModel):
    public_token: str
    institution: Optional[str] = None


class BalanceAccount(BaseModel):
    plaid_account_id: str
    name: str
    currency: str
    current: float


class BalancesResponse(BaseModel):
    accounts: List[BalanceAccount]

