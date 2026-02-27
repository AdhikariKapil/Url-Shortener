from datetime import date, timedelta


def get_clicks_last_7_days(db, alias):
    # Returns clicks per day for last 7 day
    cursor = db.cursor()

    today = date.today()
    start_date = today - timedelta(days=6)

    cursor.execute(
        """
        SELECT click_date, click_count
        FROM daily_clicks
        WHERE alias = ? AND click_date BETWEEN ? and ?
        ORDER BY click_date ASC
        """,
        (alias, start_date, today),
    )

    rows = cursor.fetchall()
    click_dict = {row["click_date"]: row["click_count"] for row in rows}

    # Filling missing date with 0 count
    return [
        {
            "date": (today - timedelta(days=i)).isoformat(),
            "count": click_dict.get((today - timedelta(days=i)).isoformat(), 0),
        }
        for i in range(6, -1, -1)
    ]


def get_total_clicks(db, alias):
    # Return total clicks for a given clicks
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT SUM(click_count) as total
        FROM daily_clicks
        WHERE alias = ?
        """,
        (str(alias),),
    )

    row = cursor.fetchone()
    return row["total"] if row["total"] else 0


def get_all_urls_with_analytics(db):
    # Return analytics for all URLs in structurred format
    cursor = db.cursor()

    cursor.execute("""
        SELECT alias, original_url
        FROM urls 
        ORDER BY created_at DESC
    """)
    urls = cursor.fetchall()

    result = []
    for url in urls:
        result.append(
            {
                "alias": url["alias"],
                "original_url": url["original_url"],
                "total_clicks": get_total_clicks(db, url["alias"]),
                "clicks_last_7_days": get_clicks_last_7_days(db, url["alias"]),
            }
        )
    return result
