# LearnIQ AI Tutor - Complete Code Flow

## 1. App Start Hone Ka Flow

```text
User website open karta hai
        |
        v
Vite React app start hoti hai - frontend/src/main.jsx
        |
        v
App.jsx BrowserRouter aur Routes load karta hai
        |
        v
AuthProvider login state check karta hai
        |
        v
PublicRoute ya ProtectedRoute page decide karta hai
        |
        v
Student ko Landing, Login, Signup ya protected page dikhta hai
```

`App.jsx` mein public routes `/`, `/login`, `/signup` hain. Protected routes `/dashboard`, `/tutor`, `/notes`, `/quiz`, `/progress` aur `/chat` hain. Login ke bina protected page kholne par `/login` redirect hota hai.

## 2. Backend Start Hone Ka Flow

```text
python backend/app.py
        |
        v
app.py -> init_db()
        |
        v
database.py SQLite tables create/check karta hai
        |
        v
create_app() Flask app banata hai
        |
        v
Auth, tutor, notes, quiz, chat, voice, progress blueprints register hote hain
        |
        v
Uvicorn port 5000 par app serve karta hai
```

Frontend ka default API base `http://localhost:5000` hai. Isse `frontend/src/services/api.js` control karta hai. `VITE_API_BASE_URL` set ho to wahi URL use hota hai.

## 3. Signup Aur Login Flow

```text
Student Signup form submit karta hai
        |
        v
Signup.jsx API ko POST /api/auth/register bhejta hai
        |
        v
auth_routes.py input validate karta hai
        |
        v
auth_service.py password hash karta hai
        |
        v
models.py create_user() users table mein user save karta hai
        |
        v
learner_profiles mein empty profile banti hai
        |
        v
generate_token() JWT banata hai
        |
        v
React token aur user localStorage mein save karta hai
        |
        v
Dashboard open hota hai
```

Login mein `POST /api/auth/login` user email se database record leta hai. `verify_password()` password check karta hai. Valid hone par JWT milta hai. `api.js` har next request mein `Authorization: Bearer <token>` attach karta hai.

`routes/middleware.py` ka `require_auth()` token validate karke `g.user_id` set karta hai. Invalid ya missing token par 401 response milta hai.

## 4. Dashboard Flow

```text
Dashboard.jsx load hota hai
        |
        v
GET /api/dashboard
        |
        v
dashboard_routes.py JWT user_id se data leta hai
        |
        v
models.py stats, profile, recent sessions aur quizzes read karta hai
        |
        v
JSON response React state mein aata hai
        |
        v
StatCard, TopicCard aur dashboard sections render hote hain
```

Dashboard profile mastery, weak topics, strong topics, recommended topic, recent sessions aur recent quizzes show karta hai.

## 5. AI Tutor Explanation Flow

```text
Student TutorPage.jsx par topic enter karta hai
        |
        v
POST /api/tutor/explain
Body: topic, optional follow_up_question
        |
        v
tutor_routes.py request receive karta hai
        |
        v
get_or_create_topic() topics table se topic leta ya banata hai
        |
        v
adaptive_service.get_difficulty() level choose karta hai
        |
        v
get_weak_concepts() recent mistakes check karta hai
        |
        v
explain.py -> generate_explanation()
        |
        v
prompts/tutor_prompts.py prompt banata hai
        |
        v
groq_client.chat_completion() Groq model ko request bhejta hai
        |
        v
AI explanation return hoti hai
        |
        v
create_learning_session() learning_sessions table mein record banata hai
        |
        v
Flask explanation, key_points, difficulty aur session_id JSON karta hai
        |
        v
TutorPage.jsx explanation screen par show karta hai
```

AI key fail hone par `groq_client.py` built-in fallback educational response de sakta hai. AI route errors ke liye `utils/error_handling.py` status code mapping rakhta hai.

## 6. Diagram Flow

```text
TutorPage.jsx diagram action
        |
        v
POST /api/tutor/diagram
        |
        v
tutor_routes.py -> generate_diagram()
        |
        v
prompts/tutor_prompts.py diagram prompt
        |
        v
Groq response se Mermaid code
        |
        v
{ mermaid: "..." } React ko milta hai
        |
        v
MermaidViewer.jsx diagram render karta hai
```

