# Technical Requirement Document (TRD)
## AI-Powered Adaptive Learning Tutor

**Version:** 1.0
**Companion docs:** [PRD.md](PRD.md), [UI-UX-Design.md](UI-UX-Design.md), [Backend-Schema.md](Backend-Schema.md)

---

## 1. Technology Stack

### Frontend
- React.js (Vite)
- JavaScript (no TypeScript — keep it simple)
- Tailwind CSS
- React Router (page navigation)
- Axios (HTTP client)
- Chart.js + react-chartjs-2 (progress charts)
- Mermaid.js (diagram rendering)

### Backend
- Python 3
- Flask
- Flask-CORS
- PyJWT (or Flask session) for simple auth tokens
- Werkzeug `generate_password_hash` / `check_password_hash` for password hashing

### Database
- SQLite (file-based, via Python's built-in `sqlite3` or a thin wrapper)

### AI
- OpenAI API (chat/completions model for explanations, quizzes, chat, feedback)
- OpenAI Whisper/speech endpoint for speech-to-text
- OpenAI TTS endpoint for text-to-speech, with browser `speechSynthesis` as fallback

### Deployment
- Frontend → Vercel
- Backend → Render

### Explicitly excluded
Next.js, MongoDB, Kubernetes, Docker (unless strictly required), LangChain (unless a real need arises), multi-agent frameworks, paid 3D avatar platforms.

---

## 2. Architecture

### 2.1 High-level request flow

```
React (frontend)
   ↓ Axios (JSON over HTTPS)
Flask (backend, routes/ + services/)
   ↓
OpenAI API (ai/ + prompts/)
   ↓
AI Response
   ↓
SQLite (persist session/profile/notes/quiz)
   ↓
JSON response back to React
```

### 2.2 Adaptive learning pipeline

```
Student Data (learner_profiles, topic_progress)
   ↓
Performance Analyzer (services/performance.py)
   ↓
Learning Profile (mastery %, weak/strong topics, level)
   ↓
Difficulty Selection (Beginner / Intermediate / Advanced)
   ↓
AI Prompt (prompts/tutor_prompts.py — structured context)
   ↓
Personalized Explanation
```

The Performance Analyzer is a plain Python module — a set of functions, not a service/microservice. It reads rows from `topic_progress` / `learner_profiles`, computes an aggregate mastery score and a difficulty label, and returns weak/strong concept lists derived from `quiz_answers`.

### 2.3 Why this architecture

- **Two-tier (SPA + REST API)** is enough for a single-user-facing diploma project — no gateway, no message queue, no worker pool.
- **SQLite** avoids running a separate DB server; it's a single file, trivial to back up/reset, and adequate for the expected load.
- **Stateless Flask routes** call into `services/` for business logic and `ai/` for OpenAI calls, keeping route handlers thin and testable.
- **Prompt functions** are pure Python functions that take structured student context and return a prompt string — this keeps "AI architecture" reviewable and swappable without an agent framework.

---

## 3. Project Structure

```
Tutor/
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── UI-UX-Design.md
│   └── Backend-Schema.md
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI: Navbar, Sidebar, AvatarPanel, VoiceControls,
│   │   │                      #   DiagramView, NoteCard, QuizQuestion, StatCard, ChatBubble...
│   │   ├── pages/             # LandingPage, Login, Signup, Dashboard, TutorPage,
│   │   │                      #   NotesPage, QuizPage, PerformancePage, ProgressPage, ChatPage
│   │   ├── services/          # api.js (axios instance), auth.js, tutor.js, quiz.js,
│   │   │                      #   notes.js, chat.js, voice.js, progress.js
│   │   ├── hooks/              # useAuth, useVoice, useAvatarState
│   │   ├── utils/              # formatters, difficultyLabels, localStorage helpers
│   │   ├── assets/             # avatar images/animations, icons
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── app.py                 # Flask app factory + route registration
│   ├── database.py            # SQLite connection + init (create tables)
│   ├── models.py               # Simple data-access functions per table
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── dashboard_routes.py
│   │   ├── tutor_routes.py
│   │   ├── notes_routes.py
│   │   ├── quiz_routes.py
│   │   ├── performance_routes.py
│   │   ├── progress_routes.py
│   │   ├── chat_routes.py
│   │   └── voice_routes.py
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── tutor_service.py
│   │   ├── notes_service.py
│   │   ├── quiz_service.py
│   │   ├── performance_service.py     # weak/strong concept analysis
│   │   └── adaptive_service.py        # learner profile + difficulty selection
│   ├── ai/
│   │   ├── openai_client.py            # thin wrapper around OpenAI SDK calls
│   │   ├── explain.py
│   │   ├── diagram.py
│   │   ├── quiz_generator.py
│   │   ├── notes_generator.py
│   │   ├── chat.py
│   │   └── voice.py                    # STT/TTS wrappers
│   ├── prompts/
│   │   ├── tutor_prompts.py
│   │   ├── quiz_prompts.py
│   │   ├── notes_prompts.py
│   │   └── feedback_prompts.py
│   ├── utils/
│   │   ├── error_handling.py
│   │   └── validators.py
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 4. API Design

All endpoints return JSON. Auth-protected endpoints require a bearer token (JWT) issued at login, sent as `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | name, email, password, education_level | Creates user, returns token |
| POST | `/api/auth/login` | email, password | Returns token + user profile |

### Dashboard
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/dashboard` | Returns streak, accuracy, topics completed, weak topics, recommended topic |

### Tutor
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/tutor/explain` | topic, (optional) follow_up_question | Runs adaptive pipeline, returns explanation + key points |
| POST | `/api/tutor/diagram` | topic, explanation_context | Returns Mermaid diagram definition |
| POST | `/api/tutor/notes` | topic, explanation | Generates + saves structured notes |

### Chat
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/chat` | message, current_topic (optional), mode (short/deep/example) | Short by default (2–5 sentences) |

### Voice
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/voice/transcribe` | audio file (multipart) | Returns transcribed text |
| POST | `/api/voice/speak` | text | Returns audio (base64 or stream) |

### Quiz
| Method | Endpoint | Body | Notes |
|---|---|---|---|
| POST | `/api/quiz/generate` | topic_id | Difficulty chosen from learner profile |
| POST | `/api/quiz/submit` | quiz_id, answers[] | Scores quiz, updates profile, returns analysis |

### Performance & Progress
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/performance?topic_id=` | Strong/weak areas + AI feedback for latest quiz |
| GET | `/api/progress` | Chart-ready data: mastery per topic, accuracy trend, streak |

### Notes
| Method | Endpoint | Body |
|---|---|---|
| GET | `/api/notes` | — |
| POST | `/api/notes` | topic_id, title, content |
| PUT | `/api/notes/:id` | title, content |
| DELETE | `/api/notes/:id` | — |

**Error handling convention:** every route wraps OpenAI calls in try/except; on failure, return `{ "error": "friendly message" }` with HTTP 502/503, never a raw stack trace. The frontend shows a toast/inline message and a retry action.

---

## 5. Adaptive Learning Logic (implementation notes)

`services/adaptive_service.py` exposes:

```python
def get_difficulty(user_id, topic_id) -> str:
    """Returns 'beginner' | 'intermediate' | 'advanced' based on topic_progress.mastery_score
    and learner_profiles.current_level."""

def get_weak_concepts(user_id, topic_id) -> list[str]:
    """Derived from quiz_answers.is_correct grouped by concept tag over recent attempts."""

def update_profile_after_quiz(user_id, topic_id, quiz_result) -> None:
    """Recomputes mastery_score, quiz_accuracy, attempts, weak/strong topics,
    and current_level; writes to topic_progress + learner_profiles."""
```

Thresholds (simple, tunable constants — not ML):
- `mastery_score >= 80` → advanced
- `50 <= mastery_score < 80` → intermediate
- `mastery_score < 50` → beginner

`prompts/tutor_prompts.py::generate_tutor_prompt(topic, level, weak_topics)` builds a structured instruction block (student level, mastery %, weak concepts, explicit instruction to spend extra time on weak concepts, one analogy, one diagram) and passes it to `ai/explain.py`, which calls the OpenAI client.

---

## 6. Voice Implementation Notes

- Frontend captures audio via `MediaRecorder` (mic button → recording state → stop → blob).
- Blob is POSTed to `/api/voice/transcribe`; backend forwards to OpenAI's speech-to-text.
- Returned text is sent through the normal chat/tutor flow.
- AI text response is POSTed to `/api/voice/speak`; backend calls OpenAI TTS and returns audio.
- If `/api/voice/speak` fails or the API key/quota is unavailable, frontend falls back to `window.speechSynthesis.speak(...)`.
- Avatar state (`idle` / `listening` / `thinking` / `speaking`) is driven by a small state machine in `hooks/useAvatarState.js`, synced to: mic active → listening; request in flight → thinking; audio playing → speaking; otherwise idle.

---

## 7. Environment Variables

Backend (`backend/.env`):
```
OPENAI_API_KEY=sk-...
FLASK_SECRET_KEY=change-me
JWT_SECRET_KEY=change-me
DATABASE_PATH=./tutor.db
CORS_ORIGIN=http://localhost:5173
```

Frontend (`frontend/.env`):
```
VITE_API_BASE_URL=http://localhost:5000
```

**Rule:** the OpenAI key is only ever read on the backend via `os.environ`. It is never sent to or referenced in frontend code.

---

## 8. Required Packages

### npm (frontend)
```
react react-dom react-router-dom axios chart.js react-chartjs-2 mermaid
tailwindcss postcss autoprefixer
vite @vitejs/plugin-react
```

### pip (backend)
```
flask
flask-cors
python-dotenv
openai
pyjwt
werkzeug
```

---

## 9. Testing Strategy (Phase 9)

- **Auth:** register/login happy path + duplicate email + wrong password.
- **AI errors:** simulate OpenAI failure/timeout → verify friendly error, no crash.
- **Quiz scoring:** submit known answer set → verify score/accuracy math.
- **Database:** verify tables created on first run; verify foreign keys are respected at the application level.
- **Responsive UI:** manually check landing/dashboard/tutor pages at mobile/tablet/desktop breakpoints.
- **Voice:** test mic permission denied, empty recording, and TTS fallback path.
- **API failures:** verify every route returns JSON errors, never HTML error pages, to the frontend.

## 10. Deployment Notes

- **Frontend (Vercel):** set `VITE_API_BASE_URL` to the deployed Render backend URL as a Vercel env var; build command `npm run build`, output `dist/`.
- **Backend (Render):** set `OPENAI_API_KEY`, `FLASK_SECRET_KEY`, `JWT_SECRET_KEY`, `CORS_ORIGIN` (the Vercel domain) as Render env vars. SQLite file persists on Render's disk for MVP purposes (acceptable for a diploma project; note that Render's free tier filesystem is ephemeral on redeploy — mention this as a known limitation, not something to solve with Postgres in MVP).
- CORS on Flask restricted to the deployed frontend origin via `Flask-CORS`.

---

## 11. Development Order (matches PRD phases)

1. React UI shell (routing, layout, Tailwind, all pages as static screens)
2. Flask backend skeleton + SQLite schema + auth
3. AI Tutor explain/chat endpoints wired to OpenAI
4. Smart Notes generation + CRUD
5. Quiz generation + submission + scoring
6. Performance analysis (weak/strong concepts + AI feedback)
7. Adaptive learning (profile-driven difficulty, wired into tutor + quiz prompts)
8. Voice (STT/TTS + mic UI)
9. Avatar states + Mermaid diagrams
10. Testing + deployment

Every feature must work end-to-end before starting the next phase.
