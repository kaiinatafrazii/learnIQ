# LearnIQ AI Tutor - Interview Preparation

Har answer pehle simple real-life example se samjho, phir technical detail bolo.

## 1. Tell me about your project

### Easy Answer

"Mera project LearnIQ AI Tutor ek learning application hai. Student topic enter karta hai aur Groq AI se explanation, notes aur quiz paata hai. Quiz Hangman-style hai, jisme lives, score aur streak hain. App student ki quiz performance ke basis par difficulty aur progress track karta hai."

### If interviewer asks deeper

"Frontend React mein hai, backend Flask mein hai aur SQLite persistence ke liye hai. JWT authentication use hoti hai. Groq text generation aur Whisper transcription provide karta hai."

## 2. Explain your project

### Easy Answer

"Student signup ya login ke baad topic choose karta hai. React Flask API ko request bhejta hai. Flask difficulty aur weak concepts check karke Groq se content generate karwata hai. Result React par show hota hai aur quiz, notes, answers aur progress SQLite mein save hote hain."

### If interviewer asks deeper

"Main flow `App.jsx`, `api.js`, Flask blueprints, `models.py` aur `groq_client.py` se pass hota hai. Protected APIs JWT Bearer token verify karti hain."

## 3. How does your project work?

### Easy Answer

"Frontend user se input leta hai, API waiter ki tarah request backend tak le jati hai, aur backend result lekar React ko deta hai. Backend zarurat ke according SQLite se saved data read karta hai ya Groq AI se naya answer banwata hai."

### If interviewer asks deeper

"React components Axios ke through JSON requests bhejte hain. Flask route validation, authentication aur business logic execute karke JSON response return karta hai."

## 4. What is the architecture?

### Easy Answer

"Ye simple frontend-backend architecture hai. React UI handle karta hai, Flask API aur logic handle karta hai, SQLite data save karta hai, aur Groq AI learning content generate karta hai."

### If interviewer asks deeper

"`backend/app.py` Flask blueprints register karta hai. Routes services, AI modules aur `models.py` ko call karte hain. Frontend routes `App.jsx` mein protected hain."

## 5. Why React?

### Easy Answer

"React isliye use kiya kyunki learning app mein screen baar-baar update hoti hai, jaise quiz score, lives aur chat messages. React state se bina full page reload ke UI update ho jata hai."

### If interviewer asks deeper

"Pages aur reusable components alag hain, jaise `QuizQuestion`, `QuizLives`, `QuizResult` aur `MermaidViewer`. Routing React Router se hai."

## 6. Why Flask?

### Easy Answer

"Flask backend ka brain hai. Ye frontend ki request receive karta hai, user ko authenticate karta hai, database ya Groq ko call karta hai aur response deta hai."

### If interviewer asks deeper

"Flask Blueprints ke through auth, tutor, quiz, notes, chat, voice, progress aur dashboard routes alag modules mein organized hain."

## 7. Why SQLite?

### Easy Answer

"SQLite digital notebook jaisa simple database hai. Is project ke local learning app ke liye ye easy to setup hai aur alag database server ki zarurat nahi hoti."

### If interviewer asks deeper

"`database.py` tables create karta hai aur `models.py` parameterized SQL helpers ke through CRUD aur aggregate queries handle karta hai."

## 8. How does Groq integration work?

### Easy Answer

"Groq ko AI teacher ki tarah use kiya hai. Backend prompt banakar Groq ko bhejta hai, Groq explanation ya quiz content deta hai, aur Flask us response ko React ko return karta hai."

### If interviewer asks deeper

"Common integration `backend/ai/groq_client.py` ke `chat_completion()` function mein hai. `GROQ_API_KEY` aur optional `GROQ_MODEL` use hote hain. Model failure par fallback model cascade aur built-in fallback response available hai. `openai_client.py` actual OpenAI call nahi karta; wo Groq compatibility alias hai."

## 9. How does your quiz work?

### Easy Answer

"Student topic aur difficulty select karta hai. Groq questions banata hai, backend unhe validate karke SQLite mein save karta hai, aur React ek-ek question show karta hai. Har answer ke baad result dikhta hai aur end mein final performance milti hai."

### If interviewer asks deeper

"Flow `QuizGame.jsx` -> `quizService.js` -> `/api/quiz/generate` -> `quiz_routes.py` -> `quiz_generator.py` -> `groq_client.py` hai."

## 10. How does Hangman-style quiz work?

### Easy Answer

"Normal MCQ ke saath ek game layer add ki gayi hai. Student ke paas 5 lives hoti hain. Sahi answer se character safe rehta hai, galat answer se life lose hoti hai."

### If interviewer asks deeper

"`HangmanGame.jsx` visual game state dikhata hai aur `QuizLives.jsx` five-heart display dikhata hai. Actual correctness `/api/quiz/check-answer` se validate hoti hai."

## 11. How do you generate minimum 10 questions?

### Easy Answer

"Backend requested count ko minimum 10 karta hai. AI se kam valid questions aaye to system missing questions regenerate karta hai. Phir bhi kam hon to built-in templates se questions fill karta hai."

### If interviewer asks deeper

"`quiz_generator.py` JSON parse, unique question, four distinct options aur answer key validate karta hai. `generate_mcqs()` final list ko target count tak return karta hai."

