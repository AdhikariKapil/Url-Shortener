import os
from os.path import exists
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "fallback-dev-key",
    )

    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = os.getenv("REDIS_PORT", 6379)

    INSTANCES_FOLDER = os.path.join(BASE_DIR, "instances")
    os.makedirs(INSTANCES_FOLDER, exist_ok=True)
    DATABASE = os.path.join(BASE_DIR, "instances", "database.db")

    # Request size max 1MB to prevent big sized requests.
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024
