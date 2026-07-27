"""
Seed a verified dev account for local testing.

Usage (from backend/):
    ./venv/bin/python seed_dev.py

Idempotent: re-running resets the dev account's password and keeps everything
else intact. Delete local.db for a completely fresh database.
"""

# app.database must be imported first — it runs load_dotenv() so JWT_SECRET
# and DATABASE_URL from backend/.env are set before other modules read them.
from app.database import engine
from sqlmodel import SQLModel, Session, select

# Import every model so create_all() knows the full schema
from app.models import (  # noqa: F401
    account, asset, budgetitem, category, emailtoken,
    incomeevent, investmentcontribution, preference, snapshot, user,
)
from app.models.user import User
from app.models.preference import Preference
from app.auth.utils import hash_password

EMAIL = "dev@example.com"
PASSWORD = "Password1"

# This script creates an account with a well-known password, so it must never
# touch a shared database. Only local SQLite / localhost Postgres is allowed.
_LOCAL_MARKERS = ("sqlite", "localhost", "127.0.0.1", "::1")


def _assert_local_database() -> None:
    url = str(engine.url)
    if not any(marker in url for marker in _LOCAL_MARKERS):
        raise SystemExit(
            f"Refusing to seed: DATABASE_URL does not look local ({engine.url.host or url}).\n"
            "This script creates an account with a known password and is for "
            "local development only."
        )


def main() -> None:
    _assert_local_database()
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        dev_user = session.exec(select(User).where(User.email == EMAIL)).first()
        if dev_user:
            dev_user.hashed_password = hash_password(PASSWORD)
            dev_user.email_verified = True
            session.commit()
            print(f"User {EMAIL} already existed — password reset, marked verified.")
        else:
            dev_user = User(
                email=EMAIL,
                name="Dev User",
                hashed_password=hash_password(PASSWORD),
                email_verified=True,
            )
            session.add(dev_user)
            session.commit()
            session.refresh(dev_user)
            print(f"Created user {EMAIL}.")

        pref = session.exec(
            select(Preference).where(Preference.user_id == dev_user.id)
        ).first()
        if not pref:
            # Pre-seeded preferences skip the /welcome wizard and the dashboard
            # tour, landing straight on the dashboard after sign-in. To test
            # onboarding itself, register a fresh account instead (verification
            # links print to the backend console when RESEND_API_KEY is unset).
            session.add(
                Preference(
                    user_id=dev_user.id,
                    strategy_name="Balanced",
                    needs_pct=50,
                    wants_pct=30,
                    savings_pct=20,
                    week_starts_on="Monday",
                    income_type="Salary",
                    salary_amount=1000,
                    salary_frequency="Monthly",
                    tutorial_completed=True,
                )
            )
            session.commit()
            print("Seeded preferences (50/30/20 split, tour marked as seen).")

    print(
        f"\nSign in at http://localhost:3000/auth/signin with:\n"
        f"  Email:    {EMAIL}\n"
        f"  Password: {PASSWORD}"
    )


if __name__ == "__main__":
    main()
