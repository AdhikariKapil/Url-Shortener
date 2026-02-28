from flask import Flask, send_from_directory
from config import Config
from extensions import cors
from models.database import close_db
from models.init_db import init_db
from routes import register_routes
from services.redis_service import init_redis
import os
import logging


def create_app():
    # instance_relative_config is used so it overide default app config with instance config as i am using sqlite for development from app config but for production.
    # I am using mysql because of sqlites weak concurrency handling.

    app = Flask(
        __name__,
        instance_relative_config=True,
        static_folder="static",
        static_url_path="",
    )
    app.config.from_object(Config)

    # extension
    cors.init_app(app)

    # Configure logger
    if not app.logger.handlers:
        handler = logging.StreamHandler()
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
        )
        handler.setFormatter(formatter)
        app.logger.addHandler(handler)

    app.logger.setLevel(logging.INFO)

    # register teardown
    # ensures close_db is called after every request even if there is an error.
    app.teardown_appcontext(close_db)

    # register blueprints
    register_routes(app)

    init_redis(app)

    # initialize db inside app context for current_app.
    with app.app_context():
        init_db()

    # Serve React frontend
    @app.route("/")
    def serve_root():
        assert app.static_folder is not None
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static(path):
        # Don't serve API routes through static handler
        if path.startswith("api/"):
            # Let Flask handle 404 for API routes
            from flask import abort

            abort(404)

        # Try to serve static file
        assert app.static_folder is not None
        static_path = os.path.join(app.static_folder, path)
        if os.path.isfile(static_path):
            return send_from_directory(app.static_folder, path)

        # For all other paths, serve index.html (React Router handling)
        return send_from_directory(app.static_folder, "index.html")

    return app


app = create_app()


if __name__ == "__main__":
    app.run("0.0.0.0", port=5000)
