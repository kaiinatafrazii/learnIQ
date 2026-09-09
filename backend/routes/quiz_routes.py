"""routes/quiz_routes.py — Quiz generation and submission."""

import json
from flask import Blueprint, request, jsonify, g
from database import get_db
from models import (
    get_or_create_topic, get_topic_progress,
    create_quiz, create_question, create_quiz_answer,
    update_quiz_score, get_quiz_by_id,
    get_questions_for_quiz, get_answers_for_quiz
)
from services.adaptive_service import get_difficulty, get_weak_concepts, update_profile_after_quiz
from ai.quiz_generator import generate_mcqs
from prompts.feedback_prompts import generate_feedback_prompt
from ai.groq_client import chat_completion
from routes.middleware import require_auth
from utils.error_handling import handle_errors, openai_error_handler

quiz_bp = Blueprint("quiz", __name__)


@quiz_bp.route("/api/quiz/generate", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def generate_quiz():
    """
    Body: { topic: str, topic_id?: int, num_questions?: int }
    Returns: { quiz_id, topic_name, difficulty, questions[] }
    """
    data = request.get_json()
    topic_name = (data.get("topic") or "").strip()
    num_questions = int(data.get("num_questions", 5))
    num_questions = max(3, min(10, num_questions))  # clamp 3-10

    if not topic_name:
        raise ValueError("Topic is required.")

    user_id = g.user_id
    conn = get_db()
    try:
        topic = get_or_create_topic(conn, topic_name)
        topic_id = topic["id"]

        difficulty = get_difficulty(conn, user_id, topic_id)
        weak_concepts = get_weak_concepts(conn, user_id, topic_id)

        mcqs = generate_mcqs(topic_name, difficulty, weak_concepts, num_questions)

        quiz_id = create_quiz(conn, user_id, topic_id, len(mcqs), difficulty)

        questions_out = []
        for q in mcqs:
            qid = create_question(
                conn, quiz_id,
                q["question"], q["option_a"], q["option_b"],
                q["option_c"], q["option_d"], q["correct_answer"],
                q["explanation"], q.get("concept_tag")
            )
            questions_out.append({
                "id": qid,
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                # NOTE: do NOT send correct_answer or explanation to frontend yet
            })

        return jsonify({
            "quiz_id": quiz_id,
            "topic_name": topic_name,
            "topic_id": topic_id,
            "difficulty": difficulty,
            "total_questions": len(mcqs),
            "questions": questions_out,
        })
    finally:
        conn.close()


@quiz_bp.route("/api/quiz/submit", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def submit_quiz():
    """
    Body: { quiz_id: int, answers: [{question_id: int, selected_answer: str}] }
    Returns: { score, total, accuracy, strong_areas, weak_areas, feedback, questions_with_answers[] }
    """
    data = request.get_json()
    quiz_id = data.get("quiz_id")
    answers = data.get("answers", [])

    if not quiz_id or not answers:
        raise ValueError("quiz_id and answers are required.")

    user_id = g.user_id
    conn = get_db()
    try:
        quiz = get_quiz_by_id(conn, quiz_id)
        if not quiz or quiz["user_id"] != user_id:
            raise LookupError("Quiz not found.")

        questions = {q["id"]: q for q in get_questions_for_quiz(conn, quiz_id)}

        score = 0
        strong_tags = {}
        weak_tags = {}
        questions_with_answers = []

        for answer in answers:
            qid = answer.get("question_id")
            selected = (answer.get("selected_answer") or "").lower()
            q = questions.get(qid)
            if not q:
                continue

            is_correct = selected == q["correct_answer"]
            if is_correct:
                score += 1

            create_quiz_answer(conn, quiz_id, qid, selected, is_correct)

            tag = q.get("concept_tag") or "general"
            if is_correct:
                strong_tags[tag] = strong_tags.get(tag, 0) + 1
            else:
                weak_tags[tag] = weak_tags.get(tag, 0) + 1

            questions_with_answers.append({
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "selected_answer": selected,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "explanation": q["explanation"],
                "concept_tag": tag,
            })

        total = quiz["total_questions"]
        accuracy = round((score / total) * 100, 1) if total else 0
        update_quiz_score(conn, quiz_id, score)

        strong_areas = list(strong_tags.keys())
        weak_areas = list(weak_tags.keys())

        # Get topic name for feedback
        topic_row = conn.execute(
            "SELECT t.name FROM topics t JOIN quizzes q ON q.topic_id = t.id WHERE q.id = ?",
            (quiz_id,)
        ).fetchone()
        topic_name = topic_row["name"] if topic_row else "the topic"

        difficulty = quiz["difficulty"]
        update_profile_after_quiz(conn, user_id, quiz["topic_id"], {
            "score": score, "total_questions": total, "quiz_id": quiz_id
        })

        # Generate AI feedback
        feedback_msgs = generate_feedback_prompt({
            "topic": topic_name, "score": score, "total": total,
            "accuracy": accuracy, "strong_areas": strong_areas,
            "weak_areas": weak_areas, "level": difficulty,
        })
        feedback_text = chat_completion(feedback_msgs, max_tokens=300)

        return jsonify({
            "score": score,
            "total": total,
            "accuracy": accuracy,
            "strong_areas": strong_areas,
            "weak_areas": weak_areas,
            "feedback": feedback_text,
            "difficulty": difficulty,
            "topic_name": topic_name,
            "questions_with_answers": questions_with_answers,
        })
    finally:
        conn.close()
