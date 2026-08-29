"""Application configuration (pydantic-settings).

All runtime configuration (DB connection, API key, session/login settings,
timezone, odometer reading) is defined here and loaded from .env or environment
variables.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env file.

    Sensitive values (keys) and deployment-specific values (DB URL, odometer) are
    kept out of source control. Pydantic-settings automatically validates types.
    """

    database_url: str
    shortcut_api_key: str

    # Browser login (the human half of auth; shortcut_api_key above is the
    # machine half). Both are required — no defaults, so a deployment that
    # forgot to set them fails to boot instead of running on a guessable
    # secret. Generate a hash with:  python -m app.auth
    session_secret: str
    admin_password_hash: str
    # Set false for local http development, or the browser drops the cookie
    # and login silently never sticks.
    session_cookie_secure: bool = True
    session_max_age: int = 60 * 60 * 24 * 14  # 14 days

    app_timezone: str = "Asia/Taipei"
    tesla_odometer_km: int = 22937

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance loaded from environment / .env file.

    Using lru_cache means the .env is read only once per process (good for performance
    and to avoid repeated file I/O). All configuration (DB URL, API keys, timezone, etc.)
    lives here.
    """
    return Settings()
