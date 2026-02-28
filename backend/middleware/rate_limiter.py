import time
import os
from redis.exceptions import NoScriptError
from functools import wraps
from flask import request, jsonify, current_app

from services.redis_service import get_redis

lua_script = None


def load_lua():
    global lua_script
    redis = get_redis()

    path = os.path.join(
        os.path.dirname(__file__), "../services/sliding_window_atomicity.lua"
    )
    path = os.path.abspath(path)
    with open(path) as f:
        script = f.read()

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
            try:
                allowed, retry_after = lua_script(  # pyright: ignore
                    keys=[key],
                    args=[now, window, limit],
                )
            except NoScriptError:
                # Redis lost the script on restart or re-register_script
                load_lua()
                allowed, retry_after = lua_script(  # pyright: ignore
                    keys=[key],
                    args=[now, window, limit],
                )

            if not allowed and not retry_after:
                raise RuntimeError("Lua Script returned None")

            if int(allowed) == 0:
                current_app.logger.warning(
                    f"RATE LIMIT BLOCKED ip={ip} reason='Too many Request' retry_after={retry_after}"
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
