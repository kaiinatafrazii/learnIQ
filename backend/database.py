"""
database.py — Turso/libSQL connection, table creation, and seed data.
Run this module directly to initialise the database: `python database.py`
"""

import os
import sqlite3
from typing import Any

try:
    from libsql_client import create_client_sync
except ImportError:
    create_client_sync = None

from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.getenv("DATABASE_PATH", "./tutor.db")
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "").strip()
if TURSO_DATABASE_URL.startswith(("turso://", "libsql://")):
    TURSO_DATABASE_URL = "https://" + TURSO_DATABASE_URL.split("://", 1)[1]
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "").strip()


class _TursoRow(dict):
    """Mapping row with sqlite3.Row-style access by column name or index."""

    def __init__(self, columns: list[str], values: tuple[Any, ...]):
        super().__init__(zip(columns, values))
        self._values = values

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return super().__getitem__(key)


class _TursoResult:
    def __init__(self, columns: list[str], rows: list[tuple[Any, ...]], lastrowid=None):
        self._rows = [_TursoRow(columns, row) for row in rows]
        self.lastrowid = lastrowid

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return self._rows


class _TursoConnection:
    """Small libSQL adapter matching the sqlite3 connection API used by this app."""

    def __init__(self):
        if create_client_sync is None:
            raise RuntimeError("Install libsql-client to use Turso.")
        self._client = create_client_sync(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)

    def execute(self, sql, parameters=()):
        result = self._client.execute(sql, parameters)
        columns = list(result.columns or [])
        rows = list(result.rows or [])
        lastrowid = None
        if sql.lstrip().upper().startswith("INSERT"):
            lastrowid = self._client.execute("SELECT last_insert_rowid() AS id").rows[0][0]
        return _TursoResult(columns, rows, lastrowid)

    def cursor(self):
        return self

    def commit(self):
        # Turso commits each statement unless an explicit transaction is used.
        return None

    def close(self):
        self._client.close()


def get_db():
    """Return a new Turso connection, or local SQLite connection when unconfigured."""
    if TURSO_DATABASE_URL:
        return _TursoConnection()

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
            concept_tag    TEXT,
            hint           TEXT
        )
    """)

    # Migration for existing DB
    try:
        c.execute("ALTER TABLE questions ADD COLUMN hint TEXT")
    except Exception:
        pass

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
    target = TURSO_DATABASE_URL if TURSO_DATABASE_URL else DATABASE_PATH
    print(f"[DB] Initialised -> {target}")


if __name__ == "__main__":
    init_db()
