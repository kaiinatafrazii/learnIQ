# LearnIQ Backend

This document is the consolidated reference for the current backend implementation.

## 1. Overview

LearnIQ uses a Python Flask backend with:

- Flask and Flask-CORS for the HTTP API
- Turso/libSQL for users, topics, sessions, notes, quizzes, answers, and progress
- JWT bearer tokens for authentication
- Werkzeug password hashing
- Groq for text generation and Whisper speech-to-text
- gTTS for text-to-speech
- Google Gemini as an optional image-generation provider
- Offline AI, quiz, and image fallbacks when providers are unavailable
- Uvicorn and a2wsgi to serve the Flask application

The backend is a modular REST API. Routes receive and validate requests, models perform database access, services implement reusable business rules, AI modules call providers, and prompt modules build model instructions.

## 2. Directory Structure

```text
backend/
├── app.py                         Flask application setup and startup
├── database.py                    Turso/libSQL connection, schema, and seed data
├── models.py                      Database access helper functions
├── requirements.txt               Python dependencies
├── ai/
│   ├── __init__.py
│   ├── chat.py                    AI chatbot response generation
│   ├── explain.py                 Topic explanations and Mermaid diagrams
│   ├── groq_client.py             Groq client, model cascade, and fallbacks
│   ├── notes_generator.py         AI-generated revision notes
│   ├── openai_client.py           Backwards-compatible alias to Groq functions
│   ├── quiz_generator.py          MCQ parsing, validation, regeneration, and fallback
│   └── voice.py                   Whisper transcription and gTTS speech synthesis
├── prompts/
│   ├── __init__.py
│   ├── feedback_prompts.py        Quiz feedback prompt builder
│   ├── notes_prompts.py           Structured notes prompt builder
│   ├── quiz_prompts.py            MCQ prompt builder
│   └── tutor_prompts.py           Adaptive tutor and diagram prompt builders
├── routes/
│   ├── __init__.py
│   ├── auth_routes.py             Registration and login
│   ├── chat_routes.py             AI chat endpoint
│   ├── dashboard_routes.py        Dashboard aggregates
│   ├── image_routes.py            Topic illustration generation
│   ├── middleware.py              JWT authentication decorator
│   ├── notes_routes.py            Notes CRUD
│   ├── performance_routes.py      Quiz performance analysis
│   ├── progress_routes.py         Progress charts and history
│   ├── quiz_routes.py             Quiz generation, checking, and submission
│   ├── tutor_routes.py            Explanations, diagrams, and generated notes
│   └── voice_routes.py            Speech-to-text and text-to-speech
├── services/
│   ├── __init__.py
│   ├── adaptive_service.py        Difficulty and learner profile calculations
│   └── auth_service.py             Password hashing and JWT operations
└── utils/
    ├── __init__.py
    └── error_handling.py          JSON error handling and AI error mapping
```

## 3. Startup and Application Configuration

`app.py` performs the following steps:

1. Loads environment variables with `python-dotenv`.
2. Creates the Flask application.
3. Sets `FLASK_SECRET_KEY` or uses the development default.
4. Enables CORS for `CORS_ORIGIN`, defaulting to `http://localhost:5173`.
5. Registers all route blueprints.
6. Exposes `GET /api/health`.
7. Calls `init_db()` when the module loads.
8. Wraps Flask with `a2wsgi.WSGIMiddleware` for Uvicorn.

Run from the `backend` directory:

```bash
python app.py
```

The API runs on `http://localhost:5000` with reload enabled.

## 4. Environment Variables

Create a `backend/.env` file when local secrets or custom settings are needed:

```env
FLASK_SECRET_KEY=replace-with-a-long-random-value
JWT_SECRET_KEY=replace-with-a-long-random-value
CORS_ORIGIN=http://localhost:5173
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
# Used only when TURSO_DATABASE_URL is empty
DATABASE_PATH=./tutor.db
GROQ_API_KEY=your-groq-key
GROQ_MODEL=optional-preferred-model
GEMINI_API_KEY=optional-gemini-key
```

`GROQ_API_KEY` is required for live Groq requests. The code also checks `OPENAI_API_KEY` as a compatibility fallback, but the active provider is Groq. Gemini is optional and is used only for image generation.

