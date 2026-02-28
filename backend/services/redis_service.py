# This is the redis connection

import redis
import time

redis_client = None


def init_redis(app):
    global redis_client

    redis_client = redis.Redis(
        host=app.config["REDIS_HOST"],
        port=app.config["REDIS_PORT"],
        decode_responses=True,
        # If redis freezes server waits forever so to prevent it
        socket_connect_timeout=2,
        socket_timeout=2,
    )

    for attempt in range(5):
        try:
            redis_client.ping()
            app.logger.warning("REDIS CONNECTED SUCCESSFULLY.")
            break
        except Exception as error:
            app.logger.error(
                f"REDIS CONNECTION FAILED, reason = '{str(error)}' redis retry {attempt+1}"
            )
            time.sleep(2)


def get_redis():
    global redis_client

    if not redis_client:
        raise Exception("Redis not initialized.")
    return redis_client
