"""
routes/middleware.py — JWT auth middleware for protected routes.
Import `require_auth` decorator in any route that needs authentication.
"""

import jwt
from functools import wraps
from flask import request, jsonify, g
from services.auth_service import decode_token
from database import get_db
from models import get_user_by_id


def require_auth(f):
    """Decorator: validates Bearer JWT and sets g.user_id + g.user."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required. Please log in."}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token. Please log in again."}), 401

        conn = get_db()
        try:
            user = get_user_by_id(conn, payload["user_id"])
            if not user:
                return jsonify({"error": "User not found."}), 401
            g.user_id = user["id"]
            g.user = user
            g.conn = conn
        finally:
            # Note: we keep conn open for the route; close in route or use teardown
            pass

        return f(*args, **kwargs)
    return wrapper
