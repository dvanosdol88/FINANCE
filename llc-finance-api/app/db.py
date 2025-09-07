import os
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from .models import metadata, app_state
from datetime import datetime, timezone


def get_engine() -> Engine:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set")
    # Normalize common Postgres URL forms to psycopg3 driver
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgresql://") and "+" not in database_url:
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    # SQLAlchemy 2.x engine (sync)
    engine = create_engine(database_url, pool_pre_ping=True, future=True)
    return engine


@contextmanager
def db_session(engine: Engine):
    with engine.begin() as conn:
        yield conn


def init_db(engine: Engine):
    # Create tables if not exist
    metadata.create_all(engine)
    # Ensure a single row for app_state exists with id=1
    with engine.begin() as conn:
        res = conn.execute(text("SELECT 1 FROM app_state WHERE id=:id"), {"id": 1}).fetchone()
        if not res:
            conn.execute(
                app_state.insert().values(
                    id=1,
                    state={},
                    updated_at=datetime.now(timezone.utc),
                )
            )
