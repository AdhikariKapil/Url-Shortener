# This is the redis connection

import redis
from flask import current_app

redis_client = None


def init_redis(app):
    global redis_client

    redis_client = redis.Redis(
        host=app.config["REDIS_HOST"],
        port=app.config["REDIS_PORT"],
        decode_responses=True,
    )

    try:
        redis_client.ping()
        app.logger.info("REDIS CONNECTED SUCCESSFULLY.")
    except Exception as error:
        app.logger.error(f"REDIS CONNECTION FAILED, reason = '{str(error)}'")
        raise error


def get_redis():
    global redis_client

    if not redis_client:
        raise Exception("Redis not initialized.")
    return redis_client
