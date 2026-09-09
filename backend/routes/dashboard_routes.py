"""routes/dashboard_routes.py — GET /api/dashboard"""

from flask import Blueprint, jsonify, g
from database import get_db
from models import (
    get_learner_profile, get_recent_sessions, get_recent_quizzes,
    get_streak, get_overall_quiz_accuracy, get_topics_completed_count,
    get_total_learning_time, get_all_topic_progress
)
from routes.middleware import require_auth
from utils.error_handling import handle_errors

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@require_auth
@handle_errors
def get_dashboard():
    user_id = g.user_id
    conn = get_db()
    try:
        profile = get_learner_profile(conn, user_id) or {}
        streak = get_streak(conn, user_id)
        accuracy = get_overall_quiz_accuracy(conn, user_id)
        topics_completed = get_topics_completed_count(conn, user_id)
        learning_time_secs = get_total_learning_time(conn, user_id)
        recent_sessions = get_recent_sessions(conn, user_id, limit=5)
        recent_quizzes = get_recent_quizzes(conn, user_id, limit=3)
        all_progress = get_all_topic_progress(conn, user_id)

        # Recommended topic: the weak topic with most attempts (or first weak topic)
        weak = profile.get("weak_topics", [])
        recommended = weak[0] if weak else None
        if not recommended and all_progress:
            # Recommend the topic with lowest mastery
            lowest = min(all_progress, key=lambda p: p["mastery_score"])
            recommended = lowest["topic_name"]

        # Last topic for "Continue Learning"
        last_session = recent_sessions[0] if recent_sessions else None

        return jsonify({
            "user": {
                "name": g.user["name"],
                "education_level": g.user["education_level"],
            },
            "stats": {
                "topics_completed": topics_completed,
                "quiz_accuracy": accuracy,
                "learning_time_hours": round(learning_time_secs / 3600, 1),
                "streak_days": streak,
            },
            "profile": {
                "overall_mastery": profile.get("overall_mastery", 0),
                "current_level": profile.get("current_level", "beginner"),
                "weak_topics": weak,
                "strong_topics": profile.get("strong_topics", []),
            },
            "recommended_topic": recommended,
            "last_topic": last_session["topic_name"] if last_session else None,
            "last_topic_id": last_session["topic_id"] if last_session else None,
            "recent_sessions": recent_sessions,
            "recent_quizzes": recent_quizzes,
            "topic_progress": all_progress,
        })
    finally:
        conn.close()
