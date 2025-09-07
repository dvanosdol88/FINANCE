import os
from typing import Optional

try:
    from plaid.api import plaid_api
    from plaid.model.products import Products
    from plaid.model.link_token_create_request import LinkTokenCreateRequest
    from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
    from plaid.model.country_code import CountryCode
    from plaid.api_client import ApiClient
    from plaid.configuration import Configuration
except Exception:  # pragma: no cover - optional dependency during local dev
    plaid_api = None
    Products = None
    LinkTokenCreateRequest = None
    LinkTokenCreateRequestUser = None
    CountryCode = None
    ApiClient = None
    Configuration = None


def make_plaid_client() -> Optional[plaid_api.PlaidApi]:
    if not all([
        os.environ.get("PLAID_CLIENT_ID"),
        os.environ.get("PLAID_SECRET"),
    ]):
        return None
    env = (os.environ.get("PLAID_ENV") or "sandbox").lower()
    host = {
        "sandbox": "https://sandbox.plaid.com",
        "development": "https://development.plaid.com",
        "production": "https://production.plaid.com",
    }.get(env, "https://sandbox.plaid.com")

    configuration = Configuration(
        host=host,
        api_key={
            "clientId": os.environ["PLAID_CLIENT_ID"],
            "secret": os.environ["PLAID_SECRET"],
        },
    )
    api_client = ApiClient(configuration)
    return plaid_api.PlaidApi(api_client)

