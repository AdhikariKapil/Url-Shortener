import time
from pathlib import Path
from functools import wraps
from flask import request, jsonify, current_app

from services.redis_service import get_redis

lua_script = None


def load_lua():
    global lua_script
    redis = get_redis()

    path = Path(
        "~/dev/url_shortener/backend/services/sliding_window_atomicity.lua"
    ).expanduser()
    with open(path) as f:
        script = f.read()

    # calling script becomes async
    lua_script = redis.register_script(script)
    current_app.logger.info("RATE LIMIT LUA SCRIPT REGISTERED")


def rate_limit(limit=5, window=60):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            global lua_script

            if lua_script is None:
                load_lua()
            assert lua_script is not None

            ip = request.remote_addr
            if not ip:
                raise RuntimeError("IP not found in request.")

            key = f"rate_limit:{ip}"
            now = int(time.time())

            # "Awaitable[str] is not iterable" is a type-hint confusion caused by redis-py 5.x stubs + Lua Script typing.
            allowed, retry_after = lua_script(  # pyright: ignore
                keys=[key], args=[now, window, limit]
            )

            if not allowed and not retry_after:
                raise RuntimeError("Lua Script returned None")

            if int(allowed) == 0:
                current_app.logger.warning(
                    f"RATE LIMIT BLOCKED ip={ip} retry_after={retry_after}"
                )
                return (
                    jsonify(
                        {"error": "Too Many Request", "retry_after": int(retry_after)}
                    ),
                    429,
                )

            current_app.logger.info(f"RATE LIMIT ALLOWED ip={ip}")

            return func(*args, **kwargs)

        return wrapper

    return decorator
