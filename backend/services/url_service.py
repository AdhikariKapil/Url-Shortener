from models.url_model import create_alias, get_original_url, increment_clicks
from urllib.parse import urlparse
import string
import random
import socket


def is_valid_url(url):
    try:
        # when parsing the url it gives schemes, netloc(domain), etc using which we check the url
        result = urlparse(url)
        return result.scheme in ("http", "https") and result.netloc != ""
    except Exception:
        return False


def is_resolves(url):
    try:
        result = urlparse(url)
        hostname = result.netloc.split(":")[0]  # Removes if there is any port
        socket.gethostbyname(hostname)
        return True
    except socket.gaierror:
        return False


def generate_alias(length=6):
    chars = string.ascii_letters + string.digits
    return "".join(random.choices(chars, k=length))


def shorten_url(db, original_url):
    original_url = original_url.strip()

    # Check Validation
    if not is_valid_url(original_url):
        return None, "Invalid URL"

    # Check Exists or not
    if not is_resolves(original_url):
        return None, "Unresolved"

    # Check Duplication
    existing = db.execute(
        "SELECT alias from urls WHERE original_url = ?", (original_url,)
    ).fetchone()

    if existing:
        return existing["alias"], "EXISTING!"

    # Generate Random alias
    alias = generate_alias()

    # Check if the alias exists if yes we regenerate new alias.
    while get_original_url(db, alias):  # Repeat until unique
        alias = generate_alias()

    # Save to db
    create_alias(db, original_url, alias)
    return alias, "SUCCESS"


def handle_redirect(db, alias):
    original_url = get_original_url(db, alias)

    if not original_url:
        return None

    increment_clicks(db, alias)

    return original_url
