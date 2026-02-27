from .database import get_db


# here cursor and commit gives error as not a known attribute for None because Current_app only works inside an active flask application context.
# To fix this, we need to ensure that the database connection is properly established before trying to access the cursor and commit methods.
# We can do this by using the Flask application context to initialize the database when the application starts.
# So we can ignore this error and assert db is not None.
def init_db():
    db = get_db()
    if db is None:
        raise RuntimeError("Database connection not initialized.")
    cursor = db.cursor()

    # URLs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS urls(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_url TEXT UNIQUE NOT NULL,
            alias TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP NOT NULL
        )
    """)

    # Clicks table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_clicks(
            alias TEXT NOT NULL,
            click_date DATE NOT NULL,
            click_count INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY(alias, click_date),
            FOREIGN KEY(alias) REFERENCES urls(alias) ON DELETE CASCADE
        );

    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_daily_clicks_alias_date
        ON daily_clicks(alias, click_date);
    """)

    db.commit()
