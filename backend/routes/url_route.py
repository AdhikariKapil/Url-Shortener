from flask import Blueprint, jsonify, request, current_app, abort
from models.database import get_db
from services.url_service import shorten_url
from middleware.rate_limiter import rate_limit
from services.url_service import handle_redirect

url_bp = Blueprint("url", __name__)


@url_bp.route("/shorten", methods=["POST"])
@rate_limit(limit=1, window=60)
def shorten_url_route():
    try:
        data = request.get_json()
        if not data or "url" not in data:
            current_app.logger.warning(
                f"SHORTEN FAILED ip={request.remote_addr} reason ='No URL Provided.' "
            )
            return jsonify({"error": "URL is required."}), 400  # syntatically wrong

        db = get_db()
        alias, status = shorten_url(db, data["url"])

        if status == "Invalid URL":
            current_app.logger.warning(
                f"SHORTEN FAILED ip={request.remote_addr} url='{data['url']}' reason = 'Invalid URL'"
            )
            return (
                jsonify({"error": "Invalid URL"}),
                422,
            )  # syntatically correct but the data is invalid

        elif status == "EXISTING!":
            current_app.logger.info(
                f"SHORTEN EXISTING ip={request.remote_addr} url='{data['url']} alias='{alias}'"
            )
            return jsonify({"alias": alias}), 200

        elif status == "Unresolved":
            current_app.logger.warning(
                f"SHORTEN FAILED ip = {request.remote_addr} url = {data['url']} reason = 'No address associated with hostname'"
            )
            return jsonify({"error": "URL doesnot exists."}), 404

        else:
            current_app.logger.info(
                f"SHORTEN CREATED ip={request.remote_addr} url = '{data['url']}' alias = '{alias}'"
            )
            return jsonify({"alias": alias}), 201

    except Exception as e:
        current_app.logger.exception(
            f"SHORTEN FAILED ip={request.remote_addr} reason = {e}"
        )
        return jsonify({"error": str(e)}), 500


@url_bp.route("/alias/<alias>", methods=["GET"])
def get_alias_url(alias: str):
    try:
        db = get_db()

        original_url = handle_redirect(db, alias)

        if not original_url:
            current_app.logger.warning(
                f"ALIAS LOOKUP FAILED ip={request.remote_addr} alias={alias} reason='URL Not Found'"
            )
            return jsonify({"error": "Alias not found"}), 404

        current_app.logger.info(
            f"ALIAS LOOKUP SUCCESS ip={request.remote_addr} alias={alias} url={original_url}"
        )
        return jsonify({"original_url": original_url}), 200

    except Exception as e:
        current_app.logger.exception(
            f"ALIAS LOOKUP FAILED ip={request.remote_addr} alias={alias} reason={e}"
        )
        return jsonify({"error": str(e)}), 500

