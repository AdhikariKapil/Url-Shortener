from datetime import date, timedelta


def get_clicks_last_7_days(db, alias):
    # Returns clicks per day for last 7 days as daily_clicks dict
    cursor = db.cursor()

    today = date.today()
    start_date = today - timedelta(days=6)

    cursor.execute(
        """
        SELECT click_date, click_count
        FROM daily_clicks
        WHERE alias = ? AND click_date BETWEEN ? AND ?
        ORDER BY click_date ASC
        """,
        (alias, start_date.isoformat(), today.isoformat()),
    )

    rows = cursor.fetchall()

    # Create a dictionary of clicks indexed by date string
    daily_clicks = {}
    for row in rows:
        # Ensure date is stored as ISO string
        date_str = (
            row["click_date"]
            if isinstance(row["click_date"], str)
            else str(row["click_date"])
        )
        daily_clicks[date_str] = row["click_count"]

    # Fill missing dates with 0 clicks
    for i in range(7):
        current_date = (today - timedelta(days=(6 - i))).isoformat()
        if current_date not in daily_clicks:
            daily_clicks[current_date] = 0

    return {
        "daily_clicks": daily_clicks,
        "total_clicks": get_total_clicks(db, alias),
    }


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
    # Return analytics for all URLs in structured format
    cursor = db.cursor()

    cursor.execute("""
        SELECT alias, original_url
        FROM urls 
        ORDER BY created_at DESC
    """)
    urls = cursor.fetchall()

    result = []
    for url in urls:
        analytics = get_clicks_last_7_days(db, url["alias"])
        result.append(
            {
                "alias": url["alias"],
                "original_url": url["original_url"],
                "total_clicks": analytics["total_clicks"],
                "daily_clicks": analytics["daily_clicks"],
            }
        )
    return result