## 12. How does adaptive learning work?

### Easy Answer

"System student ki previous performance dekhta hai. Achhe score par next level difficult ho sakta hai. Low score ya repeated mistakes par beginner level aur weak concept revision suggest hota hai."

### If interviewer asks deeper

"`adaptive_service.py` mastery below 50 ko beginner, 50-79.9 ko intermediate aur 80+ ko advanced maanta hai. Recent three quizzes ke concept tags mein 60% se kam accuracy weak concept hoti hai."

## 13. How is score calculated?

### Easy Answer

"Har correct answer 100 points ka hai. Consecutive correct answers par streak bonus milta hai. Wrong answer par life aur streak lose hoti hai, aur hint use karne par 10 points minus hote hain."

### If interviewer asks deeper

"Streak 2 par +20, streak 3 par +40 aur streak 5 ya usse zyada par +75 bonus hai. Final score `quiz_routes.py` ka `submit_quiz()` server-side calculate karta hai. Mastery ke liye points nahi, correct answers ki accuracy use hoti hai."

## 14. How is user data stored?

### Easy Answer

"Database ek digital notebook ki tarah hai. `users` mein account, `notes` mein notes, `quizzes` mein quiz, `quiz_answers` mein answers aur progress tables mein mastery save hoti hai."

### If interviewer asks deeper

"Passwords plain text mein nahi, Werkzeug hash ke form mein save hote hain. User-related routes JWT ke user id se data filter karti hain."

## 15. How does frontend communicate with backend?

### Easy Answer

"React Axios ke through Flask API ko JSON request bhejta hai. `api.js` JWT token request header mein attach karta hai. Flask JSON response return karta hai aur React usse state mein rakhkar UI update karta hai."

### If interviewer asks deeper

"Axios base URL `VITE_API_BASE_URL` ya `http://localhost:5000` hai. 401 response par interceptor local token clear karke login page par redirect karta hai."

## 16. What happens when Groq API fails?

### Easy Answer

"System error ko handle karta hai. Groq key missing ho to built-in educational fallback response mil sakta hai. Quiz feedback fail ho to static feedback dikhaya jata hai, isliye poora result rukta nahi."

### If interviewer asks deeper

"`groq_client.py` model cascade try karta hai. `error_handling.py` key issue ko 503, rate limit ko 429 aur other AI failures ko 502 map karta hai."

## 17. What was the biggest challenge?

### Easy Answer

"Sabse bada challenge reliable AI quiz banana tha, kyunki model kabhi invalid JSON, kam questions ya duplicate options de sakta hai. Isliye maine validation, regeneration aur template fallback rakha."

### If interviewer asks deeper

"`quiz_generator.py` response parse karta hai, options aur answer normalize karta hai, duplicate questions reject karta hai aur minimum 10 questions guarantee karta hai."

## 18. What would you improve?

### Easy Answer

"Main automated tests badhaunga, quiz submit ko idempotent banaunga aur AI responses ko better cache karunga. Production ke liye stronger secret management aur monitoring bhi add karunga."

### If interviewer asks deeper

"Main API contract tests, database migrations, rate limiting, stricter ownership checks aur retry/circuit-breaker strategy add karunga."

## 19. How would you scale this project?

### Easy Answer

"Pehle SQLite ko production database se replace karunga, AI calls ko background jobs mein bhejunga aur frequently used results cache karunga. Frontend aur backend ko independently deploy karke monitoring add karunga."

### If interviewer asks deeper

"Database connection pooling, pagination, request rate limits, centralized logs aur AI provider usage limits add karunga. Current project ko unnecessarily complex microservices mein divide nahi karunga jab tak real load na ho."

## 20. What did YOU personally implement?

### Easy Answer

"Maine is project mein React frontend pages aur quiz UI, Flask API routes, SQLite data models, JWT authentication, Groq AI integration, notes flow, quiz validation/scoring aur adaptive progress flow implement kiya."

### If interviewer asks deeper

"Important implementation files `frontend/src/App.jsx`, `frontend/src/pages/TutorPage.jsx`, `frontend/src/pages/QuizGame.jsx`, `frontend/src/services/api.js`, `frontend/src/services/quizService.js`, `backend/app.py`, `backend/routes/`, `backend/models.py`, `backend/database.py`, `backend/ai/` aur `backend/services/adaptive_service.py` hain."

## Quick Real-life Examples

### API

"API waiter ki tarah hai. React waiter ko request deta hai, waiter Flask ke paas jata hai aur result lekar React ko de deta hai."

### Frontend

"Frontend restaurant ka visible counter hai: jo student screen par dekhta aur click karta hai."

### Backend

"Backend project ka brain hai: request samajhta hai, rules apply karta hai aur result banata hai."

### Database

"Database digital notebook hai jisme user, quiz, answers aur progress safely save hoti hai."

### Groq AI

"Groq AI teacher ki tarah hai: backend usse topic aur instructions deta hai, aur wo explanation ya questions banata hai."

### JWT

"JWT event entry pass ki tarah hai. Login ke baad pass milta hai aur protected pages par backend us pass ko check karta hai."

## One-line Closing

"LearnIQ ka main idea hai: AI se personalized explanation do, quiz se understanding check karo, aur result ke basis par next learning level suggest karo."