Install dependencies with:

```bash
pip install -r requirements.txt
```

## 5. Database

`database.py` connects to Turso when `TURSO_DATABASE_URL` is configured. A small libSQL adapter preserves the existing connection interface used by the routes and models. When the Turso URL is empty, the backend falls back to local SQLite at `DATABASE_PATH`.

To initialise the Turso schema, set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `backend/.env`, install the declared dependencies with `pip install -r requirements.txt`, and run:

```bash
python database.py
```

Existing local `tutor.db` data is not uploaded automatically. Migrate it separately if it must be preserved.

### Tables

- `users`: account data, hashed password, education level, and creation time.
- `topics`: unique learning topics, categories, and descriptions.
- `learning_sessions`: user topic sessions, difficulty, duration, and completion state.
- `notes`: user-owned Markdown notes linked to topics.
- `quizzes`: quiz ownership, topic, difficulty, score, and question count.
- `questions`: quiz questions, four options, correct answer, explanation, concept tag, and hint.
- `quiz_answers`: selected answer and correctness for each submitted question.
- `learner_profiles`: one adaptive profile per user, including mastery and weak/strong topics stored as JSON text.
- `topic_progress`: per-user, per-topic mastery, accuracy, and attempt count.

Relationships:

```text
users 1---many learning_sessions many---1 topics
users 1---many notes             many---1 topics
users 1---many quizzes            many---1 topics
quizzes 1---many questions
quizzes 1---many quiz_answers      many---1 questions
users 1---1 learner_profiles
users 1---many topic_progress     many---1 topics
```

`init_db()` is idempotent and seeds starter topics such as Python Basics, Transformers, Backpropagation, Big-O Notation, and Linear Regression. It also attempts a migration for the `questions.hint` column.

## 6. Data Access Layer

`models.py` contains plain SQL data-access helper functions. Routes and services pass an open connection to these functions, regardless of whether the connection is Turso/libSQL or local SQLite.

Main groups of operations:

- Users: find by email or ID and create a user with an empty learner profile.
- Topics: list, find, and lookup-or-create by case-insensitive name.
- Sessions: create, list recent sessions, find the last session, and mark complete.
- Notes: list, read, create, update, and delete with user ownership checks.
- Quizzes: create, read, score, and list completed quizzes.
- Questions and answers: create and retrieve quiz data and answer breakdowns.
- Profiles: read and update adaptive learner profiles.
- Progress: upsert topic progress and calculate dashboard aggregates such as streak, accuracy, completed topics, and total learning time.

## 7. Authentication and Error Handling

### Authentication

`services/auth_service.py` provides:

- `hash_password()` using Werkzeug
- `verify_password()` using Werkzeug
- `generate_token()` using HS256 JWTs
- `decode_token()` with a 72-hour expiry

Protected routes use `routes/middleware.py::require_auth`. It requires:

```text
Authorization: Bearer <jwt-token>
```

The middleware validates the token, loads the user from SQLite, and sets `g.user_id`, `g.user`, and `g.conn` for the route.

### Errors

`utils/error_handling.py` converts exceptions to JSON responses:

- `ValueError` -> 400
- `PermissionError` -> 403
- `LookupError` -> 404
- unexpected errors -> 500
- AI authentication/configuration errors -> 503
- AI rate limits -> 429
- other AI provider failures -> 502

## 8. API Endpoints

All endpoints return JSON unless stated otherwise. Every endpoint below except registration, login, and health requires a JWT bearer token.

### Health and authentication

| Method | Endpoint               | Purpose                                                        |
| ------ | ---------------------- | -------------------------------------------------------------- |
| GET    | `/api/health`        | Check that the API is running                                  |
| POST   | `/api/auth/register` | Validate input, hash password, create user/profile, return JWT |
| POST   | `/api/auth/login`    | Verify credentials and return JWT plus user data               |

Registration accepts `name`, `email`, `password`, and `education_level`. Valid education values are `school`, `diploma`, `undergraduate`, `graduate`, and `other`.

### Dashboard and progress

