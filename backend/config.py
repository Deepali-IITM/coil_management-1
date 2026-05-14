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


class ProductionConfig(Config):
    # Render places the working dir at /opt/render/project/src.
    # Flask's instance folder sits inside that dir; sqlite:/// is relative to it.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///database.sqlite3",
    )
    DEBUG = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-render-env")
    SECURITY_PASSWORD_SALT = os.environ.get(
        "SECURITY_PASSWORD_SALT", "change-me-in-render-env"
    )
    CACHE_TYPE = "SimpleCache"
