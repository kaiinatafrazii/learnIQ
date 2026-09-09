# Product Requirement Document (PRD)

## AI-Powered Adaptive Learning Tutor

**Version:** 1.0
**Status:** Draft — MVP scope


---

## 1. Overview

The AI Adaptive Learning Tutor is a web application that teaches students any topic through AI-generated explanations, voice interaction, diagrams, auto-generated notes, adaptive quizzes, and personalized performance feedback. It behaves like a personal tutor rather than a generic chatbot — it remembers what a student knows, adjusts difficulty automatically, and tells them exactly what to improve next.

**Core learning loop:**

```
LEARN → NOTES → TEST → ANALYZE → ADAPT → IMPROVE
```

This is a diploma-level student project. The implementation must stay **simple, modular, and practical** — no microservices, no Kubernetes, no complex multi-agent frameworks, no unnecessary technology.

---

## 2. Problem Statement

Students learning technical topics on their own struggle with:

- Generic explanations that don't match their current understanding level.
- No feedback loop — they don't know which specific sub-concepts they're weak in.
- No adaptation — the same material is repeated the same way regardless of performance.
- Passive content (videos/text) with no interactive practice or voice-based teaching.

## 3. Goals

1. Let a student learn any topic through AI explanations tailored to their level.
2. Automatically produce structured notes after every lesson.
3. Test understanding with adaptive MCQ quizzes.
4. Analyze quiz results to find specific weak concepts (not just a score).
5. Adjust future teaching difficulty and content based on a persistent learner profile.
6. Support voice-based interaction (speech in, speech out).
7. Provide a lightweight AI teacher avatar and diagrams to make learning visual, not just text.
8. Provide a short, direct chatbot for quick doubts, aware of current lesson context.

## 4. Non-Goals (MVP)

- No realistic 3D avatar or paid avatar platform.
- No multi-agent AI orchestration or LangChain-style agent graphs.
- No mobile native app — responsive web only.
- No payments/subscriptions.
- No multi-tenant/org accounts, classrooms, or teacher-side dashboards.
- No offline mode.

## 5. Target User

A self-learning student (school, diploma, or early college level) studying technical/academic subjects who wants a faster, more personalized alternative to reading raw textbooks or watching static videos.

## 6. Success Metrics (MVP)

- A student can go from "pick a topic" to "get a personalized weak-topic recommendation" in a single session, with no crashes.
- Notes and quizzes are auto-generated correctly for at least 90% of common topics.
- Difficulty shown to two students with different mastery on the same topic is visibly different.
- Voice input/output works in at least one modern browser, with a text fallback always available.
- OpenAI API failures never crash the app — they show a friendly error and let the user retry.

---

## 7. Core Concept: Learn → Notes → Test → Analyze → Adapt → Improve

| Stage             | What happens                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Learn**   | Student picks/searches a topic. AI explains it at the student's current difficulty level, with an optional diagram and example.                             |
| **Notes**   | AI automatically generates structured notes (definition, key concepts, diagram, example, important points, quick revision) from the lesson.                 |
| **Test**    | Student takes an AI-generated MCQ quiz on the topic, difficulty matched to their profile.                                                                   |
| **Analyze** | Backend scores the quiz, identifies strong/weak sub-concepts (not just %), and generates AI feedback + recommendations.                                     |
| **Adapt**   | The learner profile (mastery, weak topics, difficulty level) is updated.                                                                                    |
| **Improve** | Next time the student studies this topic (or a related one), the AI teaches differently — simpler/deeper, with more focus on the identified weak concepts. |

---

## 8. Features

### 8.1 Landing Page

Public marketing page explaining the product. Sections: Hero, How It Works, AI Teacher, Visual Learning, Smart Notes, Adaptive Quiz, Performance Tracking, AI Chatbot, Call to Action, Footer.

- Hero headline: *"Learn Smarter with Your Personal AI Tutor"*
- Subtitle: *"Understand concepts, visualize ideas, practice with quizzes, and improve with a tutor that adapts to your learning level."*
- CTAs: **Start Learning**, **Try AI Tutor**

### 8.2 Authentication

Simple email/password auth backed by SQLite.

- **Signup:** Name, Email, Password, Education level.
- **Login:** Email, Password.
- No OAuth, no email verification, no password reset flow in MVP.

### 8.3 Student Dashboard

- Welcome message (time-of-day aware, e.g. "Good Morning!")
- "Continue Learning" shortcut to last topic
- Recently studied topics
- Learning streak (consecutive days studied)
- Quiz accuracy (overall %)
- Topics completed count
- Weak topics list
- One recommended topic ("Recommended for you: Revise Backpropagation")
- Recent performance snippet

### 8.4 AI Tutor Page (Main Feature)

Three-column layout:

- **Left:** AI teacher avatar (idle / speaking / thinking / listening states)
- **Center:** Explanation text + visual board (Mermaid diagram when useful)
- **Right:** Topic progress + key points checklist
- **Bottom:** Voice controls (mic, play/pause, stop) + text input box

