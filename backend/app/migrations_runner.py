"""
Applies the .sql files in backend/migrations/ at startup.

Why this exists: SQLModel's create_all() only CREATEs tables that are missing.
It never ALTERs a table that already exists, so adding a field to a model does
NOT add the column to a database that already has that table. On a live
database every new column has to arrive via explicit SQL.

Each file runs at most once — applied filenames are recorded in the
schema_migrations table. Files are executed in filename order, so prefix new
ones so they sort correctly (a date prefix works well).

Postgres only. Local SQLite dev databases get a correct schema from
create_all() because they're normally created from scratch; if a local
local.db has drifted, delete it and let it rebuild.
"""

import pathlib

from sqlalchemy import text

from app.database import engine

MIGRATIONS_DIR = pathlib.Path(__file__).resolve().parent.parent / "migrations"


def run_migrations() -> None:
    if engine.dialect.name != "postgresql":
        print(f"[migrations] Skipped — dialect is '{engine.dialect.name}', not postgresql.")
        return

    if not MIGRATIONS_DIR.is_dir():
        print(f"[migrations] No migrations directory at {MIGRATIONS_DIR}")
        return

    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not files:
        print("[migrations] No .sql files found.")
        return

    with engine.begin() as conn:
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            " filename TEXT PRIMARY KEY,"
            " applied_at TIMESTAMP NOT NULL DEFAULT NOW())"
        ))
        applied = {row[0] for row in conn.execute(text("SELECT filename FROM schema_migrations"))}

    pending = [f for f in files if f.name not in applied]
    if not pending:
        print(f"[migrations] Up to date ({len(applied)} already applied).")
        return

    for path in pending:
        sql = path.read_text().strip()
        if not sql:
            continue
        print(f"[migrations] Applying {path.name} …")
        try:
            # Each migration commits with its bookkeeping row, so a failure
            # halfway through leaves earlier migrations applied and recorded.
            with engine.begin() as conn:
                conn.execute(text(sql))
                conn.execute(
                    text("INSERT INTO schema_migrations (filename) VALUES (:f)"
                         " ON CONFLICT (filename) DO NOTHING"),
                    {"f": path.name},
                )
        except Exception as error:
            # Fail the deploy loudly. A half-migrated database serving traffic
            # produces far more confusing errors than a refused rollout.
            print(f"[migrations] FAILED on {path.name}: {error}")
            raise

        print(f"[migrations] Applied {path.name}")

    print(f"[migrations] Done — {len(pending)} applied.")
