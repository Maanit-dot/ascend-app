"""
Database migration script to add v2 multi-user, security, and desktop fields.
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "../ascend.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

existing_cols = [col[1] for col in cursor.execute("PRAGMA table_info(users)").fetchall()]
new_cols = [
    ("username", "VARCHAR(64)"),
    ("password_hash", "VARCHAR(255)"),
    ("role", "VARCHAR(32) DEFAULT 'USER'"),
    ("is_suspended", "BOOLEAN DEFAULT 0"),
    ("suspension_reason", "VARCHAR(255)"),
    ("is_banned", "BOOLEAN DEFAULT 0"),
    ("ban_reason", "VARCHAR(255)"),
    ("banned_at", "DATETIME"),
    ("last_platform", "VARCHAR(32) DEFAULT 'website'")
]

for col_name, col_type in new_cols:
    if col_name not in existing_cols:
        cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type};")
        print(f"Added column {col_name}")

# Ensure unique index on username
try:
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);")
except Exception as e:
    print("Index error:", e)

# Promote owner email
cursor.execute("UPDATE users SET role = 'SUPER_ADMIN' WHERE LOWER(email) = 'maanitgupta23@gmail.com';")
conn.commit()
print("Migration and owner promotion complete!")
