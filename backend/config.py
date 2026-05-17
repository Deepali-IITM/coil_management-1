import os

class Config:
    DEBUG = False
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECURITY_PASSWORD_HASH = "bcrypt"
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = 3600
    WTF_CSRF_ENABLED = False
    CACHE_DEFAULT_TIMEOUT = 30


class LocalDevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.sqlite3"
    DEBUG = True
    SECURITY_PASSWORD_SALT = "thisshouldbekeptsecret"
    SECRET_KEY = "shouldbekeyveryhidden"
    CACHE_TYPE = "SimpleCache"


class ElectronConfig(Config):
    """Used inside the packaged Electron desktop app (ELECTRON_RUN=1).
    Reads DATABASE_URL / SECRET_KEY / SECURITY_PASSWORD_SALT from the
    environment variables injected by electron/main.js at launch time.
    """
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///database.sqlite3")
    SQLALCHEMY_DATABASE_URI = _db_url
    DEBUG = False
    SECRET_KEY          = os.environ.get("SECRET_KEY",           "coilms-desktop-fallback-key")
    SECURITY_PASSWORD_SALT = os.environ.get("SECURITY_PASSWORD_SALT", "coilms-desktop-fallback-salt")
    CACHE_TYPE = "SimpleCache"


class ProductionConfig(Config):
    # Render's PostgreSQL connection strings start with "postgres://" which
    # SQLAlchemy 1.4+ requires as "postgresql://".
    _db_url = os.environ.get("DATABASE_URL", "sqlite:///database.sqlite3")
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    DEBUG = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-render-env")
    SECURITY_PASSWORD_SALT = os.environ.get(
        "SECURITY_PASSWORD_SALT", "change-me-in-render-env"
    )
    CACHE_TYPE = "SimpleCache"
