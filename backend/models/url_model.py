from flask import g
from datetime import datetime, timezone


def create_alias(db, original_url, alias):
    cursor = db.cursor()

    cursor(
        """
        INSERT INTO urls
        (original_url, alias, created_at)
        VALUES
        (?, ?, ?)
    """,
        (original_url, alias, datetime.now(timezone.utc)),
    )
