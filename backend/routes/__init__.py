from .health_route import health_bp
from .url_route import url_bp
from .analytics_route import analytics_bp


def register_routes(app):
    app.register_blueprint(analytics_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(url_bp)
