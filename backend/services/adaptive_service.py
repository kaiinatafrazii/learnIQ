"""
services/adaptive_service.py
Determines difficulty level and weak concepts from learner profile data.
These are pure functions — no Flask context needed, easy to test.
"""

import json
from models import (
    get_learner_profile,
    get_topic_progress,
    get_all_topic_progress,
    get_answers_for_quiz,
    get_recent_quizzes,
    update_learner_profile,
    upsert_topic_progress,
)

# ── Thresholds (tunable constants) ─────────────────────────────────────────
ADVANCED_THRESHOLD = 80     # mastery_score >= 80 → advanced
INTERMEDIATE_THRESHOLD = 50 # mastery_score >= 50 → intermediate
# < 50 → beginner


def get_difficulty(conn, user_id: int, topic_id: int) -> str:
    """
    Returns 'beginner' | 'intermediate' | 'advanced'
    based on topic_progress.mastery_score.
    Falls back to the learner profile's overall current_level.
    """
    progress = get_topic_progress(conn, user_id, topic_id)
    if progress:
        score = progress["mastery_score"]
    else:
        profile = get_learner_profile(conn, user_id)
        if profile:
            return profile.get("current_level", "beginner")
        return "beginner"

    if score >= ADVANCED_THRESHOLD:
        return "advanced"
    elif score >= INTERMEDIATE_THRESHOLD:
        return "intermediate"
    else:
        return "beginner"


def get_weak_concepts(conn, user_id: int, topic_id: int) -> list:
    """
    Returns a list of concept_tag strings where the student
    has answered incorrectly in recent quiz attempts on this topic.
    """
    # Get recent quiz ids for this topic
    rows = conn.execute(
        """
        SELECT q.id FROM quizzes q
        WHERE q.user_id = ? AND q.topic_id = ? AND q.score IS NOT NULL
        ORDER BY q.created_at DESC
        LIMIT 3
        """,
        (user_id, topic_id)
    ).fetchall()

    if not rows:
        return []

    quiz_ids = [r["id"] for r in rows]
    placeholders = ",".join("?" * len(quiz_ids))

    answers = conn.execute(
        f"""
        SELECT qa.is_correct, q.concept_tag
        FROM quiz_answers qa
        JOIN questions q ON q.id = qa.question_id
        WHERE qa.quiz_id IN ({placeholders}) AND q.concept_tag IS NOT NULL
        """,
        quiz_ids
    ).fetchall()

    # Count correct vs total per concept
    concept_stats = {}
    for a in answers:
        tag = a["concept_tag"]
        if tag not in concept_stats:
            concept_stats[tag] = {"correct": 0, "total": 0}
        concept_stats[tag]["total"] += 1
        if a["is_correct"]:
            concept_stats[tag]["correct"] += 1

    # A concept is "weak" if accuracy < 60%
    weak = [
        tag for tag, stats in concept_stats.items()
        if stats["total"] > 0 and (stats["correct"] / stats["total"]) < 0.6
    ]
    return weak


def update_profile_after_quiz(conn, user_id: int, topic_id: int, quiz_result: dict):
    """
    Recomputes mastery_score, quiz_accuracy, attempts for the topic,
    then updates learner_profiles with overall mastery + level + weak/strong topics.

    quiz_result = {
        "score": int,
        "total_questions": int,
        "quiz_id": int
    }
    """
    score = quiz_result["score"]
    total = quiz_result["total_questions"]
    quiz_accuracy = round((score / total) * 100, 1) if total else 0

    # Get or init topic progress
    existing = get_topic_progress(conn, user_id, topic_id)
    if existing:
        prev_mastery = existing["mastery_score"]
        prev_attempts = existing["attempts"]
        # Moving average: blend the accumulated mastery score with the new quiz accuracy
        new_mastery = round((prev_mastery * prev_attempts + quiz_accuracy) / (prev_attempts + 1), 1)
        new_attempts = prev_attempts + 1
    else:
        new_mastery = quiz_accuracy
        new_attempts = 1

    # Clamp to valid percentage range
    new_mastery = min(max(new_mastery, 0.0), 100.0)

    upsert_topic_progress(conn, user_id, topic_id, new_mastery, quiz_accuracy, new_attempts)

    # Recompute overall profile from all topic progress
    all_progress = get_all_topic_progress(conn, user_id)
    if all_progress:
        overall = round(sum(p["mastery_score"] for p in all_progress) / len(all_progress), 1)
        overall = min(max(overall, 0.0), 100.0)  # Clamp to [0, 100]
    else:
        overall = 0.0

    # Determine overall level
    if overall >= ADVANCED_THRESHOLD:
        level = "advanced"
    elif overall >= INTERMEDIATE_THRESHOLD:
        level = "intermediate"
    else:
        level = "beginner"

    # Weak = mastery < 60, Strong = mastery >= 80
    weak_topics = [p["topic_name"] for p in all_progress if p["mastery_score"] < 60]
    strong_topics = [p["topic_name"] for p in all_progress if p["mastery_score"] >= 80]

    update_learner_profile(conn, user_id, overall, level, weak_topics, strong_topics)
