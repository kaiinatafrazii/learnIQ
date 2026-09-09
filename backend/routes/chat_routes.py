"""routes/chat_routes.py — AI Chatbot endpoint."""

from flask import Blueprint, request, jsonify, g
from ai.chat import generate_chat_response
from routes.middleware import require_auth
from utils.error_handling import handle_errors, openai_error_handler

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/api/chat", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def chat():
    """
    Body: { message: str, current_topic?: str, mode?: 'short'|'deep'|'example', history?: [] }
    Returns: { response: str }
    """
    data = request.get_json()
    message = (data.get("message") or "").strip()
    current_topic = data.get("current_topic") or None
    mode = data.get("mode", "short")
    history = data.get("history", [])

    if not message:
        raise ValueError("Message cannot be empty.")

    if mode not in {"short", "deep", "example"}:
        mode = "short"

    response = generate_chat_response(message, current_topic, mode, history)
    return jsonify({"response": response})
