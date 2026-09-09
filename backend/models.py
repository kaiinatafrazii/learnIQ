"""
models.py — Simple data-access helper functions.
Each function takes a db connection and returns plain dicts or lists.
"""

import json
from datetime import datetime


# ── Users ──────────────────────────────────────────────────────────────────

def get_user_by_email(conn, email):
    row = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    return dict(row) if row else None


def get_user_by_id(conn, user_id):
    row = conn.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    return dict(row) if row else None


def create_user(conn, name, email, password_hash, education_level):
    cur = conn.execute(
        "INSERT INTO users (name, email, password_hash, education_level) VALUES (?, ?, ?, ?)",
        (name, email, password_hash, education_level)
    )
    conn.commit()
    # Also create an empty learner profile
    conn.execute(
        "INSERT OR IGNORE INTO learner_profiles (user_id) VALUES (?)",
        (cur.lastrowid,)
    )
    conn.commit()
    return cur.lastrowid


# ── Topics ─────────────────────────────────────────────────────────────────

def get_all_topics(conn):
    rows = conn.execute("SELECT * FROM topics ORDER BY category, name").fetchall()
    return [dict(r) for r in rows]


def get_topic_by_id(conn, topic_id):
    row = conn.execute("SELECT * FROM topics WHERE id = ?", (topic_id,)).fetchone()
    return dict(row) if row else None


def get_or_create_topic(conn, name, category="General", description=""):
    """Lookup topic by normalised name; create it if it doesn't exist."""
    row = conn.execute(
        "SELECT * FROM topics WHERE LOWER(name) = LOWER(?)", (name,)
    ).fetchone()
    if row:
        return dict(row)
    cur = conn.execute(
        "INSERT INTO topics (name, category, description) VALUES (?, ?, ?)",
        (name, category, description)
    )
    conn.commit()
    return {"id": cur.lastrowid, "name": name, "category": category, "description": description}


# ── Learning Sessions ───────────────────────────────────────────────────────

def create_learning_session(conn, user_id, topic_id, difficulty):
    cur = conn.execute(
        "INSERT INTO learning_sessions (user_id, topic_id, difficulty) VALUES (?, ?, ?)",
        (user_id, topic_id, difficulty)
    )
    conn.commit()
    return cur.lastrowid


def get_recent_sessions(conn, user_id, limit=5):
    rows = conn.execute(
        """
        SELECT ls.*, t.name AS topic_name, t.category
        FROM learning_sessions ls
        JOIN topics t ON t.id = ls.topic_id
        WHERE ls.user_id = ?
        ORDER BY ls.created_at DESC
        LIMIT ?
        """,
        (user_id, limit)
    ).fetchall()
    return [dict(r) for r in rows]


def get_last_session(conn, user_id):
    row = conn.execute(
        """
        SELECT ls.*, t.name AS topic_name
        FROM learning_sessions ls
        JOIN topics t ON t.id = ls.topic_id
        WHERE ls.user_id = ?
        ORDER BY ls.created_at DESC
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()
    return dict(row) if row else None


def complete_session(conn, session_id):
    conn.execute(
        "UPDATE learning_sessions SET completed = 1 WHERE id = ?", (session_id,)
    )
    conn.commit()


# ── Notes ──────────────────────────────────────────────────────────────────

def get_notes_for_user(conn, user_id):
    rows = conn.execute(
        """
        SELECT n.*, t.name AS topic_name
        FROM notes n
        JOIN topics t ON t.id = n.topic_id
        WHERE n.user_id = ?
        ORDER BY n.updated_at DESC
        """,
        (user_id,)
    ).fetchall()
    return [dict(r) for r in rows]


def get_note_by_id(conn, note_id, user_id):
    row = conn.execute(
        "SELECT * FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
    ).fetchone()
    return dict(row) if row else None


def create_note(conn, user_id, topic_id, title, content):
    cur = conn.execute(
        "INSERT INTO notes (user_id, topic_id, title, content) VALUES (?, ?, ?, ?)",
        (user_id, topic_id, title, content)
    )
    conn.commit()
    return cur.lastrowid


def update_note(conn, note_id, user_id, title, content):
    now = datetime.utcnow().isoformat()
    conn.execute(
        "UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        (title, content, now, note_id, user_id)
    )
    conn.commit()


def delete_note(conn, note_id, user_id):
    conn.execute(
        "DELETE FROM notes WHERE id = ? AND user_id = ?", (note_id, user_id)
    )
    conn.commit()


# ── Quizzes ────────────────────────────────────────────────────────────────

def create_quiz(conn, user_id, topic_id, total_questions, difficulty):
    cur = conn.execute(
        "INSERT INTO quizzes (user_id, topic_id, total_questions, difficulty) VALUES (?, ?, ?, ?)",
        (user_id, topic_id, total_questions, difficulty)
    )
    conn.commit()
    return cur.lastrowid


def update_quiz_score(conn, quiz_id, score):
    conn.execute("UPDATE quizzes SET score = ? WHERE id = ?", (score, quiz_id))
    conn.commit()


def get_quiz_by_id(conn, quiz_id):
    row = conn.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,)).fetchone()
    return dict(row) if row else None


def get_recent_quizzes(conn, user_id, limit=5):
    rows = conn.execute(
        """
        SELECT q.*, t.name AS topic_name
        FROM quizzes q
        JOIN topics t ON t.id = q.topic_id
        WHERE q.user_id = ? AND q.score IS NOT NULL
        ORDER BY q.created_at DESC
        LIMIT ?
        """,
        (user_id, limit)
    ).fetchall()
    return [dict(r) for r in rows]


# ── Questions ──────────────────────────────────────────────────────────────

def create_question(conn, quiz_id, question, option_a, option_b,
                    option_c, option_d, correct_answer, explanation, concept_tag=None, hint=None):
    cur = conn.execute(
        """
        INSERT INTO questions
            (quiz_id, question, option_a, option_b, option_c, option_d,
             correct_answer, explanation, concept_tag, hint)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (quiz_id, question, option_a, option_b, option_c, option_d,
         correct_answer, explanation, concept_tag, hint)
    )
    conn.commit()
    return cur.lastrowid


