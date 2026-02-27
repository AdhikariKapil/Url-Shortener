from datetime import datetime, timezone, date


def create_alias(db, original_url, alias):
    cursor = db.cursor()
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


def get_original_url(db, alias):
    cursor = db.cursor()
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


def increment_clicks(db, alias):
    cursor = db.cursor()
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
