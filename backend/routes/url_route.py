from flask import Blueprint, jsonify, request, current_app
from models.database import get_db
from services.shorten_service import shorten_url

url_bp = Blueprint("url", __name__)


@url_bp.route("/shorten", methods=["POST"])
def shorten_url_route():
    try:
        data = request.get_json()
        if not data or "url" not in data:
            current_app.logger.warning(
                f"SHORTEN FAILED ip={request.remote_addr} reason ='No URL Provided.' "
            )
            return jsonify({"error": "URL is required."}), 400

        db = get_db()
        alias, status = shorten_url(db, data["url"])

        if status == "Invalid URL":
            current_app.logger.warning(
                f"SHORTEN FAILED ip={request.remote_addr} url='{data['url']}' reason = 'Invalid URL'"
            )
            return jsonify({"error": "Invalid URL"})

        elif status == "EXISTING!":
            current_app.logger.info(
                f"SHORTEN EXISTING ip={request.remote_addr} url='{data['url']} alias='{alias}'"
            )
            return jsonify({"alias": alias}), 200

        else:
            current_app.logger.info(
                f"SHORTEN CREATED ip={request.remote_addr} url = '{data['url']}' alias = '{alias}'"
            )
            return jsonify({"alias": alias}), 201

    except Exception as e:
        current_app.logger.error(
            f"SHORTEN FAILED ip={request.remote_addr} reason = {e}"
        )
        return jsonify({"error": e})