Controls: Play, Pause, Explain Again, Explain Simply, Give Example, Show Diagram, Slower, Ask Question.

Student can type or speak a question at any point; the AI responds in the context of the current topic.

### 8.5 AI Teaching Logic

On topic selection, the backend:

1. Loads the student's learner profile.
2. Checks prior performance on this topic (if any).
3. Determines difficulty (Beginner / Intermediate / Advanced).
4. Generates an explanation via OpenAI, tailored to that difficulty and any known weak sub-concepts.
5. Generates a diagram (Mermaid) when the topic benefits from one.
6. Generates a worked example.
7. Saves the learning session.
8. Updates the learner profile.

**Difficulty behavior:**

- **Beginner:** simple language, real-world analogies, no unnecessary jargon.
- **Intermediate:** standard explanation, examples, moderate technical depth.
- **Advanced:** technical depth, deeper concepts, applied/reasoning examples.

### 8.6 Adaptive Learning

A persistent learner profile per student tracks: overall score, per-topic mastery, quiz accuracy, weak concepts, strong concepts, current difficulty level, learning history, attempt counts.

The same topic is taught differently to different students based on this profile — e.g., a student at 92% CNN mastery gets an advanced explanation; a student at 55% gets a simplified one with more examples.

### 8.7 Smart Notes

Auto-generated after every lesson, structured as:

```
# Topic Name
## Definition
## Key Concepts
## Diagram (Mermaid, when applicable)
## Example
## Important Points
## Quick Revision
```

Students can view, edit, save, search, delete, and download/print notes.

### 8.8 Quiz System

After a topic lesson, the student is prompted to test their understanding. AI generates MCQs (question, 4 options, correct answer, explanation) at a difficulty derived from the learner profile (Easy/Medium/Hard). Beginner-level students get conceptual questions; advanced students get application/reasoning questions.

### 8.9 Performance Analysis

After a quiz:

- Score and accuracy (e.g., 8/10, 80%)
- Strong areas (sub-concepts answered correctly)
- Weak areas (sub-concepts answered incorrectly)
- AI-generated feedback in plain language (not just marks)
- Concrete recommendations (e.g., "Revise Stride", "Practice 5 questions", "Take a short revision lesson")

### 8.10 Progress Page

Chart.js visualizations: overall progress, per-topic mastery bar chart, quiz accuracy trend, weak vs strong topics, learning streak, recent quiz performance history.

### 8.11 AI Chatbot

A separate, lightweight chat page. Responses default to **2–5 sentences** — never long ChatGPT-style essays. If the student explicitly asks "explain deeply" or "give a simple example," the response length/style adapts accordingly. The chatbot is aware of the student's current/most-recent learning context (topic, level).

### 8.12 Voice Features

- Microphone button with recording state indicator.
- Speech-to-text (OpenAI Whisper/speech API) to capture spoken questions.
- AI text response converted to speech (OpenAI TTS, with browser `speechSynthesis` as a fallback if the API is unavailable).
- Play / pause / stop controls for voice playback.

### 8.13 AI Teacher / Avatar

A simple illustrated or 2D/animated avatar (not a realistic 3D model) with four states: idle, speaking, thinking, listening. Basic mouth/animation sync with speech where feasible. Built as an isolated component so a more advanced avatar can replace it later without touching the rest of the app.

---

## 9. User Stories

- As a student, I want to search or pick a topic so the AI can teach it to me at my level.
- As a student, I want the tutor to remember I'm weak in "stride" so it spends more time on it next time.
- As a student, I want notes automatically written for me so I don't have to take notes by hand.
- As a student, I want a quiz right after learning so I can check if I actually understood it.
- As a student, I want to know *which specific concepts* I got wrong, not just a score.
- As a student, I want to ask quick follow-up questions by voice or text without leaving the lesson.
- As a student, I want a dashboard that tells me what to study next.

## 10. Assumptions & Constraints

- Single OpenAI API key configured via environment variable, never hard-coded or shipped to the frontend.
- SQLite is sufficient for MVP data volume (single-user-at-a-time diploma project scale).
- Browser must support Web Speech API or MediaRecorder for voice fallback.
- Deployment: Frontend on Vercel, Backend on Render.

## 11. Risks

| Risk                                | Mitigation                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| OpenAI API downtime/rate limits     | Friendly error messages, retry button, never crash the UI.                            |
| AI generates incorrect quiz answers | Explanation field on every question; treat as best-effort MVP, not certified content. |
| Voice API unavailable in browser    | Fall back to browser`speechSynthesis` / text input.                                 |
| Scope creep (avatar, agents, etc.)  | Follow the phased development plan strictly; MVP first.                               |

## 12. Release Phases (summary — see TRD for detail)

1. Basic UI (landing, auth, dashboard, nav, responsive layout)
2. AI Tutor (explanation + chat + difficulty)
3. Smart Notes
4. Quiz system
5. Performance analysis
6. Adaptive learning (learner profile driving difficulty)
7. Voice
8. Avatar + diagrams
9. Testing + deployment
