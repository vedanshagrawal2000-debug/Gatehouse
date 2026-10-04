"""
GATEHOUSE Migration Runner
Applies Supabase PostgreSQL migrations.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path to allow importing config
API_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(API_DIR))

from config import settings


def apply_migrations():
    print("================================================================")
    print("GATEHOUSE Database Migration Runner (Supabase PostgreSQL)")
    print("================================================================\n")

    root_dir = API_DIR.parent.parent
    migrations_dir = root_dir / "supabase" / "migrations"

    if not migrations_dir.exists():
        print(f"Error: Migrations directory not found at {migrations_dir}")
        sys.exit(1)

    migration_files = sorted(list(migrations_dir.glob("*.sql")))
    print(f"Discovered {len(migration_files)} migration files in {migrations_dir.relative_to(root_dir)}:")
    for f in migration_files:
        print(f"  • {f.name}")

    db_url = settings.DATABASE_URL
    if db_url and db_url.startswith("postgresql"):
        print(f"\nTarget Database: Configured via DATABASE_URL")
        try:
            import psycopg2
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            for f in migration_files:
                print(f"Executing {f.name} ...")
                sql = f.read_text(encoding="utf-8")
                cursor.execute(sql)
            conn.commit()
            cursor.close()
            conn.close()
            print("\n✓ All migrations successfully applied to Supabase PostgreSQL!")
            return
        except ImportError:
            print("Note: psycopg2 not installed. Install with `pip install psycopg2-binary` to apply directly via DB connection.")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            sys.exit(1)
    else:
        print("\nNote: DATABASE_URL not set in apps/api/.env.")
        print("To apply migrations directly to a remote Supabase instance:")
        print("  1. Copy your Supabase PostgreSQL connection string to DATABASE_URL in apps/api/.env")
        print("  2. Or run migrations in your Supabase Dashboard SQL Editor:")
        for f in migration_files:
            print(f"     - {f.name}")
        print("\nLocal in-memory verification can be run via: npm run db:verify")


if __name__ == "__main__":
    apply_migrations()
