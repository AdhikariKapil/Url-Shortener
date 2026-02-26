from datetime import datetime, timezone, date
from models.database import get_db


def get_cursor():
    db = get_db()
    if db is None:
        raise RuntimeError("Database connection not initialized.")
    return db, db.cursor()


def create_alias(original_url: str, alias: str):
    db, cursor = get_cursor()
    cursor.execute(
        """
        INSERT INTO urls
        (original_url, alias, created_at)
        VALUES
        (?, ?, ?)
    """,
        (original_url, alias, datetime.now(timezone.utc)),
    )
    db.commit()


def get_original_url(alias: str):
    db, cursor = get_cursor()
    cursor.execute(
        """
            SELECT original_url
            FROM urls
            WHERE alias = ?
        """,
        (alias,),
    )

    row = cursor.fetchone()
    return row["original_url"] if row else None


def increment_clicks(alias: str):
    db, cursor = get_cursor()
    today = date.today()
    cursor.execute(
        """
        INSERT INTO daily_clicks(alias, click_date, click_count)
        VALUES (?, ?, 1)
        ON CONFLICT(alias, click_date)
        DO UPDATE SET click_count = click_count + 1
        """,
        (alias, today),
    )
    db.commit()
