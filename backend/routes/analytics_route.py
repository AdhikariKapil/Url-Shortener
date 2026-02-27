from flask import Blueprint, jsonify, current_app
from models.init_db import get_db
from services.analytics_service import get_all_urls_with_analytics

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/analytics", methods=["GET"])
def analytics():
    try:
        db = get_db()

        urls_data = get_all_urls_with_analytics(db)
        current_app.logger.info(f"Returning analytics for all {len(urls_data)} URLs.")
        return jsonify({"urls": urls_data}), 200

    except Exception as error:
        current_app.logger.exception(f"Failed to fetch analytics: {error}")
        return jsonify({"error": "Internal Server Error"}), 500
