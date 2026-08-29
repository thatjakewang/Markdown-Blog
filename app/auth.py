"""Single-user browser login: password hashing, session check, route guard.

This is the *human* half of authentication. The machine half — iPhone Shortcuts
and any automated collector — stays on the x-api-key header
(app/dependencies.py:verify_shortcut_api_key) and is deliberately untouched by
anything here: forcing a script through a login form would only mean teaching it
to POST one.

There is exactly one user, so there is no users table and no registration. The
password hash lives in .env (ADMIN_PASSWORD_HASH); the session is a signed
cookie (Starlette's SessionMiddleware), so nothing is stored server-side either.

Hashing uses hashlib.scrypt from the standard library rather than pulling in
passlib/bcrypt — the parameters below are the cost, and they are pinned in the
encoded string so they can be raised later without invalidating old hashes.

Generate a hash to paste into .env:

    python -m app.auth
"""

import hashlib
import secrets

from fastapi import HTTPException, Request

from app.config import get_settings

# scrypt cost parameters. n*r*128 bytes of memory (16 MiB here), which stays
# under OpenSSL's default 32 MiB maxmem, so no maxmem override is needed.
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 32
SALT_BYTES = 16

# The value stored in the session cookie. There is only ever one user; this is a
# marker that the cookie was issued by a real login, not an identity.
SESSION_USER = "admin"
SESSION_KEY = "user"


class LoginRequired(Exception):
    """Signed-out browser asked for a protected *page*.

    Deliberately not an HTTPException: html_error_handler in app/main.py turns
    every non-404/500 HTTPException into a JSON body and drops the headers with
    it, which would strip the Location off a 303. app/main.py registers a
    handler that turns this into a real redirect instead.
    """

    def __init__(self, next_path: str) -> None:
        self.next_path = next_path


def hash_password(password: str) -> str:
    """Hash a password into the 'scrypt$<salt_hex>$<hash_hex>' form kept in .env."""
    salt = secrets.token_bytes(SALT_BYTES)
    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return f"scrypt${salt.hex()}${derived.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    """Check a password against an encoded hash.

    Returns False for a wrong password *and* for a malformed or empty stored
    hash — a broken ADMIN_PASSWORD_HASH must lock the door, not raise a 500 that
    leaks the reason.
    """
    try:
        scheme, salt_hex, expected_hex = encoded.split("$")
        if scheme != "scrypt":
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(expected_hex)
    except (AttributeError, ValueError):
        return False

    if not salt or not expected:
        return False

    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=len(expected),
    )
    return secrets.compare_digest(derived, expected)


def check_password(password: str) -> bool:
    """Verify against the configured ADMIN_PASSWORD_HASH."""
    return verify_password(password, get_settings().admin_password_hash)


def is_logged_in(request: Request) -> bool:
    """True when this request carries a valid session cookie from a real login."""
    return request.session.get(SESSION_KEY) == SESSION_USER


def log_in(request: Request) -> None:
    request.session[SESSION_KEY] = SESSION_USER


def log_out(request: Request) -> None:
    request.session.clear()


def safe_next(raw: str | None, default: str = "/") -> str:
    """Sanitize a ?next= value down to a same-site path.

    Only a single leading slash is allowed. '//evil.com' and '/\\evil.com' are
    protocol-relative URLs in a browser, and 'https://evil.com' is not a path at
    all — all of them would turn the login page into an open redirect.
    """
    if not raw or not raw.startswith("/"):
        return default
    if raw.startswith("//") or raw.startswith("/\\"):
        return default
    return raw


def require_login(request: Request) -> None:
    """Dependency guarding private routes.

    Split by client, matching what html_error_handler already does for errors:
    an API caller gets a 401 it can act on, a browser gets sent to the login
    page with a ?next= pointing back at what it asked for.
    """
    if is_logged_in(request):
        return

    if request.url.path.startswith("/api/"):
        raise HTTPException(status_code=401, detail="Login required")

    next_path = request.url.path
    if request.url.query:
        next_path = f"{next_path}?{request.url.query}"
    raise LoginRequired(next_path=next_path)


if __name__ == "__main__":
    import getpass

    entered = getpass.getpass("Password: ")
    if entered != getpass.getpass("Confirm: "):
        raise SystemExit("Passwords did not match.")
    if not entered:
        raise SystemExit("Password must not be empty.")
    print("\nPaste into .env:\n")
    print(f"ADMIN_PASSWORD_HASH={hash_password(entered)}")
    print(f"SESSION_SECRET={secrets.token_urlsafe(48)}")
