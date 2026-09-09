"""routes/performance_routes.py — GET /api/performance"""

from flask import Blueprint, request, jsonify, g
from database import get_db
from models import get_quiz_by_id, get_answers_for_quiz, get_questions_for_quiz
from routes.middleware import require_auth
from utils.error_handling import handle_errors

performance_bp = Blueprint("performance", __name__)


@performance_bp.route("/api/performance", methods=["GET"])
@require_auth
@handle_errors
def get_performance():
    """
    Query params: quiz_id (optional, defaults to most recent quiz)
    Returns: strong/weak areas + answers breakdown for a quiz.
    """
    user_id = g.user_id
    quiz_id = request.args.get("quiz_id", type=int)

    conn = get_db()
    try:
        if not quiz_id:
            row = conn.execute(
                "SELECT id FROM quizzes WHERE user_id = ? AND score IS NOT NULL ORDER BY created_at DESC LIMIT 1",
                (user_id,)
            ).fetchone()
            if not row:
                return jsonify({"error": "No completed quiz found."}), 404
            quiz_id = row["id"]

        quiz = get_quiz_by_id(conn, quiz_id)
        if not quiz or quiz["user_id"] != user_id:
            raise LookupError("Quiz not found.")

        answers = get_answers_for_quiz(conn, quiz_id)

        strong = [a for a in answers if a["is_correct"]]
        weak = [a for a in answers if not a["is_correct"]]

        strong_tags = list({a["concept_tag"] for a in strong if a.get("concept_tag")})
        weak_tags = list({a["concept_tag"] for a in weak if a.get("concept_tag")})

        accuracy = round(quiz["score"] / quiz["total_questions"] * 100, 1) if quiz["total_questions"] else 0

        return jsonify({
            "quiz_id": quiz_id,
            "score": quiz["score"],
            "total": quiz["total_questions"],
            "accuracy": accuracy,
            "difficulty": quiz["difficulty"],
            "strong_areas": strong_tags,
            "weak_areas": weak_tags,
            "answers": answers,
        })
    finally:
        conn.close()
