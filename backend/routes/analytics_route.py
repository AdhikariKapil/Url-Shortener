from flask import Blueprint, jsonify, current_app
from models.init_db import get_db
from services.analytics_service import (
    get_all_urls_with_analytics,
    get_clicks_last_7_days,
)

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


@analytics_bp.route("/analytics/<alias>", methods=["GET"])
def analytics_for_alias(alias):
    try:
        db = get_db()
        urls_analytics = get_clicks_last_7_days(db, alias)
        current_app.logger.info(f"Returning analyics for alias: {alias}")
        return jsonify({alias: urls_analytics}), 200
    except Exception as error:
        current_app.logger.exception(
            f"Failed to fetch analysis for alias:{alias} => {error}"
        )
        return jsonify({"error": "Internal Server Error"}), 500
