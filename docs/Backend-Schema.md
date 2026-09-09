# Backend Schema Document
## AI-Powered Adaptive Learning Tutor — SQLite Database

**Companion docs:** [PRD.md](PRD.md), [TRD.md](TRD.md), [UI-UX-Design.md](UI-UX-Design.md)

---

## 1. Design Notes

- Single SQLite file (`tutor.db`), created/migrated by `backend/database.py` on first run via `CREATE TABLE IF NOT EXISTS`.
- Foreign keys enforced at the application level (SQLite FK enforcement enabled via `PRAGMA foreign_keys = ON`).
- Timestamps stored as ISO-8601 strings (`TEXT`), defaulting to `CURRENT_TIMESTAMP`.
- IDs are `INTEGER PRIMARY KEY AUTOINCREMENT` throughout — simple, sufficient for a single-instance diploma project.
- Kept intentionally denormalized in a couple of low-risk spots (e.g. `learner_profiles.weak_topics` as a JSON/CSV text column) to avoid over-engineering junction tables for an MVP.

---

## 2. Entity Relationship Overview

```
users (1) ──< learning_sessions >── (1) topics
users (1) ──< notes >── (1) topics
users (1) ──< quizzes >── (1) topics
quizzes (1) ──< questions
quizzes (1) ──< quiz_answers >── (1) questions
users (1) ──1 learner_profiles
users (1) ──< topic_progress >── (1) topics
```

---

## 3. Tables

### 3.1 `users`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| password_hash | TEXT | NOT NULL |
| education_level | TEXT | NOT NULL — e.g. 'school', 'diploma', 'undergraduate', 'graduate', 'other' |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### 3.2 `topics`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| name | TEXT | NOT NULL, UNIQUE — e.g. "Convolutional Neural Networks" |
| category | TEXT | NOT NULL — e.g. "Deep Learning" |
| description | TEXT | NULL — short 1-line description |

Topics can be pre-seeded (a small starter set) and/or created on-the-fly the first time a student types a new topic name into the Tutor page (lookup-or-create by normalized name).

### 3.3 `learning_sessions`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users(id) |
| topic_id | INTEGER | NOT NULL, FK → topics(id) |
| difficulty | TEXT | NOT NULL — 'beginner' \| 'intermediate' \| 'advanced' |
| duration | INTEGER | NULL — seconds spent in the session |
| completed | INTEGER | NOT NULL, DEFAULT 0 — 0/1 boolean |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Written once per `/api/tutor/explain` lesson; `completed` flips to 1 when the student reaches the end of the explanation or starts the follow-up quiz.

### 3.4 `notes`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users(id) |
| topic_id | INTEGER | NOT NULL, FK → topics(id) |
| title | TEXT | NOT NULL |
| content | TEXT | NOT NULL — Markdown (Definition / Key Concepts / Diagram (Mermaid) / Example / Important Points / Quick Revision) |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| updated_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### 3.5 `quizzes`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users(id) |
| topic_id | INTEGER | NOT NULL, FK → topics(id) |
| score | INTEGER | NULL — filled on submit |
| total_questions | INTEGER | NOT NULL |
| difficulty | TEXT | NOT NULL — 'easy' \| 'medium' \| 'hard' |
| created_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### 3.6 `questions`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| quiz_id | INTEGER | NOT NULL, FK → quizzes(id) |
| question | TEXT | NOT NULL |
| option_a | TEXT | NOT NULL |
| option_b | TEXT | NOT NULL |
| option_c | TEXT | NOT NULL |
| option_d | TEXT | NOT NULL |
| correct_answer | TEXT | NOT NULL — one of 'a' \| 'b' \| 'c' \| 'd' |
| explanation | TEXT | NOT NULL — shown after the student answers |
| concept_tag | TEXT | NULL — short sub-concept label (e.g. "stride"), used by the performance analyzer |

> `concept_tag` is a small, deliberate addition beyond the original list — it is what lets `services/performance_service.py` say "you're weak in Stride" instead of only reporting a raw score. It's a plain nullable text column, not a new table, to keep the schema simple.

### 3.7 `quiz_answers`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| quiz_id | INTEGER | NOT NULL, FK → quizzes(id) |
| question_id | INTEGER | NOT NULL, FK → questions(id) |
| selected_answer | TEXT | NOT NULL — 'a' \| 'b' \| 'c' \| 'd' |
| is_correct | INTEGER | NOT NULL — 0/1 boolean |