| Method | Endpoint                          | Purpose                                                                              |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/dashboard`                | Return profile, stats, recommendations, recent sessions, quizzes, and topic progress |
| GET    | `/api/progress`                 | Return topic mastery, quiz history, and streak                                       |
| GET    | `/api/performance?quiz_id=<id>` | Return score, accuracy, strong areas, weak areas, and answer breakdown               |

### Tutor and AI learning

| Method | Endpoint               | Purpose                                                        |
| ------ | ---------------------- | -------------------------------------------------------------- |
| POST   | `/api/tutor/explain` | Generate an adaptive explanation and create a learning session |
| POST   | `/api/tutor/diagram` | Generate a Mermaid diagram for a topic                         |
| POST   | `/api/tutor/notes`   | Generate and save Markdown revision notes                      |
| POST   | `/api/chat`          | Generate a short, deep, or example-based AI response           |
| POST   | `/api/tutor/image`   | Generate a topic-specific educational image or SVG fallback    |

`/api/tutor/explain` accepts `topic`, optional `follow_up_question`, and optional language `lang` (`en`, `hi`, `or`, or `bn`). It returns explanation text, extracted key points, difficulty, weak topics, topic information, and session ID.

`/api/chat` accepts `message`, optional `current_topic`, `mode` (`short`, `deep`, or `example`), and optional conversation `history`.

### Notes

| Method | Endpoint                 | Purpose                             |
| ------ | ------------------------ | ----------------------------------- |
| GET    | `/api/notes`           | List the authenticated user's notes |
| POST   | `/api/notes`           | Create a note                       |
| GET    | `/api/notes/<note_id>` | Read one owned note                 |
| PUT    | `/api/notes/<note_id>` | Update one owned note               |
| DELETE | `/api/notes/<note_id>` | Delete one owned note               |

Create and update requests require `title` and `content`. A topic can be supplied by name.

### Quizzes

| Method | Endpoint                   | Purpose                                             |
| ------ | -------------------------- | --------------------------------------------------- |
| POST   | `/api/quiz/generate`     | Generate and save at least 10 validated questions   |
| POST   | `/api/quiz/check-answer` | Check one answer during gameplay                    |
| POST   | `/api/quiz/submit`       | Score the complete quiz and update learner progress |

Quiz generation accepts `topic`, optional `topic_id`, `difficulty`, and `question_count` or `num_questions`. The backend enforces a minimum of 10 questions and does not send correct answers during generation.

Quiz submission accepts `quiz_id` and an `answers` array containing `question_id`, `selected_answer`, and optional `hint_used`. Scoring is server-side and includes correctness, lives, streak bonuses, hint penalties, review data, and adaptive profile updates.

### Voice

| Method | Endpoint                  | Request                         | Response              |
| ------ | ------------------------- | ------------------------------- | --------------------- |
| POST   | `/api/voice/transcribe` | Multipart`audio` file         | `{ "text": "..." }` |
| POST   | `/api/voice/speak`      | JSON`text`, optional `lang` | Base64 MP3 audio      |

Supported speech languages include English, Hinglish/Hindi, Odia, and Bengali mappings.

## 9. Adaptive Learning

`services/adaptive_service.py` uses deterministic thresholds rather than machine learning:

- mastery below 50 -> `beginner`
- mastery from 50 through 79.9 -> `intermediate`
- mastery 80 or higher -> `advanced`

For a topic, difficulty comes from `topic_progress.mastery_score`. If no topic progress exists, the learner's overall profile level is used.

Weak concepts are derived from the three most recent completed quizzes for that topic. A concept is weak when its recent accuracy is below 60%.

After a quiz:

1. Quiz accuracy is calculated as correct answers divided by total questions.
2. Topic mastery is updated with a moving average over attempts.
3. Topic progress is upserted.
4. Overall mastery is recalculated across topics.
5. The current level is recalculated.
6. Topics below 60 mastery become weak topics.
7. Topics at or above 80 mastery become strong topics.

## 10. AI Components

### Groq client

`ai/groq_client.py` manages a singleton Groq client and tries a configured model cascade when a model is unavailable. It cleans model output by removing reasoning tags, unwanted formatting artifacts, and raw equation wrappers.

It also detects broad subject categories such as computer science, biology, chemistry, physics, mathematics, history, and economics. When no valid API key is configured, built-in fallback responses can produce explanations, Mermaid diagrams, notes, and quiz JSON.

### Explanations and diagrams

`ai/explain.py` calls the tutor prompt builder, generates an explanation, sanitizes the text, and can request a Mermaid flowchart. Tutor prompts adapt to learner level, weak concepts, language, and subject domain.

### Notes

`ai/notes_generator.py` transforms an explanation into structured Markdown notes using the notes prompt. The generated result is saved in the `notes` table by the tutor route.

### Quizzes

`ai/quiz_generator.py`:

1. Extracts JSON from model output.
2. Accepts common response shapes such as an array or `{ "questions": [...] }`.
3. Requires a question, four distinct options, and a valid answer.
4. Normalizes numeric and letter answer formats.
5. Adds explanations, hints, and concept tags when missing.
6. Removes duplicate questions.
7. Regenerates or supplies synthetic questions until the requested minimum is reached.

### Chat

`ai/chat.py` supports short, deep, and example modes. It includes recent conversation history, current topic context, subject-aware instructions, and natural Hinglish behavior when appropriate.

### Voice

`ai/voice.py` sends uploaded audio to Groq Whisper when configured. Without a valid key, transcription returns a safe sample fallback sentence. Speech synthesis uses gTTS with Indian regional language mappings and returns MP3 bytes.

### Images

`routes/image_routes.py` uses this order:

1. Gemini image generation when `GEMINI_API_KEY` is configured.
2. Topic-specific AI-generated SVG through the Groq client.
3. A deterministic subject-adaptive SVG fallback.

The response contains `image_base64` and `mime_type`.

## 11. Main Request Flows

### Registration and login

```text
React form
  -> POST /api/auth/register or /api/auth/login
  -> auth_routes.py validates request
  -> auth_service.py hashes/checks password
  -> models.py reads or writes users
  -> JWT is generated
  -> JSON token and user returned to frontend
