"""
routes/quiz_routes.py — Gamified 'AI Quiz Challenge' endpoints.
Handles generation of at least 10 MCQs, server-side game scoring,
Hangman lives tracking, hint penalties, and performance analytics.
"""

import json
from flask import Blueprint, request, jsonify, g
from database import get_db
from models import (
    get_or_create_topic, get_topic_progress,
    create_quiz, create_question, create_quiz_answer,
    update_quiz_score, get_quiz_by_id,
    get_questions_for_quiz, get_answers_for_quiz,
    get_learner_profile
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
    Generate an AI Quiz Challenge with at least 10 questions.
    Body: { topic: str, topic_id?: int, difficulty?: str, question_count?: int }
    Returns: { quiz_id, topic_name, topic_id, difficulty, total_questions, questions[] }
    """
    data = request.get_json() or {}
    topic_name = (data.get("topic") or "").strip()
    req_count = data.get("question_count") or data.get("num_questions") or 10
    try:
        num_questions = max(10, int(req_count))
    except (ValueError, TypeError):
        num_questions = 10

    if not topic_name:
        raise ValueError("Topic name is required to generate a quiz.")

    user_id = g.user_id
    conn = get_db()
    try:
        topic = get_or_create_topic(conn, topic_name)
        topic_id = topic["id"]

        user_difficulty = data.get("difficulty")
        if not user_difficulty:
            user_difficulty = get_difficulty(conn, user_id, topic_id)

        weak_concepts = get_weak_concepts(conn, user_id, topic_id)

        # Generate at least 10 questions with answer-neutral hints
        mcqs = generate_mcqs(topic_name, user_difficulty, weak_concepts, num_questions)
        if len(mcqs) < 10:
            raise RuntimeError("Could not generate the minimum requirement of 10 questions.")

        quiz_id = create_quiz(conn, user_id, topic_id, len(mcqs), user_difficulty)

        questions_out = []
        for q in mcqs:
            hint = q.get("hint") or "Consider the fundamental definition and underlying rules of this topic."
            concept_tag = q.get("concept_tag") or "core_concept"

            qid = create_question(
                conn, quiz_id,
                q["question"], q["option_a"], q["option_b"],
                q["option_c"], q["option_d"], q["correct_answer"],
                q["explanation"], concept_tag, hint
            )
            # Anti-cheat: do NOT send correct_answer or explanation to client yet
            questions_out.append({
                "id": qid,
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "options": [q["option_a"], q["option_b"], q["option_c"], q["option_d"]],
                "hint": hint,
                "concept_tag": concept_tag,
            })

        return jsonify({
            "quiz_id": quiz_id,
            "topic_name": topic_name,
            "topic_id": topic_id,
            "difficulty": user_difficulty,
            "total_questions": len(questions_out),
            "questions": questions_out,
        })
    finally:
        conn.close()


@quiz_bp.route("/api/quiz/check-answer", methods=["POST"])
@require_auth
@handle_errors
def check_single_answer():
    """
    Validate a single question answer in real-time during Hangman gameplay.
    Body: { quiz_id: int, question_id: int, selected_answer: str }
    Returns: { is_correct: bool, correct_answer: str, explanation: str, concept_tag: str }
    """
    data = request.get_json() or {}
    raw_quiz_id = data.get("quiz_id")
    raw_question_id = data.get("question_id")
    selected = str(data.get("selected_answer") or "").strip().lower()

    if not raw_quiz_id or not raw_question_id:
        raise ValueError("quiz_id and question_id are required.")

    try:
        quiz_id = int(raw_quiz_id)
        question_id = int(raw_question_id)
    except (ValueError, TypeError):
        raise ValueError("Invalid quiz_id or question_id format.")

    user_id = g.user_id
    conn = get_db()
    try:
        quiz = get_quiz_by_id(conn, quiz_id)
        if not quiz or quiz["user_id"] != user_id:
            raise LookupError("Quiz not found or unauthorized.")

        row = conn.execute(
            "SELECT * FROM questions WHERE id = ? AND quiz_id = ?",
            (question_id, quiz_id)
        ).fetchone()
        if not row:
            raise LookupError("Question not found.")

        correct_answer = (row["correct_answer"] or "a").strip().lower()
        if selected in ["0", "1", "2", "3"]:
            selected = ["a", "b", "c", "d"][int(selected)]

        is_correct = bool(selected and selected == correct_answer)

        return jsonify({
            "is_correct": is_correct,
            "correct_answer": correct_answer,
            "explanation": row["explanation"] or "",
            "concept_tag": row["concept_tag"] or "core",
        })
    finally:
        conn.close()


@quiz_bp.route("/api/quiz/submit", methods=["POST"])
@require_auth
@handle_errors
@openai_error_handler
def submit_quiz():
    """
    Server-side evaluation for the Hangman AI Quiz Challenge.
    Calculates exact score, streak bonuses, hint deductions, lives lost,
    mastery progression, and question-by-question review data.
    Body: { quiz_id: int, answers: [{ question_id: int, selected_answer: str, hint_used?: bool }] }
    """
    data = request.get_json() or {}
    quiz_id = data.get("quiz_id")
    answers = data.get("answers", [])

    if not quiz_id:
        raise ValueError("quiz_id is required.")

    user_id = g.user_id
    conn = get_db()
    try:
        quiz = get_quiz_by_id(conn, quiz_id)
        if not quiz or quiz["user_id"] != user_id:
            raise LookupError("Quiz not found or unauthorized.")

        raw_questions = get_questions_for_quiz(conn, quiz_id)
        questions_map = {q["id"]: q for q in raw_questions}
        total_questions = quiz["total_questions"]

        # Game state tracking variables
        lives = 5
        score = 0
        current_streak = 0
        highest_streak = 0
        correct_count = 0
        wrong_count = 0

        strong_tags = {}
        weak_tags = {}
        questions_with_answers = []

        # Process answers in sequence to evaluate gameplay streak & lives
        ans_dict = {a.get("question_id"): a for a in answers if isinstance(a, dict)}

        for q in raw_questions:
            qid = q["id"]
            user_ans = ans_dict.get(qid)

            raw_selected = (user_ans.get("selected_answer") if user_ans else "") or ""
            # Normalize answer: handle 'a', 'b', 'c', 'd' or numeric 0, 1, 2, 3
            selected = str(raw_selected).strip().lower()
            if selected in ["0", "1", "2", "3"]:
                selected = ["a", "b", "c", "d"][int(selected)]

            hint_used = bool(user_ans.get("hint_used")) if user_ans else False

            correct_answer = q["correct_answer"].strip().lower()
            is_correct = bool(selected and selected == correct_answer)

            if is_correct:
                correct_count += 1
                current_streak += 1
                highest_streak = max(highest_streak, current_streak)

                # Streak bonus
                streak_bonus = 0
                if current_streak >= 5:
                    streak_bonus = 75
                elif current_streak >= 3:
                    streak_bonus = 40
                elif current_streak >= 2:
                    streak_bonus = 20

                score += (100 + streak_bonus)
            else:
                wrong_count += 1
                current_streak = 0
                lives = max(0, lives - 1)

            # Hint penalty: -10 points per hint used
            if hint_used:
                score = max(0, score - 10)

            # Record answer in DB
            create_quiz_answer(conn, quiz_id, qid, selected or "unanswered", is_correct)

            concept_tag = q.get("concept_tag") or "general"
            if is_correct:
                strong_tags[concept_tag] = strong_tags.get(concept_tag, 0) + 1
            else:
                weak_tags[concept_tag] = weak_tags.get(concept_tag, 0) + 1

            questions_with_answers.append({
                "question_id": qid,
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "selected_answer": selected,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
                "explanation": q["explanation"],
                "hint": q.get("hint") or "",
                "concept_tag": concept_tag,
            })

        # Accuracy & Mastery calculation
        accuracy = round((correct_count / total_questions) * 100, 1) if total_questions else 0
        update_quiz_score(conn, quiz_id, score)

        strong_areas = [k for k, v in sorted(strong_tags.items(), key=lambda x: -x[1])]
        weak_areas = [k for k, v in sorted(weak_tags.items(), key=lambda x: -x[1])]

        # Performance categorization
        if accuracy >= 85:
            performance_level = "Advanced"
            recommended_difficulty = "advanced"
        elif accuracy >= 60:
            performance_level = "Intermediate"
            recommended_difficulty = "intermediate"
        else:
            performance_level = "Beginner / Needs Revision"
            recommended_difficulty = "beginner"

        # Adaptive profile update in SQLite (using correct_count rather than point score)
        try:
            update_profile_after_quiz(conn, user_id, quiz["topic_id"], {
                "score": correct_count,
                "total_questions": total_questions,
                "quiz_id": quiz_id,
                "accuracy": accuracy,
            })
        except Exception as e:
            print(f"[LearnIQ] Profile update non-fatal note: {e}")

        # Fetch topic name
        try:
            topic_row = conn.execute(
                "SELECT t.name FROM topics t JOIN quizzes q ON q.topic_id = t.id WHERE q.id = ?",
                (quiz_id,)
            ).fetchone()
            topic_name = topic_row["name"] if topic_row else "the topic"
        except Exception:
            topic_name = "the topic"

        # Generate personalized next-step suggestion
        improvement_suggestions = ""
        try:
            feedback_msgs = generate_feedback_prompt({
                "topic": topic_name,
                "score": correct_count,
                "total": total_questions,
                "accuracy": accuracy,
                "strong_areas": strong_areas[:3],
                "weak_areas": weak_areas[:3],
                "level": quiz.get("difficulty", "intermediate"),
            })
            improvement_suggestions = chat_completion(feedback_msgs, max_tokens=350)
        except Exception as e:
            print(f"[LearnIQ] Non-fatal feedback generation warning: {e}")
            improvement_suggestions = "Great effort! Review the questions above and practice subconcepts where errors occurred to build deep mastery."

        # Craft concrete recommendation
        if weak_areas:
            weak_preview = ", ".join(weak_areas[:2]).replace("_", " ").title()
            next_step_recommendation = f"Review {weak_preview} and attempt an {recommended_difficulty} challenge to strengthen your foundation."
        else:
            next_step_recommendation = f"Outstanding mastery! Progress to advanced concepts or explore related topics."

        response_payload = {
            "quiz_id": quiz_id,
            "topic_name": topic_name,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "wrong_answers": wrong_count,
            "accuracy": accuracy,
            "score": score,
            "highest_streak": highest_streak,
            "remaining_lives": lives,
            "game_over": (lives == 0),
            "performance_level": performance_level,
            "recommended_difficulty": recommended_difficulty,
            "strong_concepts": strong_areas,
            "weak_concepts": weak_areas,
            "recommended_next_step": next_step_recommendation,
            "improvement_suggestions": improvement_suggestions,
            "questions_with_answers": questions_with_answers,
        }

        return jsonify(response_payload)
    finally:
        conn.close()


@quiz_bp.route("/api/quiz/<int:quiz_id>/result", methods=["GET"])
@require_auth
@handle_errors
def get_quiz_result(quiz_id: int):
    """
    Retrieve completed quiz performance analysis and review details.
    """
    user_id = g.user_id
    conn = get_db()
    try:
        quiz = get_quiz_by_id(conn, quiz_id)
        if not quiz or quiz["user_id"] != user_id:
            raise LookupError("Quiz result not found.")

        raw_questions = get_questions_for_quiz(conn, quiz_id)
        raw_answers = get_answers_for_quiz(conn, quiz_id)
        ans_map = {a["question_id"]: a for a in raw_answers}

        correct_count = 0
        wrong_count = 0
        strong_tags = {}
        weak_tags = {}
        questions_with_answers = []

        for q in raw_questions:
            qid = q["id"]
            user_ans = ans_map.get(qid)
            selected = user_ans["selected_answer"] if user_ans else ""
            is_correct = bool(user_ans["is_correct"]) if user_ans else False

            if is_correct:
                correct_count += 1
                tag = q.get("concept_tag") or "core"
                strong_tags[tag] = strong_tags.get(tag, 0) + 1
            else:
                wrong_count += 1
                tag = q.get("concept_tag") or "core"
                weak_tags[tag] = weak_tags.get(tag, 0) + 1

            questions_with_answers.append({
                "question_id": qid,
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "selected_answer": selected,
                "correct_answer": q["correct_answer"],
                "is_correct": is_correct,
                "explanation": q["explanation"],
                "hint": q.get("hint") or "",
                "concept_tag": q.get("concept_tag") or "core",
            })

        total = quiz["total_questions"]
        score = quiz["score"] or 0
        accuracy = round((correct_count / total) * 100, 1) if total else 0

        # Topic name
        topic_row = conn.execute(
            "SELECT t.name FROM topics t WHERE t.id = ?", (quiz["topic_id"],)
        ).fetchone()
        topic_name = topic_row["name"] if topic_row else "Quiz"

        if accuracy >= 85:
            performance_level = "Advanced"
            recommended_difficulty = "advanced"
        elif accuracy >= 60:
            performance_level = "Intermediate"
            recommended_difficulty = "intermediate"
        else:
            performance_level = "Beginner / Needs Revision"
            recommended_difficulty = "beginner"

        return jsonify({
            "quiz_id": quiz_id,
            "topic_name": topic_name,
            "total_questions": total,
            "correct_answers": correct_count,
            "wrong_answers": wrong_count,
            "accuracy": accuracy,
            "score": score,
            "remaining_lives": max(0, 5 - wrong_count),
            "performance_level": performance_level,
            "recommended_difficulty": recommended_difficulty,
            "strong_concepts": list(strong_tags.keys()),
            "weak_concepts": list(weak_tags.keys()),
            "questions_with_answers": questions_with_answers,
        })
    finally:
        conn.close()
