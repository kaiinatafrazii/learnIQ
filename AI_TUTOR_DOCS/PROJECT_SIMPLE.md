# LearnIQ AI Tutor - Simple Explanation

## 1. Project kya hai?

Mera LearnIQ AI Tutor ek learning application hai jisme student kisi bhi topic ko AI se padh sakta hai. Student topic likhta hai, AI simple explanation deta hai, notes banata hai aur us topic ka quiz leta hai.

### Project kyun banaya?

Har student ka learning level aur weak topic alag hota hai. Isliye ek fixed book ya fixed lecture sabke liye equally useful nahi hota. Is project ka goal ek aisa tutor banana hai jo explanation, quiz aur revision ko student ki performance ke according adjust kare.

### Problem kya thi?

- Student ko turant simple explanation nahi milti.
- Notes manually banana time leta hai.
- Normal quiz mein learning game jaisa experience nahi hota.
- Student ko apni weak topics aur progress clearly nahi dikhti.

### Solution kya hai?

LearnIQ mein frontend student se input leta hai. Flask backend request process karta hai. Groq AI explanation, notes, diagrams, quiz aur feedback generate karta hai. SQLite user, quiz, answers aur progress save karta hai.

### User kya kar sakta hai?

- Account create aur login kar sakta hai.
- Topic choose karke AI explanation le sakta hai.
- Follow-up doubt pooch sakta hai.
- Explanation se notes generate, edit, download aur delete kar sakta hai.
- Minimum 10 questions ka Hangman-style quiz khel sakta hai.
- Hint, lives, score aur streak use kar sakta hai.
- Dashboard aur progress charts mein performance dekh sakta hai.
- Chatbot aur voice input/output use kar sakta hai.

### Main features

1. AI Tutor explanation
2. Adaptive difficulty
3. AI-generated notes
4. Mermaid learning diagram
5. Minimum 10-question quiz
6. Hangman-style game with lives
7. Score, streak, hints and feedback
8. Chatbot with short, deep and example modes
9. Progress and mastery tracking
10. Voice transcription and speech output

### Technology stack

| Part | Technology |
|---|---|
| Frontend | React, React Router, Axios, Tailwind CSS |
| Build tool | Vite |
| Backend | Flask, Python |
| Database | SQLite |
| AI text generation | Groq API through `backend/ai/groq_client.py` |
| Speech to text | Groq Whisper `whisper-large-v3` |
| Text to speech | Browser `speechSynthesis` and backend `gTTS` |
| Diagram | Mermaid |
| Charts | Chart.js and `react-chartjs-2` |
| Authentication | JWT and Werkzeug password hashing |

`openai_client.py` project mein hai, lekin ye sirf Groq functions ko re-export karne wala compatibility alias hai. Project ka actual AI provider Groq hai.

## 2. Har Feature Simple Language Mein

### AI Tutor

Student `TutorPage.jsx` par topic enter karta hai. React `POST /api/tutor/explain` request Flask ko bhejta hai. `tutor_routes.py` user ka topic, difficulty aur weak concepts check karta hai. `explain.py` prompt banakar `groq_client.py` se AI explanation leta hai. Flask response React ko deta hai aur screen par explanation show hoti hai.

### Adaptive Learning

`adaptive_service.py` topic mastery dekhkar level choose karta hai:

- 50 se kam mastery: beginner
- 50 se 79.9: intermediate
- 80 ya zyada: advanced

Recent quizzes mein jis concept ki accuracy 60% se kam hoti hai, wo weak concept maana jata hai. Ye information next explanation aur quiz prompt mein use hoti hai.

### Smart Notes

Student explanation ke baad notes banane ko bolta hai. `POST /api/tutor/notes` `notes_generator.py` ko call karta hai. Generated Markdown notes `notes` table mein save hote hain. `NotesPage.jsx` se notes view, edit, download aur delete ho sakte hain.

### Quiz

Student `QuizGame.jsx` mein topic aur difficulty choose karta hai. `POST /api/quiz/generate` AI se questions banwata hai. Backend minimum 10 questions ensure karta hai. `quiz_generator.py` JSON parse aur validate karta hai, har question mein 4 alag options check karta hai, aur zarurat par extra ya synthetic questions add karta hai.