## 7. Notes Flow

```text
Student explanation ke baad Generate Notes click karta hai
        |
        v
POST /api/tutor/notes
Body: topic, explanation, optional topic_id
        |
        v
tutor_routes.py -> generate_notes()
        |
        v
notes_generator.py Groq se structured Markdown notes banata hai
        |
        v
models.create_note() notes table mein save karta hai
        |
        v
note_id, title, content React ko milte hain
        |
        v
NotesPage.jsx notes list, edit, delete aur Markdown download handle karta hai
```

Notes API endpoints:

- `GET /api/notes`
- `POST /api/notes`
- `GET /api/notes/<note_id>`
- `PUT /api/notes/<note_id>`
- `DELETE /api/notes/<note_id>`

## 8. Chatbot Flow

```text
Student ChatPage.jsx mein doubt likhta hai
        |
        v
POST /api/chat
Body: message, current_topic, mode, history
        |
        v
chat_routes.py request validate karta hai
        |
        v
chat.py -> generate_chat_response()
        |
        v
Subject detect karke prompt Groq ko jata hai
        |
        v
short, deep ya example response aata hai
        |
        v
{ response } React chat history mein add hota hai
```

## 9. Quiz Generation Flow

```text
Student QuizGame.jsx mein topic aur difficulty choose karta hai
        |
        v
quizService.generateQuiz()
        |
        v
POST /api/quiz/generate
        |
        v
quiz_routes.generate_quiz()
        |
        v
Topic create/read hota hai
        |
        v
adaptive_service difficulty aur weak concepts deta hai
        |
        v
quiz_generator.generate_mcqs()
        |
        v
prompts/quiz_prompts.py prompt banata hai
        |
        v
groq_client.chat_completion() Groq se JSON questions leta hai
        |
        v
quiz_generator JSON parse aur validate karta hai
        |
        v
Missing questions regenerate ya synthetic templates se fill hote hain
        |
        v
quizzes aur questions tables mein data save hota hai
        |
        v
Correct answer/explanation client ko nahi bheje jate
        |
        v
QuizGame.jsx playing phase start karta hai
```

### Minimum 10 questions kaise guarantee hote hain?

`generate_quiz()` input count ko `max(10, count)` karta hai. `generate_mcqs()` pehle Groq questions validate karta hai. Agar count kam ho to missing questions ke liye second AI request hoti hai. Phir bhi count kam ho to `_generate_synthetic_supplements()` templates se questions add karta hai. Isliye final list minimum 10 hoti hai.

### 4 options kyun?

`quiz_generator.py` har question mein `option_a`, `option_b`, `option_c`, `option_d` check karta hai. Options empty ya duplicate hon to question reject hota hai. Isse UI ko fixed four-option format milta hai.

## 10. Complete Quiz Gameplay Flow

```text
QuizGame.jsx quiz data receive karta hai
        |
        v
Question 1 aur 5 lives show hoti hain
        |
        v
Student option select karta hai
        |
        v
POST /api/quiz/check-answer
        |
        v
quiz_routes.check_single_answer() correct answer compare karta hai
        |
        v
is_correct, correct_answer aur explanation return hota hai
        |
        +--> Correct: score +100, streak +1
        |
        +--> Streak 2: +20 bonus; streak 3: +40; streak 5+: +75
        |
        +--> Wrong: lives -1, streak reset
        |
        +--> Hint: score se 10 points minus
        |
        v
Answer recordedAnswers mein save hota hai
        |
        v
Next question ya game over/final question
        |
        v
POST /api/quiz/submit
        |
        v
Backend poore quiz ka final score calculate karta hai
        |
        v
quiz_answers table mein answers save hote hain
        |
        v
Accuracy, performance, recommendation aur AI feedback banta hai
        |
        v
adaptive_service profile/mastery update karta hai
        |
        v
QuizResult.jsx final result show karta hai
```

### Quiz ke important rules