```

### Adaptive explanation

```text
POST /api/tutor/explain
  -> authenticate user
  -> get or create topic
  -> read topic progress and weak concepts
  -> choose difficulty
  -> build tutor prompt
  -> call Groq or fallback
  -> save learning session
  -> return explanation and key points
```

### Quiz lifecycle

```text
POST /api/quiz/generate
  -> choose topic, difficulty, and weak concepts
  -> generate and validate MCQs
  -> save quiz and questions
  -> return questions without answers

POST /api/quiz/check-answer
  -> verify quiz ownership and question membership
  -> compare submitted answer with stored answer
  -> return correctness and explanation

POST /api/quiz/submit
  -> verify quiz ownership
  -> evaluate all submitted answers server-side
  -> calculate score, streak, lives, and hint effects
  -> save answers and final score
  -> update adaptive progress
  -> return result and review information
```

### Notes and progress

```text
Generated explanation or user note
  -> notes route or tutor notes route
  -> models.py saves note content
  -> dashboard/progress/performance routes aggregate user-owned records
  -> JSON is returned for frontend cards and charts
```

## 12. Backend Dependencies

The dependencies declared in `requirements.txt` are:

- `flask`
- `flask-cors`
- `python-dotenv`
- `groq`
- `uvicorn`
- `gTTS`
- `a2wsgi`
- `PyJWT`
- `werkzeug`
- `google-genai`

## 13. Important Implementation Notes

- Passwords are stored as hashes, never as plain text.
- User-owned notes, quizzes, and progress are filtered by authenticated user ID.
- Quiz answers and explanations are withheld during quiz generation to reduce client-side answer exposure.
- Quiz scoring and mastery updates happen on the server.
- SQLite timestamps are stored as text values.
- The project has older design documents that mention OpenAI, but the current AI implementation uses Groq and keeps `openai_client.py` only as a compatibility alias.
- Turso is the primary database target. Local SQLite is retained only as a development fallback when `TURSO_DATABASE_URL` is unset.
- Production deployments should replace development secret defaults, configure a persistent database path, add request limits, and use stronger migration and testing practices.