### 3.8 `learner_profiles`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, UNIQUE, FK → users(id) — one profile per user |
| overall_mastery | REAL | NOT NULL, DEFAULT 0 — 0–100 |
| current_level | TEXT | NOT NULL, DEFAULT 'beginner' |
| weak_topics | TEXT | NULL — JSON array of topic names, e.g. `["Stride","Pooling"]` |
| strong_topics | TEXT | NULL — JSON array of topic names |
| updated_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### 3.9 `topic_progress`

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users(id) |
| topic_id | INTEGER | NOT NULL, FK → topics(id) |
| mastery_score | REAL | NOT NULL, DEFAULT 0 — 0–100, drives difficulty selection |
| quiz_accuracy | REAL | NOT NULL, DEFAULT 0 — 0–100 |
| attempts | INTEGER | NOT NULL, DEFAULT 0 |
| updated_at | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

Unique constraint on `(user_id, topic_id)` — one progress row per student per topic.

---

## 4. SQL DDL (reference)

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  education_level TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  difficulty TEXT NOT NULL,
  duration INTEGER,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  score INTEGER,
  total_questions INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  concept_tag TEXT
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  selected_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  overall_mastery REAL NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  weak_topics TEXT,
  strong_topics TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topic_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  topic_id INTEGER NOT NULL REFERENCES topics(id),
  mastery_score REAL NOT NULL DEFAULT 0,
  quiz_accuracy REAL NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, topic_id)
);
```

---

## 5. Key Data Flows

### 5.1 Lesson generation (`POST /api/tutor/explain`)
1. Read `learner_profiles` + `topic_progress` for `(user_id, topic_id)`.
2. `adaptive_service.get_difficulty()` → difficulty label.
3. `adaptive_service.get_weak_concepts()` → list of weak sub-concepts (from recent `quiz_answers` joined to `questions.concept_tag`).
4. Build prompt via `prompts/tutor_prompts.generate_tutor_prompt()`.
5. Call OpenAI → explanation text (+ optional diagram request).
6. Insert row into `learning_sessions`.
7. Return explanation + key points to frontend.

### 5.2 Notes generation (`POST /api/tutor/notes`)
1. Take the explanation text just generated.
2. Build prompt via `prompts/notes_prompts.generate_notes_prompt()`.
3. Call OpenAI → structured Markdown note.
4. Insert into `notes`.

### 5.3 Quiz generation (`POST /api/quiz/generate`)
1. Determine difficulty (same `adaptive_service.get_difficulty()`), map to 'easy'/'medium'/'hard'.
2. Build prompt via `prompts/quiz_prompts.generate_quiz_prompt(topic, level, previous_mistakes)` — `previous_mistakes` pulled from prior `quiz_answers` where `is_correct = 0`.
3. Call OpenAI → list of MCQs with `concept_tag` per question.
4. Insert `quizzes` row, then `questions` rows.

### 5.4 Quiz submission (`POST /api/quiz/submit`)
1. Insert one `quiz_answers` row per answer, computing `is_correct` by comparing to `questions.correct_answer`.
2. Compute `score` → update `quizzes.score`.
3. Group incorrect/correct answers by `concept_tag` → strong/weak areas for this attempt.
4. Call `services/adaptive_service.update_profile_after_quiz()` → recompute and write `topic_progress` (mastery_score, quiz_accuracy, attempts) and `learner_profiles` (overall_mastery, current_level, weak_topics, strong_topics).
5. Build feedback prompt via `prompts/feedback_prompts.generate_feedback_prompt(quiz_results)` → AI feedback text + recommendations.
6. Return score, accuracy, strong/weak areas, AI feedback, recommendations to frontend.

### 5.5 Dashboard / Progress reads
- `GET /api/dashboard` — aggregates from `learner_profiles`, `topic_progress`, `learning_sessions` (streak = count of distinct recent days with a session), last 3 `quizzes`.
- `GET /api/progress` — per-topic `mastery_score` (bar chart), `quizzes.score/total_questions` over time (line chart), `topic_progress` sorted for weak/strong lists.

---

## 6. Seed Data (suggested)

A small starter `topics` list so the Dashboard/Landing demo isn't empty on first run, e.g.:

```
("Convolutional Neural Networks", "Deep Learning", "How CNNs extract features from images")
("Recurrent Neural Networks", "Deep Learning", "Sequence modeling with memory")
("Transformers", "Deep Learning", "Attention-based sequence models")
("Overfitting & Underfitting", "Machine Learning Basics", "Model generalization concepts")
("Big-O Notation", "Data Structures & Algorithms", "Measuring algorithm efficiency")
```

Seeding is optional — topics can also be created lazily the first time a student enters a new topic name.
