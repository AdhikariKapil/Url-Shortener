from flask import Flask
from config import Config
from extensions import cors
from models.database import close_db
from models.init_db import init_db
from routes import register_routes
from services.redis_service import init_redis


def create_app():
    # instance_relative_config is used so it overide default app config with instance config as i am using sqlite for development from app config but for production.
    # I am using mysql because of sqlites weak concurrency handling.

    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    # extension
    cors.init_app(app)

    # register teardown
    # ensures close_db is called after every request even if there is an error.
    app.teardown_appcontext(close_db)

    # register blueprints
    register_routes(app)

    # initialize db inside app context for current_app.
    with app.app_context():
        init_db()
        init_redis(app)

    return app


app = create_app()

if __name__ == "__main__":
    app.run("0.0.0.0", port=5000, debug=True)
