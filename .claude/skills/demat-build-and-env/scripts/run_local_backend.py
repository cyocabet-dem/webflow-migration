#!/usr/bin/env python3
"""Dev-only runner for demat-backend with the Auth0 token check bypassed.

Run from the demat-backend repo root via `poetry run python <this file> [email]`.
Overrides ONLY app.auth.get_token_claims (dependency_overrides — zero file changes):
every request is treated as the impersonated user, resolved from the TEST database.
Never use against a production database.
"""
import os
import sys

# Must be launched from the demat-backend repo root: the `app` package imports
# and the backend's .env discovery both resolve relative to it. Fail fast if not.
BACKEND_ROOT = os.getcwd()
if not os.path.isfile(os.path.join(BACKEND_ROOT, "app", "main.py")):
    sys.exit(
        "Run this from the demat-backend repo root "
        f"(app/main.py not found under {BACKEND_ROOT!r})"
    )
sys.path.insert(0, BACKEND_ROOT)

from app.main import app  # noqa: E402  (loads .env via app.core.config)
from app import auth  # noqa: E402
from app.db.session import get_fastapi_session  # noqa: E402

IMPERSONATE_EMAIL = sys.argv[1] if len(sys.argv) > 1 else "cyocabet@dematerialized.nl"

# Resolve the impersonated user's auth0 id from the DB up front.
from app.db import models  # noqa: E402

session_gen = get_fastapi_session()
session = next(session_gen)
try:
    user = (
        session.query(models.User)
        .filter(models.User.email == IMPERSONATE_EMAIL)
        .first()
    )
    if user is None:
        user = (
            session.query(models.User)
            .filter(models.User.stripe_id.isnot(None))
            .first()
        )
    if user is None:
        sys.exit("No impersonatable user found in the database")
    AUTH0_SUB = user.auth_account
    print(f"[dev-backend] impersonating: {user.email} (auth0 sub {AUTH0_SUB[:12]}…, stripe={'yes' if user.stripe_id else 'no'})")
finally:
    try:
        next(session_gen)
    except StopIteration:
        pass


async def fake_claims() -> dict:
    return {"sub": AUTH0_SUB}


app.dependency_overrides[auth.get_token_claims] = fake_claims
print(f"[dev-backend] override registered: {list(app.dependency_overrides.keys())}")

import uvicorn  # noqa: E402

uvicorn.run(app, host="127.0.0.1", port=8000)
