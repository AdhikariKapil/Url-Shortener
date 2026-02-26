import sqlite3
from flask import current_app, g


def get_db():

    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],  # get database filepath from config class.
            detect_types=sqlite3.PARSE_DECLTYPES,  # automatically convert declared column types. PARSE date, timestamp.
        )

        # row behave like dictornary now while still supporting tuple indexing
        # default (1, "https://example.com")
        # row[0]
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")

        return g.db


def close_db(e=None):

    # Remove db connection from g
    db = g.pop("db", None)

    # safely close db avoiding attribute error.
    if db is not None:
        db.close()
