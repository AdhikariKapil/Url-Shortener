from models.url_model import get_original_url, increment_clicks


def handle_redirect(alias: str):
    original_url = get_original_url(alias)

    if not original_url:
        return None