### Hangman-style Game

`HangmanGame.jsx` character aur lives ka visual dikhata hai. Quiz mein 5 lives hoti hain. Sahi answer par score aur streak badhta hai. Galat answer par ek life kam aur streak reset hoti hai. Sab lives khatam hone par game over hota hai.

### Chatbot

`ChatPage.jsx` se student doubt bhejta hai. `POST /api/chat` `chat.py` ke through Groq response leta hai. `short`, `deep` aur `example` modes available hain. Current topic aur chat history bhi request mein ja sakti hai.

### Voice

Browser ka Web Speech API available ho to frontend direct voice recognition use karta hai. Fallback mein audio `/api/voice/transcribe` par jata hai aur `voice.py` Groq Whisper se text banata hai. Speech playback ke liye browser `speechSynthesis` prefer hota hai; backend fallback `gTTS` MP3 banata hai.

### Progress

`ProgressPage.jsx` `/api/progress` se mastery, quiz history aur streak leta hai. Chart.js in values ko charts mein show karta hai. Dashboard `/api/dashboard` se stats, profile, recent sessions, recent quizzes aur recommendation leta hai.

## 3. Technology Simple Explanation

### React

React screen aur user interaction banane ke liye use hua hai. Components jaise `TutorPage.jsx`, `QuizGame.jsx` aur `NotesPage.jsx` alag UI parts handle karte hain.

**Why?** React state ke through page ko bina full reload ke update karna easy hai.

### Flask

Flask backend API banata hai. `backend/app.py` blueprints register karta hai aur routes request handle karte hain.

**Why?** Python mein simple, readable aur modular API banana easy hai.

### SQLite

SQLite ek digital notebook ki tarah hai. Ismein users, topics, notes, quizzes, answers aur progress save hoti hai.

**Why?** Project ke local/demo size ke liye setup simple hai aur alag database server ki zarurat nahi.

### Groq

Groq ko AI teacher ki tarah use kiya gaya hai. Ye explanation, diagrams, notes, quiz, chat aur feedback generate karta hai.

**Why?** Groq API se fast AI responses milte hain aur `groq_client.py` model fallback bhi handle karta hai.

### Mermaid

Mermaid text se flowchart banane ke liye use hua hai. `MermaidViewer.jsx` diagram ko screen par render karta hai.

**Why?** Student ko difficult topic ka visual flow samajhne mein help milti hai.

### Chart.js

Chart.js progress page par mastery aur accuracy charts banata hai.

**Why?** Numbers ko visual form mein samajhna student ke liye easy hota hai.

### JWT

JWT login ke baad user ki identity ka signed token hai. React token ko `localStorage` mein rakhta hai aur `api.js` har protected request mein Bearer token bhejta hai.

**Why?** Backend ko pata chalta hai ki request kis logged-in user ki hai.

## 4. Project Ka Simple Diagram

```text
Student
   |
   | Topic, login ya quiz answer deta hai
   v
React Frontend
   |
   | Axios JSON request aur JWT token bhejta hai
   v
Flask Backend
   |
   | Route request validate aur process karta hai
   +--------------------+
   |                    |
   v                    v
SQLite Database      Groq AI / Whisper
   |                    |
   | User, quiz,        | Explanation, notes,
   | answers, progress  | quiz, transcription
   +--------------------+
            |
            | Flask JSON response banata hai
            v
React Frontend
            |
            | Result screen par dikhata hai
            v
Student
```

Simple meaning:

- Student input deta hai.
- React input ko API request mein convert karta hai.
- Flask decide karta hai ki database ya Groq ko call karna hai.
- Database saved information deta hai; Groq naya AI content deta hai.
- Flask final JSON response React ko bhejta hai.
- React result student ko show karta hai.

## 5. Kya Implemented Nahi Hai?

- Actual OpenAI API call nahi hai. AI integration Groq par hai.
- Backend TTS OpenAI TTS nahi hai; `gTTS` use hota hai, aur browser speech synthesis prefer hoti hai.
- Frontend difficulty display streak/lives ke basis par badalta hai, lekin current quiz ke questions regenerate nahi hote. Final persisted evaluation backend karta hai.