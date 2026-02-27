from flask import Blueprint, jsonify, request, current_app, redirect, abort
from models.database import get_db
from services.url_service import shorten_url, handle_redirect
from middleware.rate_limiter import rate_limit

url_bp = Blueprint("url", __name__)


@url_bp.route("/shorten", methods=["POST"])
@rate_limit(limit=2, window=60)
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
def redirect_url(alias: str):
    try:
        db = get_db()

        if alias == "favicon.ico":
            abort(404)

        original_url = handle_redirect(db, alias)

        if not original_url:
            current_app.logger.warning(
                f"REDIRECT FAILED ip={request.remote_addr} alias={alias} reason = 'URL Not Found'"
            )
            abort(404, description="Alias not found.")

        current_app.logger.info(
            f"REDIRECT SUCCESS ip={request.remote_addr} alias={alias} url = {original_url}"
        )
        return redirect(original_url, code=302)  # found

    except Exception as e:
        if alias == "favicon.ico":
            abort(400)
        current_app.logger.exception(
            f"REDIRECT FAILED ip = {request.remote_addr} alias = {alias} reason = {e}"
        )
        abort(500, description="Internal Server Error")
