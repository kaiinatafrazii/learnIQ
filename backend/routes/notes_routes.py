"""routes/notes_routes.py — CRUD for student notes."""

from flask import Blueprint, request, jsonify, g
from database import get_db
from models import (
    get_notes_for_user, get_note_by_id,
    create_note, update_note, delete_note,
    get_or_create_topic
)
from routes.middleware import require_auth
from utils.error_handling import handle_errors

notes_bp = Blueprint("notes", __name__)


@notes_bp.route("/api/notes", methods=["GET"])
@require_auth
@handle_errors
def list_notes():
    conn = get_db()
    try:
        notes = get_notes_for_user(conn, g.user_id)
        return jsonify({"notes": notes})
    finally:
        conn.close()


@notes_bp.route("/api/notes", methods=["POST"])
@require_auth
@handle_errors
def create_note_route():
    data = request.get_json()
    topic_name = (data.get("topic") or "").strip()
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()

    if not title or not content:
        raise ValueError("Title and content are required.")

    conn = get_db()
    try:
        topic = get_or_create_topic(conn, topic_name or title)
        note_id = create_note(conn, g.user_id, topic["id"], title, content)
        return jsonify({"note_id": note_id, "message": "Note saved."}), 201
    finally:
        conn.close()


@notes_bp.route("/api/notes/<int:note_id>", methods=["GET"])
@require_auth
@handle_errors
def get_note(note_id):
    conn = get_db()
    try:
        note = get_note_by_id(conn, note_id, g.user_id)
        if not note:
            raise LookupError("Note not found.")
        return jsonify({"note": note})
    finally:
        conn.close()


@notes_bp.route("/api/notes/<int:note_id>", methods=["PUT"])
@require_auth
@handle_errors
def update_note_route(note_id):
    data = request.get_json()
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()

    if not title or not content:
        raise ValueError("Title and content are required.")

    conn = get_db()
    try:
        note = get_note_by_id(conn, note_id, g.user_id)
        if not note:
            raise LookupError("Note not found.")
        update_note(conn, note_id, g.user_id, title, content)
        return jsonify({"message": "Note updated."})
    finally:
        conn.close()


@notes_bp.route("/api/notes/<int:note_id>", methods=["DELETE"])
@require_auth
@handle_errors
def delete_note_route(note_id):
    conn = get_db()
    try:
        note = get_note_by_id(conn, note_id, g.user_id)
        if not note:
            raise LookupError("Note not found.")
        delete_note(conn, note_id, g.user_id)
        return jsonify({"message": "Note deleted."})
    finally:
        conn.close()
