from .health_route import health_bp
from .url_route import url_bp
from .analytics_route import analytics_bp


def register_routes(app):
    # API routes with /api prefix
    app.register_blueprint(url_bp, url_prefix="/api")
    app.register_blueprint(analytics_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