- 10 questions minimum isliye rakhe gaye hain taaki performance ka sample meaningful ho.
- 5 lives hain. Har wrong/unanswered answer par ek life kam hoti hai.
- Wrong answer streak ko zero karta hai.
- Hint use karne par 10 points ka penalty hai.
- Score gameplay points se banta hai: correct answer 100 points plus streak bonus.
- Mastery accuracy correct answers / total questions se banti hai; points se nahi.
- Backend final score ka authority hai, isliye client score par blindly trust nahi kiya jata.
- `lives == 0` hone par response mein `game_over: true` milta hai.
- Frontend jaldi difficulty badge badal sakta hai, lekin current generated question list change nahi hoti.

## 11. Quiz Result Aur Adaptive Flow

```text
quiz_routes.submit_quiz()
        |
        v
Correct aur wrong count calculate
        |
        v
Accuracy calculate
        |
        v
Performance level decide
85%+ Advanced
60-84.9% Intermediate
below 60% Beginner / Needs Revision
        |
        v
update_profile_after_quiz()
        |
        v
topic_progress mastery aur attempts update
        |
        v
learner_profiles overall mastery, level, weak/strong topics update
        |
        v
feedback_prompts.py personalized feedback prompt banata hai
        |
        v
Groq improvement suggestion deta hai
        |
        v
QuizResult.jsx result, mistakes aur next recommendation show karta hai
```

## 12. Database Flow

Database file `backend/database.py` SQLite connection banati hai. Default path `./tutor.db` hai. Data access helpers `backend/models.py` mein hain.

| Table | Simple meaning |
|---|---|
| `users` | Student ka name, email, password hash aur education level |
| `topics` | Learning topics aur category |
| `learning_sessions` | Student ne kis topic par learning session start kiya |
| `notes` | AI ya student ke saved notes |
| `quizzes` | Quiz owner, topic, difficulty, total questions aur score |
| `questions` | Quiz ke question, 4 options, correct answer, hint aur explanation |
| `quiz_answers` | Student ka selected answer aur correctness |
| `learner_profiles` | Overall mastery, current level, weak aur strong topics |
| `topic_progress` | Har user-topic ka mastery, accuracy aur attempts |

Relationships simple example:

- Ek `user` multiple `learning_sessions`, `notes` aur `quizzes` rakh sakta hai.
- Ek `quiz` ke andar multiple `questions` hote hain.
- Ek question ka answer `quiz_answers` mein save hota hai.
- Ek user ka ek topic par ek `topic_progress` record hota hai.
- `quizzes.topic_id` aur `topic_progress.topic_id` `topics` se connected hain.

## 13. Frontend -> Backend -> Database -> Groq

```text
React component
  - User input aur button event handle karta hai
        |
        v
api.js / quizService.js
  - Axios request, JSON body, JWT token
        |
        v
Flask route
  - Input validate, auth check, business logic
        |
        +--> models.py -> SQLite read/write
        |
        +--> prompt file -> Groq AI request
        |
        v
Flask JSON response
        |
        v
React state update
        |
        v
Screen par result
```

## 14. Voice Flow

```text
VoiceControls.jsx microphone input leta hai
        |
        +--> Browser Web Speech API available: direct transcript
        |
        +--> Fallback: MediaRecorder audio
                    |
                    v
             POST /api/voice/transcribe
                    |
                    v
             voice.py -> Groq Whisper
                    |
                    v
             { text } React ko milta hai
```

Speech output mein browser `speechSynthesis` pehle try hota hai. Backend `/api/voice/speak` `voice.py` ke `synthesize_speech()` se `gTTS` MP3 banata hai.

## 15. Error Handling

`utils/error_handling.py` common errors ko JSON response mein convert karta hai:

- `ValueError` -> 400
- `PermissionError` -> 403
- `LookupError` -> 404
- AI API key issue -> 503
- AI rate limit -> 429
- Other AI failure -> 502
- Unknown error -> 500

Groq key missing hone par `chat_completion()` fallback educational response generate karta hai. Quiz feedback fail hone par static feedback use hota hai, isliye quiz result completely fail nahi hota.