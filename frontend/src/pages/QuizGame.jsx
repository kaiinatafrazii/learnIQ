// pages/QuizGame.jsx — Dedicated gamified 'AI Quiz Challenge' (Hangman style)
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import quizService from '../services/quizService'
import HangmanGame from '../components/quiz/HangmanGame'
import QuizProgress from '../components/quiz/QuizProgress'
import QuizLives from '../components/quiz/QuizLives'
import QuizScore from '../components/quiz/QuizScore'
import QuizQuestion from '../components/quiz/QuizQuestion'
import QuizFeedback from '../components/quiz/QuizFeedback'
import QuizResult from '../components/quiz/QuizResult'

const QUICK_TOPICS = [
  'Python Functions',
  'Binary Search Trees',
  'Photosynthesis',
  'Newton\'s Laws',
  'Calculus Derivatives',
  'Machine Learning Basics',
]

export default function QuizGame() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Game Phases: 'setup' | 'loading' | 'playing' | 'results'
  const [phase, setPhase] = useState('setup')
  const [topicInput, setTopicInput] = useState(location.state?.topic || '')
  const [difficultySetting, setDifficultySetting] = useState('beginner')

  // Active Game State
  const [quizData, setQuizData] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highestStreak, setHighestStreak] = useState(0)
  const [currentDifficulty, setCurrentDifficulty] = useState('beginner')

  // Per-Question Interaction State
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [revealedCorrectAnswer, setRevealedCorrectAnswer] = useState(null)
  const [revealedExplanation, setRevealedExplanation] = useState('')
  const [revealedIsCorrect, setRevealedIsCorrect] = useState(false)
  const [lastEvent, setLastEvent] = useState(null) // 'correct' | 'wrong' | null
  const [hintUsedThisQ, setHintUsedThisQ] = useState(false)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)

  // Answers store for final submission: [{ question_id, selected_answer, hint_used }]
  const [recordedAnswers, setRecordedAnswers] = useState([])
  const [finalResults, setFinalResults] = useState(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  // Helper to reset question interaction
  const resetQuestionState = () => {
    setSelectedOption(null)
    setIsAnswerRevealed(false)
    setRevealedCorrectAnswer(null)
    setRevealedExplanation('')
    setRevealedIsCorrect(false)
    setLastEvent(null)
    setHintUsedThisQ(false)
    setSubmittingAnswer(false)
  }

  // ── 1. Start Challenge & Generate Questions ─────────────────────────────
  const startChallenge = async (selectedTopic = topicInput) => {
    const topicToUse = (selectedTopic || topicInput).trim()
    if (!topicToUse) {
      addToast('Please enter or select a topic to begin the challenge!', 'error')
      return
    }

    setPhase('loading')
    try {
      const data = await quizService.generateQuiz({
        topic: topicToUse,
        difficulty: difficultySetting,
        question_count: 10,
      })

      if (!data.questions || data.questions.length < 10) {
        throw new Error('Received fewer than 10 questions from server.')
      }

      setQuizData(data)
      setCurrentIndex(0)
      setLives(5)
      setScore(0)
      setStreak(0)
      setHighestStreak(0)
      setCurrentDifficulty(data.difficulty || difficultySetting || 'beginner')
      setRecordedAnswers([])
      resetQuestionState()
      setPhase('playing')
    } catch (err) {
      console.error(err)
      addToast(err.response?.data?.error || 'Failed to generate quiz questions. Please retry.', 'error')
      setPhase('setup')
    }
  }

  // Start game immediately if topic passed via navigation state
  useEffect(() => {
    const initialTopic = location.state?.topic
    if (initialTopic) {
      startChallenge(initialTopic)
    }
  }, [location.state?.topic])

  // ── 2. Handle Hint Click ────────────────────────────────────────────────
  const handleUseHint = () => {
    if (!hintUsedThisQ && !isAnswerRevealed) {
      setHintUsedThisQ(true)
      // Small penalty for using a hint
      setScore((prev) => Math.max(0, prev - 10))
      addToast('💡 Hint unlocked! (-10 points)', 'warning')
    }
  }

  // ── 3. Handle Option Selection & Validation ─────────────────────────────
  const handleSelectOption = async (optionKey) => {
    if (isAnswerRevealed || submittingAnswer || !quizData) return

    const currentQ = quizData.questions[currentIndex]
    if (!currentQ) return

    setSelectedOption(optionKey)
    setSubmittingAnswer(true)

    try {
      // Immediate validation through server endpoint
      const validation = await quizService.checkAnswer({
        quiz_id: quizData.quiz_id,
        question_id: currentQ.id,
        selected_answer: optionKey,
      })

      const isCorrect = Boolean(validation.is_correct)
      setRevealedIsCorrect(isCorrect)
      setRevealedCorrectAnswer(validation.correct_answer)
      setRevealedExplanation(validation.explanation)
      setIsAnswerRevealed(true)

      // Update Lives, Score, and Streak
      if (isCorrect) {
        setLastEvent('correct')
        const newStreak = streak + 1
        setStreak(newStreak)
        setHighestStreak((prev) => Math.max(prev, newStreak))

        let bonus = 0
        if (newStreak >= 5) bonus = 75
        else if (newStreak >= 3) bonus = 40
        else if (newStreak >= 2) bonus = 20

        setScore((prev) => prev + 100 + bonus)

        // Adaptive Difficulty: Level up on 3 consecutive correct answers
        if (newStreak === 3 && currentDifficulty === 'beginner') {
          setCurrentDifficulty('intermediate')
          addToast('🔥 3 in a row! Difficulty increased to Intermediate!', 'success')
        } else if (newStreak === 6 && currentDifficulty === 'intermediate') {
          setCurrentDifficulty('advanced')
          addToast('⚡ Incredible streak! Difficulty increased to Advanced!', 'success')
        }
      } else {
        setLastEvent('wrong')
        setStreak(0)
        setLives((prev) => Math.max(0, prev - 1))

        // Adaptive Difficulty: Ease down if struggling
        if (lives <= 3 && currentDifficulty === 'advanced') {
          setCurrentDifficulty('intermediate')
        } else if (lives <= 2 && currentDifficulty === 'intermediate') {
          setCurrentDifficulty('beginner')
        }
      }

      // Record answer for final server submission
      setRecordedAnswers((prev) => [
        ...prev,
        {
          question_id: currentQ.id,
          selected_answer: optionKey,
          hint_used: hintUsedThisQ,
        },
      ])
    } catch (err) {
      console.error(err)
      addToast('Error validating answer. Please continue.', 'error')
      setIsAnswerRevealed(true)
    } finally {
      setSubmittingAnswer(false)
    }
  }

  // ── 4. Move to Next Question or Conclude Game ───────────────────────────
  const handleNextQuestion = async () => {
    if (submittingQuiz) return

    // If all lives lost (Game Over) or last question completed
    const isGameOver = lives <= 0 || (lastEvent === 'wrong' && lives === 1)
    const isLastQ = currentIndex >= (quizData?.questions?.length || 10) - 1

    if (isGameOver || isLastQ) {
      await finalizeQuiz()
    } else {
      setCurrentIndex((prev) => prev + 1)
      resetQuestionState()
    }
  }

  // ── 5. Finalize and Submit Entire Challenge ──────────────────────────────
  const finalizeQuiz = async () => {
    setSubmittingQuiz(true)
    try {
      const result = await quizService.submitQuiz({
        quiz_id: quizData.quiz_id,
        answers: recordedAnswers,
      })
      setFinalResults(result)
      setPhase('results')
    } catch (err) {
      console.error(err)
      addToast(err.response?.data?.error || 'Failed to calculate results.', 'error')
      // Fallback local results object if network drops
      setFinalResults({
        topic_name: quizData.topic_name,
        score,
        total_questions: quizData.questions.length,
        correct_answers: recordedAnswers.filter((a) => a.is_correct).length,
        wrong_answers: 5 - lives,
        accuracy: Math.round((score / (quizData.questions.length * 100)) * 100),
        highest_streak: highestStreak,
        remaining_lives: lives,
        game_over: lives <= 0,
        questions_with_answers: [],
      })
      setPhase('results')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const currentQuestion = quizData?.questions?.[currentIndex]
  const isGameOverState = lives <= 0 || (revealedIsCorrect === false && lives === 1 && isAnswerRevealed)
  const isLastQuestionState = currentIndex === (quizData?.questions?.length || 10) - 1

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 1: TOPIC SETUP SCREEN                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === 'setup' && (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white text-2xl shadow-lg mb-3">
                  🎮
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  AI Quiz Challenge
                </h1>
                <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-md mx-auto">
                  A gamified Hangman-style test. Keep your character safe by answering questions correctly!
                </p>
              </div>

              {/* Topic Card */}
              <div className="card shadow-lg border border-slate-100 bg-white p-6 sm:p-8 mb-6">
                <label htmlFor="quiz-topic-input" className="label text-base font-bold text-slate-800 mb-2">
                  What topic do you want to challenge?
                </label>
                <div className="relative mb-5">
                  <input
                    id="quiz-topic-input"
                    type="text"
                    placeholder="e.g. Python Functions, Photosynthesis, Binary Trees..."
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startChallenge()}
                    className="input-field text-base py-3.5 pr-10 shadow-sm"
                  />
                  {topicInput && (
                    <button
                      type="button"
                      onClick={() => setTopicInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Difficulty Selector */}
                <div className="mb-6">
                  <span className="label text-xs font-semibold text-slate-500 mb-2">
                    Starting Difficulty:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'beginner', label: 'Beginner', icon: '🌱' },
                      { id: 'intermediate', label: 'Intermediate', icon: '⚡' },
                      { id: 'advanced', label: 'Advanced', icon: '🔥' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDifficultySetting(d.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                          difficultySetting === d.id
                            ? 'bg-primary-50 text-primary-700 border-primary-400 shadow-sm ring-2 ring-primary-300/30'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{d.icon}</span>
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  type="button"
                  onClick={() => startChallenge()}
                  disabled={!topicInput.trim()}
                  className="btn-primary w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  🚀 Start 10-Question Challenge
                </button>

                {/* Quick Topics */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Popular Topics:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTopicInput(t)
                          startChallenge(t)
                        }}
                        className="badge badge-primary cursor-pointer hover:bg-primary-200 text-xs py-1.5 px-3 transition-all"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Rules Mini-Banner */}
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4 text-xs sm:text-sm text-indigo-900 flex items-start gap-3">
                <span className="text-xl shrink-0">🎯</span>
                <div className="space-y-1">
                  <strong className="font-bold block">How to Play:</strong>
                  <p>• You have <strong>5 Lives (❤️)</strong>. Each wrong answer removes 1 life and moves your character closer to danger.</p>
                  <p>• Earn <strong>+100 points</strong> per correct answer, plus huge bonuses for <strong>streaks (🔥)</strong>.</p>
                  <p>• Need assistance? Click <strong>Hint</strong> for a conceptual clue (-10 points).</p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 2: LOADING SCREEN                                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === 'loading' && (
            <div className="card text-center py-16 px-4 max-w-md mx-auto animate-fade-in shadow-lg border-0 bg-white">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-md animate-bounce">
                🤖
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                Generating 10-Question Quiz...
              </h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Our AI Tutor is crafting 10 tailored multiple-choice questions for <strong className="text-slate-800">'{topicInput}'</strong> with hints and explanations.
              </p>
              <div className="w-48 h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-primary-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 3: ACTIVE GAMEPLAY                                       */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === 'playing' && quizData && currentQuestion && (
            <div className="animate-fade-in">
              {/* Progress & Difficulty Header */}
              <QuizProgress
                currentIndex={currentIndex}
                totalQuestions={quizData.questions.length}
                topicName={quizData.topic_name}
                difficulty={currentDifficulty}
              />

              {/* Stats Bar (Lives, Score, Streak) */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <QuizLives lives={lives} maxLives={5} />
                <QuizScore score={score} streak={streak} />
              </div>

              {/* Hangman Game Graphic */}
              <HangmanGame
                lives={lives}
                maxLives={5}
                lastResult={lastEvent}
              />

              {/* Question Card with Options & Hint */}
              <QuizQuestion
                question={currentQuestion}
                selectedOption={selectedOption}
                isRevealed={isAnswerRevealed}
                correctAnswer={revealedCorrectAnswer}
                hintUsed={hintUsedThisQ}
                onSelectOption={handleSelectOption}
                onUseHint={handleUseHint}
                disabled={submittingAnswer || isAnswerRevealed}
              />

              {/* Immediate Feedback Card after answering */}
              {isAnswerRevealed && (
                <QuizFeedback
                  isCorrect={revealedIsCorrect}
                  explanation={revealedExplanation}
                  scoreAdded={100}
                  streakBonus={streak >= 5 ? 75 : streak >= 3 ? 40 : streak >= 2 ? 20 : 0}
                  isLastQuestion={isLastQuestionState}
                  isGameOver={isGameOverState}
                  onNext={handleNextQuestion}
                />
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE 4: RESULTS & MISTAKE REVIEW                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === 'results' && finalResults && (
            <QuizResult
              results={finalResults}
              onTryAgain={() => {
                setFinalResults(null)
                startChallenge(quizData?.topic_name || topicInput)
              }}
              onContinueLearning={() => {
                navigate('/tutor', { state: { topic: finalResults.topic_name } })
              }}
            />
          )}

          {/* Submitting Final Challenge Results Overlay */}
          {submittingQuiz && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="card max-w-sm w-full text-center p-6 bg-white shadow-2xl animate-fade-in border-0">
                <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="font-extrabold text-slate-900 text-lg mb-1">Tallying Final Score...</h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Analyzing mistakes, streak bonuses, and updating your mastery profile.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
