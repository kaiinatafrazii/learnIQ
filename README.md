# LearnIQ — AI-Powered Adaptive Learning Tutor

An AI tutor web application that teaches students any topic through adaptive explanations, quizzes, and personalized feedback.

**Core Loop:** LEARN → NOTES → TEST → ANALYZE → ADAPT → IMPROVE

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (`node -v`)
- **Python** 3.9+ (`python --version`)
- **Groq API Key** (`GROQ_API_KEY`)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies (system python)
pip install -r requirements.txt

# Create environment file
copy .env.example .env
# Then edit .env and add your GROQ_API_KEY

# Run the backend with Uvicorn
uvicorn app:app --reload --port 5000
# (or: python app.py)
# → API running on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already done if you followed setup)
npm install

# Start development server
npm run dev
# → Vite running on http://localhost:5173
```

### 3. Open the App

Visit **http://localhost:5173** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)
```
GROQ_API_KEY=gsk_your-key-here
GROQ_MODEL=llama-3.3-70b-versatile
FLASK_SECRET_KEY=change-me-to-a-random-string
JWT_SECRET_KEY=change-me-to-another-random-string
DATABASE_PATH=./tutor.db
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:5000
```

---

## Project Structure

```
learnIQ/
├── docs/              ← PRD, TRD, UI-UX-Design, Backend-Schema
├── frontend/          ← Vite + React + Tailwind CSS
│   └── src/
│       ├── components/  ← Sidebar, Navbar, StatCard, TopicCard, Toast
│       ├── pages/       ← Landing, Login, Signup, Dashboard, Tutor, Notes, Quiz, Progress, Chat
│       ├── services/    ← api.js (Axios)
│       ├── hooks/       ← useAuth.js
│       └── utils/       ← formatters.js
└── backend/           ← Flask + SQLite
    ├── app.py          ← Flask factory
    ├── database.py     ← SQLite schema + seed data
    ├── models.py       ← Data-access helpers
    ├── routes/         ← auth, dashboard, tutor, notes, quiz, chat, voice, performance, progress
    ├── services/       ← auth_service, adaptive_service
    ├── ai/             ← groq_client, explain, quiz_generator, notes_generator, chat, voice
    └── prompts/        ← tutor_prompts, quiz_prompts, notes_prompts, feedback_prompts
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET  | `/api/dashboard` | Dashboard data |
| POST | `/api/tutor/explain` | AI explanation |
| POST | `/api/tutor/diagram` | Mermaid diagram |
| POST | `/api/tutor/notes` | Auto-generate notes |
| GET  | `/api/notes` | List notes |
| POST | `/api/quiz/generate` | Generate MCQ quiz |
| POST | `/api/quiz/submit` | Submit quiz + get feedback |
| GET  | `/api/progress` | Progress chart data |
| POST | `/api/chat` | AI chatbot |
| POST | `/api/voice/transcribe` | Speech-to-text |
| POST | `/api/voice/speak` | Text-to-speech |

---

## Technology Stack

- **Frontend:** React (Vite), Tailwind CSS, Chart.js, Mermaid.js
- **Backend:** Python, Flask, Uvicorn, a2wsgi, Flask-CORS, PyJWT
- **Database:** SQLite
- **AI:** Groq API (Llama-3.3-70b-versatile, Whisper Large v3), gTTS
- **Deployment:** Vercel (frontend) + Render (backend)
