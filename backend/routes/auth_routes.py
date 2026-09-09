"""routes/auth_routes.py — Register and Login endpoints."""

from flask import Blueprint, request, jsonify
from database import get_db
from models import get_user_by_email, create_user
from services.auth_service import hash_password, verify_password, generate_token
from utils.error_handling import handle_errors

auth_bp = Blueprint("auth", __name__)

VALID_EDUCATION_LEVELS = {"school", "diploma", "undergraduate", "graduate", "other"}


@auth_bp.route("/api/auth/register", methods=["POST"])
@handle_errors
def register():
    data = request.get_json()
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    education_level = (data.get("education_level") or "").strip().lower()

    if not name or not email or not password or not education_level:
        raise ValueError("Name, email, password, and education level are required.")
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters.")
    if education_level not in VALID_EDUCATION_LEVELS:
        raise ValueError(f"Education level must be one of: {', '.join(VALID_EDUCATION_LEVELS)}.")

    conn = get_db()
    try:
        existing = get_user_by_email(conn, email)
        if existing:
            return jsonify({"error": "An account with this email already exists."}), 409

        user_id = create_user(conn, name, email, hash_password(password), education_level)
        token = generate_token(user_id, email)
        return jsonify({
            "message": "Account created successfully.",
            "token": token,
            "user": {"id": user_id, "name": name, "email": email,
                     "education_level": education_level}
        }), 201
    finally:
        conn.close()


@auth_bp.route("/api/auth/login", methods=["POST"])
@handle_errors
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        raise ValueError("Email and password are required.")

    conn = get_db()
    try:
        user = get_user_by_email(conn, email)
        if not user or not verify_password(password, user["password_hash"]):
            return jsonify({"error": "Invalid email or password."}), 401

        token = generate_token(user["id"], user["email"])
        return jsonify({
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "education_level": user["education_level"],
            }
        }), 200
    finally:
        conn.close()
