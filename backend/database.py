"""
database.py — SQLite connection, table creation, and seed data.
Run this module directly to reinitialise the DB: `python database.py`
"""

import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "./tutor.db")


def get_db():
    """Return a new SQLite connection with FK enforcement and row_factory."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row          # access columns by name
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create all tables (idempotent) and insert seed topics."""
    conn = get_db()
    c = conn.cursor()

    # ── users ──────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT    NOT NULL,
            email           TEXT    NOT NULL UNIQUE,
            password_hash   TEXT    NOT NULL,
            education_level TEXT    NOT NULL,
            created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── topics ─────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS topics (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL UNIQUE,
            category    TEXT    NOT NULL,
            description TEXT
        )
    """)

    # ── learning_sessions ──────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS learning_sessions (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id),
            topic_id   INTEGER NOT NULL REFERENCES topics(id),
            difficulty TEXT    NOT NULL,
            duration   INTEGER,
            completed  INTEGER NOT NULL DEFAULT 0,
            created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── notes ──────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id),
            topic_id   INTEGER NOT NULL REFERENCES topics(id),
            title      TEXT    NOT NULL,
            content    TEXT    NOT NULL,
            created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── quizzes ────────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS quizzes (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL REFERENCES users(id),
            topic_id        INTEGER NOT NULL REFERENCES topics(id),
            score           INTEGER,
            total_questions INTEGER NOT NULL,
            difficulty      TEXT    NOT NULL,
            created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── questions ──────────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS questions (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id        INTEGER NOT NULL REFERENCES quizzes(id),
            question       TEXT    NOT NULL,
            option_a       TEXT    NOT NULL,
            option_b       TEXT    NOT NULL,
            option_c       TEXT    NOT NULL,
            option_d       TEXT    NOT NULL,
            correct_answer TEXT    NOT NULL,
            explanation    TEXT    NOT NULL,
            concept_tag    TEXT
        )
    """)

    # ── quiz_answers ───────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS quiz_answers (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id         INTEGER NOT NULL REFERENCES quizzes(id),
            question_id     INTEGER NOT NULL REFERENCES questions(id),
            selected_answer TEXT    NOT NULL,
            is_correct      INTEGER NOT NULL
        )
    """)

    # ── learner_profiles ───────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS learner_profiles (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id),
            overall_mastery REAL    NOT NULL DEFAULT 0,
            current_level   TEXT    NOT NULL DEFAULT 'beginner',
            weak_topics     TEXT,
            strong_topics   TEXT,
            updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── topic_progress ─────────────────────────────────────────────────────
    c.execute("""
        CREATE TABLE IF NOT EXISTS topic_progress (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id       INTEGER NOT NULL REFERENCES users(id),
            topic_id      INTEGER NOT NULL REFERENCES topics(id),
            mastery_score REAL    NOT NULL DEFAULT 0,
            quiz_accuracy REAL    NOT NULL DEFAULT 0,
            attempts      INTEGER NOT NULL DEFAULT 0,
            updated_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, topic_id)
        )
    """)

    conn.commit()

    # ── Seed topics ────────────────────────────────────────────────────────
    seed_topics = [
        ("Convolutional Neural Networks", "Deep Learning",
         "How CNNs extract features from images"),
        ("Recurrent Neural Networks", "Deep Learning",
         "Sequence modeling with memory"),
        ("Transformers", "Deep Learning",
         "Attention-based sequence models"),
        ("Overfitting & Underfitting", "Machine Learning Basics",
         "Model generalization concepts"),
        ("Big-O Notation", "Data Structures & Algorithms",
         "Measuring algorithm efficiency"),
        ("Backpropagation", "Deep Learning",
         "How neural networks learn via gradient descent"),
        ("Linear Regression", "Machine Learning Basics",
         "Predicting continuous values from data"),
        ("Decision Trees", "Machine Learning Basics",
         "Tree-based classification and regression"),
        ("Python Basics", "Programming",
         "Variables, loops, functions and more"),
        ("Object-Oriented Programming", "Programming",
         "Classes, objects, inheritance, and encapsulation"),
    ]

    for name, category, description in seed_topics:
        c.execute(
            "INSERT OR IGNORE INTO topics (name, category, description) VALUES (?, ?, ?)",
            (name, category, description)
        )

    conn.commit()
    conn.close()
    print(f"[DB] Initialised -> {DATABASE_PATH}")


if __name__ == "__main__":
    init_db()
