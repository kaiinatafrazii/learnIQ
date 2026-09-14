"""
app.py — Flask application factory.
Run with: python app.py
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_db
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.tutor_routes import tutor_bp
from routes.notes_routes import notes_bp
from routes.quiz_routes import quiz_bp
from routes.chat_routes import chat_bp
from routes.voice_routes import voice_bp
from routes.performance_routes import performance_bp
from routes.progress_routes import progress_bp
from routes.image_routes import image_bp

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

    # ── CORS ────────────────────────────────────────────────────────────────
    cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    CORS(app, origins=[cors_origin], supports_credentials=True)

    # ── Register Blueprints ─────────────────────────────────────────────────
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(tutor_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(voice_bp)
    app.register_blueprint(performance_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(image_bp)

    # ── Health check ────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "LearnIQ API"}

    return app


from a2wsgi import WSGIMiddleware
import uvicorn

# ── Initialise DB and expose ASGI app for Uvicorn ───────────────────────────
init_db()
flask_app = create_app()
app = WSGIMiddleware(flask_app)

if __name__ == "__main__":
    print("[LearnIQ] Backend running on http://localhost:5000 via Uvicorn")
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)