def get_questions_for_quiz(conn, quiz_id):
    rows = conn.execute(
        "SELECT * FROM questions WHERE quiz_id = ?", (quiz_id,)
    ).fetchall()
    return [dict(r) for r in rows]


# ── Quiz Answers ───────────────────────────────────────────────────────────

def create_quiz_answer(conn, quiz_id, question_id, selected_answer, is_correct):
    cur = conn.execute(
        "INSERT INTO quiz_answers (quiz_id, question_id, selected_answer, is_correct) VALUES (?, ?, ?, ?)",
        (quiz_id, question_id, selected_answer, int(is_correct))
    )
    conn.commit()
    return cur.lastrowid


def get_answers_for_quiz(conn, quiz_id):
    rows = conn.execute(
        """
        SELECT qa.*, q.concept_tag, q.question AS question_text, q.correct_answer
        FROM quiz_answers qa
        JOIN questions q ON q.id = qa.question_id
        WHERE qa.quiz_id = ?
        """,
        (quiz_id,)
    ).fetchall()
    return [dict(r) for r in rows]


# ── Learner Profiles ───────────────────────────────────────────────────────

def get_learner_profile(conn, user_id):
    row = conn.execute(
        "SELECT * FROM learner_profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    if not row:
        return None
    p = dict(row)
    p["weak_topics"] = json.loads(p["weak_topics"]) if p["weak_topics"] else []
    p["strong_topics"] = json.loads(p["strong_topics"]) if p["strong_topics"] else []
    return p


def update_learner_profile(conn, user_id, overall_mastery, current_level,
                           weak_topics, strong_topics):
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        UPDATE learner_profiles
        SET overall_mastery = ?, current_level = ?, weak_topics = ?,
            strong_topics = ?, updated_at = ?
        WHERE user_id = ?
        """,
        (overall_mastery, current_level,
         json.dumps(weak_topics), json.dumps(strong_topics),
         now, user_id)
    )
    conn.commit()


# ── Topic Progress ─────────────────────────────────────────────────────────

def get_topic_progress(conn, user_id, topic_id):
    row = conn.execute(
        "SELECT * FROM topic_progress WHERE user_id = ? AND topic_id = ?",
        (user_id, topic_id)
    ).fetchone()
    return dict(row) if row else None


def upsert_topic_progress(conn, user_id, topic_id, mastery_score,
                          quiz_accuracy, attempts):
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        INSERT INTO topic_progress
            (user_id, topic_id, mastery_score, quiz_accuracy, attempts, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, topic_id) DO UPDATE SET
            mastery_score = excluded.mastery_score,
            quiz_accuracy = excluded.quiz_accuracy,
            attempts      = excluded.attempts,
            updated_at    = excluded.updated_at
        """,
        (user_id, topic_id, mastery_score, quiz_accuracy, attempts, now)
    )
    conn.commit()


def get_all_topic_progress(conn, user_id):
    rows = conn.execute(
        """
        SELECT tp.*, t.name AS topic_name, t.category
        FROM topic_progress tp
        JOIN topics t ON t.id = tp.topic_id
        WHERE tp.user_id = ?
        ORDER BY tp.mastery_score DESC
        """,
        (user_id,)
    ).fetchall()
    return [dict(r) for r in rows]


# ── Dashboard Aggregates ───────────────────────────────────────────────────

def get_streak(conn, user_id):
    """Count consecutive distinct days with at least one learning session."""
    rows = conn.execute(
        """
        SELECT DISTINCT DATE(created_at) AS day
        FROM learning_sessions
        WHERE user_id = ?
        ORDER BY day DESC
        """,
        (user_id,)
    ).fetchall()
    if not rows:
        return 0
    streak = 0
    from datetime import date, timedelta
    today = date.today()
    for i, row in enumerate(rows):
        expected = (today - timedelta(days=i)).isoformat()
        if row["day"] == expected:
            streak += 1
        else:
            break
    return streak


def get_overall_quiz_accuracy(conn, user_id):
    row = conn.execute(
        """
        SELECT
            SUM(score) AS total_score,
            SUM(total_questions) AS total_q
        FROM quizzes
        WHERE user_id = ? AND score IS NOT NULL
        """,
        (user_id,)
    ).fetchone()
    if row and row["total_q"]:
        return round(row["total_score"] / row["total_q"] * 100, 1)
    return 0.0


def get_topics_completed_count(conn, user_id):
    row = conn.execute(
        "SELECT COUNT(DISTINCT topic_id) AS cnt FROM learning_sessions WHERE user_id = ? AND completed = 1",
        (user_id,)
    ).fetchone()
    return row["cnt"] if row else 0


def get_total_learning_time(conn, user_id):
    """Returns total seconds studied."""
    row = conn.execute(
        "SELECT SUM(duration) AS total FROM learning_sessions WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    return row["total"] or 0
