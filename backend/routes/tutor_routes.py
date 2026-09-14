"""routes/tutor_routes.py — AI Tutor explain, diagram, and notes endpoints."""

from flask import Blueprint, request, jsonify, g
from database import get_db
from models import (
    get_or_create_topic, get_learner_profile,
    create_learning_session, create_note
)
from services.adaptive_service import get_difficulty, get_weak_concepts
from ai.explain import generate_explanation, generate_diagram
from ai.notes_generator import generate_notes
from routes.middleware import require_auth
from utils.error_handling import handle_errors, openai_error_handler

tutor_bp = Blueprint("tutor", __name__)


@tutor_bp.route("/api/tutor/explain", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def explain():
    """
    Body: { topic: str, follow_up_question?: str }
    Returns: { explanation, key_points, difficulty, topic_id, session_id }
    """
    data = request.get_json()
    topic_name = (data.get("topic") or "").strip()
    follow_up = data.get("follow_up_question") or None
    lang = data.get("lang", "en")  # 'en' | 'hi' | 'or' | 'bn'

    if not topic_name:
        raise ValueError("Topic name is required.")

    user_id = g.user_id
    conn = get_db()
    try:
        topic = get_or_create_topic(conn, topic_name)
        topic_id = topic["id"]

        difficulty = get_difficulty(conn, user_id, topic_id)
        weak_topics = get_weak_concepts(conn, user_id, topic_id)

        explanation = generate_explanation(topic_name, difficulty, weak_topics, follow_up, lang=lang)

        session_id = create_learning_session(conn, user_id, topic_id, difficulty)

        # Extract key points — flexible parse: find the Key Takeaways section
        key_points = []
        takeaways_header = None
        for pattern in ["Key Takeaways:", "**Key Takeaways:**", "## Key Takeaways", "Key Takeaways"]:
            if pattern in explanation:
                takeaways_header = pattern
                break
        if takeaways_header:
            after = explanation.split(takeaways_header)[1].strip()
            for line in after.split("\n"):
                line = line.strip().lstrip("•-* 0123456789.)")
                if line:
                    key_points.append(line)

        return jsonify({
            "explanation": explanation,
            "key_points": key_points[:5],
            "difficulty": difficulty,
            "weak_topics": weak_topics,
            "topic_id": topic_id,
            "topic_name": topic_name,
            "session_id": session_id,
        })
    finally:
        conn.close()


@tutor_bp.route("/api/tutor/diagram", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def diagram():
    """
    Body: { topic: str, explanation_context?: str }
    Returns: { mermaid: str }
    """
    data = request.get_json()
    topic_name = (data.get("topic") or "").strip()
    context = data.get("explanation_context") or topic_name

    if not topic_name:
        raise ValueError("Topic name is required.")

    diagram_code = generate_diagram(topic_name, context)
    return jsonify({"mermaid": diagram_code})


@tutor_bp.route("/api/tutor/notes", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def generate_notes_route():
    """
    Body: { topic: str, explanation: str, topic_id?: int }
    Returns: { note_id: int, content: str }
    """
    data = request.get_json()
    topic_name = (data.get("topic") or "").strip()
    explanation = (data.get("explanation") or "").strip()
    topic_id_hint = data.get("topic_id")

    if not topic_name or not explanation:
        raise ValueError("Topic and explanation are required.")

    user_id = g.user_id
    conn = get_db()
    try:
        if topic_id_hint:
            topic_id = topic_id_hint
        else:
            topic = get_or_create_topic(conn, topic_name)
            topic_id = topic["id"]

        notes_content = generate_notes(topic_name, explanation)
        note_id = create_note(conn, user_id, topic_id, f"{topic_name} — Notes", notes_content)

        return jsonify({
            "note_id": note_id,
            "title": f"{topic_name} — Notes",
            "content": notes_content,
        }), 201
    finally:
        conn.close()
