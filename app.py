import os
from flask import Flask
from flask_caching import Cache
from flask_cors import CORS
from flask_security import Security, SQLAlchemyUserDatastore
import flask_excel as excel

from backend.models import db, User, Role


def createApp():
    app = Flask(
        __name__,
        template_folder="frontend/templates",
        static_folder="frontend/static",
    )

    # Allow all origins in production (Render URL is unknown at build time).
    # Restrict to specific origins in local dev if needed.
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Config: use ProductionConfig on Render, LocalDevelopmentConfig elsewhere.
    if os.environ.get("RENDER"):
        from backend.config import ProductionConfig
        app.config.from_object(ProductionConfig)
    else:
        from backend.config import LocalDevelopmentConfig
        app.config.from_object(LocalDevelopmentConfig)

    # Ensure the instance folder exists so SQLite can create the DB file.
    os.makedirs(app.instance_path, exist_ok=True)

    db.init_app(app)

    cache = Cache(app)
    app.cache = cache

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore=datastore, register_blueprint=False)

    app.app_context().push()

    return app


app = createApp()

import backend.create_initial_data  # noqa: E402  sets up DB + seed data
import backend.routes                # noqa: E402  registers all API routes

excel.init_excel(app)

if __name__ == "__main__":
    app.run()
