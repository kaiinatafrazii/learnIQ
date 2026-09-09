"""routes/progress_routes.py — GET /api/progress (chart data)"""

from flask import Blueprint, jsonify, g
from database import get_db
from models import get_all_topic_progress, get_recent_quizzes, get_streak
from routes.middleware import require_auth
from utils.error_handling import handle_errors

progress_bp = Blueprint("progress", __name__)


@progress_bp.route("/api/progress", methods=["GET"])
@require_auth
@handle_errors
def get_progress():
    """
    Returns chart-ready data:
    - topic_mastery: [{topic_name, mastery_score, quiz_accuracy, attempts}]
    - quiz_history: [{topic_name, score, total, accuracy, date}]
    - streak: int
    """
    user_id = g.user_id
    conn = get_db()
    try:
        topic_progress = get_all_topic_progress(conn, user_id)
        recent_quizzes = get_recent_quizzes(conn, user_id, limit=10)
        streak = get_streak(conn, user_id)

        quiz_history = []
        for q in recent_quizzes:
            acc = round(q["score"] / q["total_questions"] * 100, 1) if q["total_questions"] else 0
            quiz_history.append({
                "topic_name": q["topic_name"],
                "score": q["score"],
                "total": q["total_questions"],
                "accuracy": acc,
                "difficulty": q["difficulty"],
                "date": q["created_at"][:10],  # ISO date only
            })

        return jsonify({
            "topic_mastery": topic_progress,
            "quiz_history": quiz_history,
            "streak": streak,
        })
    finally:
        conn.close()
