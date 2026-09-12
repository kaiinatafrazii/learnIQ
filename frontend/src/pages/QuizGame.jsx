// pages/QuizGame.jsx — Adaptive quiz shell with varied, seeded game sessions
import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import quizService from '../services/quizService'
import QuizLives from '../components/quiz/QuizLives'
import QuizScore from '../components/quiz/QuizScore'
import QuizQuestion from '../components/quiz/QuizQuestion'
import QuizFeedback from '../components/quiz/QuizFeedback'
import QuizResult from '../components/quiz/QuizResult'
import { createSessionConfiguration, getFeedbackMessage, prepareSessionQuestions } from '../utils/gameSession'

const QUICK_TOPICS = ['Python Functions', 'Binary Search Trees', 'Photosynthesis', "Newton's Laws", 'Calculus Derivatives', 'Machine Learning Basics']
const DIFFICULTIES = [['beginner', 'Beginner', '🌱'], ['intermediate', 'Intermediate', '⚡'], ['advanced', 'Advanced', '🔥']]

export default function QuizGame() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState('setup')
  const [topicInput, setTopicInput] = useState(location.state?.topic || '')
  const [difficultySetting, setDifficultySetting] = useState('beginner')
  const [quizData, setQuizData] = useState(null)
  const [session, setSession] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [currentDifficulty, setCurrentDifficulty] = useState('beginner')
  const [timeLeft, setTimeLeft] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [revealedCorrectAnswer, setRevealedCorrectAnswer] = useState(null)
  const [revealedExplanation, setRevealedExplanation] = useState('')
  const [revealedIsCorrect, setRevealedIsCorrect] = useState(false)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [answers, setAnswers] = useState([])
  const [finalResults, setFinalResults] = useState(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  const question = quizData?.questions?.[currentIndex]
  const mode = session?.gameType?.id
  const isTimed = mode === 'time' || session?.event?.id === 'speed'
  const eventQuestion = session ? 2 + (session.seed % 6) : -1
  const eventActive = currentIndex === eventQuestion
  const isGameOver = lives <= 0
  const isLastQuestion = currentIndex === (quizData?.questions?.length || 10) - 1
  const bossHealth = Math.max(0, 100 - ((currentIndex + (revealedIsCorrect ? 1 : 0)) * 10))

  const resetQuestion = () => {
    setSelectedOption(null)
    setRevealedCorrectAnswer(null)
    setRevealedExplanation('')
    setRevealedIsCorrect(false)
    setIsAnswerRevealed(false)
    setHintUsed(false)
    setSubmittingAnswer(false)
  }

  const startChallenge = async (selectedTopic = topicInput) => {
    const topic = (selectedTopic || topicInput).trim()
    if (!topic) {
      addToast('Choose a topic before starting your challenge.', 'error')
      return
    }
    setPhase('loading')
    try {
      const data = await quizService.generateQuiz({ topic, difficulty: difficultySetting, question_count: 10 })
      if (!Array.isArray(data.questions) || data.questions.length < 10) throw new Error('The server returned fewer than 10 valid questions.')
      const nextSession = createSessionConfiguration(topic, difficultySetting)
      setQuizData({ ...data, questions: prepareSessionQuestions(data.questions.slice(0, 10), nextSession.seed) })
      setSession(nextSession)
      setCurrentIndex(0)
      setLives(nextSession.lives)
      setScore(0)
      setStreak(0)
      setBestStreak(0)
      setCurrentDifficulty(difficultySetting)
      setAnswers([])
      resetQuestion()
      setPhase('reveal')
    } catch (error) {
      console.error(error)
      addToast(error.response?.data?.error || error.message || 'Could not prepare the challenge. Please retry.', 'error')
      setPhase('setup')
    }
  }

  useEffect(() => {
    if (location.state?.topic) startChallenge(location.state.topic)
  }, [location.state?.topic])

  useEffect(() => {
    if (!isTimed || phase !== 'playing' || isAnswerRevealed || !question) return undefined
    const roundTimer = Math.max(10, session.timer - (session.variant.id === 'pressure' ? currentIndex : 0))
    setTimeLeft(eventActive && session.event.id === 'speed' ? 10 : roundTimer)
    const interval = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval)
          handleSelectOption('')
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => window.clearInterval(interval)
  }, [currentIndex, phase, isTimed, isAnswerRevealed, question?.id])

  const useHint = () => {
    if (hintUsed || isAnswerRevealed) return
    setHintUsed(true)
    if (!(eventActive && session.event.id === 'hint')) setScore((previous) => Math.max(0, previous - 10))
    addToast(eventActive && session.event.id === 'hint' ? '💡 Free hint unlocked.' : '💡 Hint unlocked. -10 XP.', 'warning')
  }

  async function handleSelectOption(optionKey) {
    if (isAnswerRevealed || submittingAnswer || !question) return
    setSelectedOption(optionKey)
    setSubmittingAnswer(true)
    try {
      const validation = await quizService.checkAnswer({ quiz_id: quizData.quiz_id, question_id: question.id, selected_answer: optionKey })
      const isCorrect = Boolean(validation.is_correct)
      setRevealedIsCorrect(isCorrect)
      setRevealedCorrectAnswer(validation.correct_answer)
      setRevealedExplanation(validation.explanation)
      setIsAnswerRevealed(true)
      if (isCorrect) {
        const nextStreak = streak + 1
        const streakBonus = nextStreak >= 5 ? 100 : nextStreak >= 3 ? 50 : 0
        const speedBonus = isTimed && timeLeft > 0 && timeLeft <= session.timer * 0.4 ? 25 : 0
        const multiplier = eventActive && session.event.id === 'double' ? 2 : 1
        setStreak(nextStreak)
        setBestStreak((previous) => Math.max(previous, nextStreak))
        setScore((previous) => previous + ((100 + streakBonus + speedBonus) * multiplier))
        if (eventActive && session.event.id === 'recovery') setLives((previous) => Math.min(session.lives, previous + 1))
        if (nextStreak >= 3 && currentDifficulty === 'beginner') setCurrentDifficulty('intermediate')
        if (nextStreak >= 5 && currentDifficulty === 'intermediate') setCurrentDifficulty('advanced')
      } else {
        const shielded = (session.bonus.id === 'shield' || session.event.id === 'shield') && eventActive
        setStreak((previous) => shielded ? previous : 0)
        setLives((previous) => Math.max(0, previous - 1))
        if (currentDifficulty === 'advanced') setCurrentDifficulty('intermediate')
        else if (currentDifficulty === 'intermediate') setCurrentDifficulty('beginner')
      }
      setAnswers((previous) => [...previous, { question_id: question.id, selected_answer: optionKey, hint_used: hintUsed }])
    } catch (error) {
      console.error(error)
      addToast('Answer validation failed. Please try the question again.', 'error')
    } finally {
      setSubmittingAnswer(false)
    }
  }

  const finalizeQuiz = async () => {
    setSubmittingQuiz(true)
    try {
      const result = await quizService.submitQuiz({ quiz_id: quizData.quiz_id, answers })
      setFinalResults({ ...result, game_mode: `${session.gameType.label} · ${session.variant.label}`, game_variant: session.variant.label, visual_theme: session.theme.label, result_title: session.resultTitle, reward_style: session.gameType.reward, time_taken: 'Tracked in challenge' })
      setPhase('results')
    } catch (error) {
      console.error(error)
      addToast(error.response?.data?.error || 'Could not calculate results.', 'error')
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const nextQuestion = () => {
    if (submittingQuiz) return
    if (isGameOver || isLastQuestion) return finalizeQuiz()
    setCurrentIndex((previous) => previous + 1)
    resetQuestion()
  }

  const renderModePanel = () => {
    if (mode === 'boss') return <div className="mt-4"><div className="flex justify-between text-xs text-white/70"><span>Boss integrity</span><span>{bossHealth}%</span></div><div className="h-2 bg-rose-950/60 rounded-full overflow-hidden mt-1"><div className="h-full bg-rose-400 transition-all" style={{ width: `${bossHealth}%` }} /></div><p className="text-xs text-rose-200 mt-2">{session.variant.description}</p></div>
    if (mode === 'treasure') return <p className="text-xs text-amber-200 mt-4">🗺 Path: {'▰'.repeat(currentIndex + 1)}{'▱'.repeat(Math.max(0, 10 - currentIndex - 1))} → treasure vault</p>
    if (mode === 'mystery') return <p className="text-xs text-violet-200 mt-4">🔎 Evidence collected: {currentIndex} / 10 clues</p>
    if (mode === 'survival') return <p className="text-xs text-emerald-200 mt-4">🛡 Survival pressure: {currentDifficulty} · {session.variant.description}</p>
    return <p className="text-xs text-white/60 mt-4">{session.variant.description}</p>
  }

  return <div className="flex min-h-screen bg-slate-50"><Sidebar /><main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0"><div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    {phase === 'setup' && <div className="animate-fade-in"><div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-9 mb-6"><span className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold">Adaptive play lab</span><h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-3">Every quiz, a new challenge.</h1><p className="text-slate-300 mt-3 max-w-xl">Your mode, variant, visual theme, question style, reward, and event are composed before play begins.</p></div><div className="card shadow-lg border border-slate-100 bg-white p-6 sm:p-8"><label htmlFor="quiz-topic-input" className="label text-base font-bold text-slate-800">What are you learning today?</label><input id="quiz-topic-input" type="text" placeholder="e.g. Python Functions, Photosynthesis..." value={topicInput} onChange={(event) => setTopicInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && startChallenge()} className="input-field text-base py-3.5 mb-5" /><span className="label text-xs font-semibold text-slate-500">Starting difficulty</span><div className="grid grid-cols-3 gap-2 mb-6">{DIFFICULTIES.map(([id, label, icon]) => <button key={id} type="button" onClick={() => setDifficultySetting(id)} className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold ${difficultySetting === id ? 'bg-primary-50 text-primary-700 border-primary-400 ring-2 ring-primary-300/30' : 'bg-white text-slate-600 border-slate-200'}`}>{icon} {label}</button>)}</div><button type="button" onClick={() => startChallenge()} disabled={!topicInput.trim()} className="btn-primary w-full py-3.5 text-base font-bold">🎮 Start New Challenge</button><div className="mt-7 pt-6 border-t border-slate-100"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick topics</p><div className="flex flex-wrap gap-2">{QUICK_TOPICS.map((topicName) => <button key={topicName} type="button" onClick={() => { setTopicInput(topicName); startChallenge(topicName) }} className="badge badge-primary cursor-pointer text-xs py-1.5 px-3">{topicName}</button>)}</div></div></div></div>}
    {phase === 'loading' && <div className="card text-center py-16 max-w-md mx-auto"><div className="text-5xl mb-5 animate-pulse">✦</div><h2 className="text-xl font-extrabold text-slate-900 mb-2">Preparing your challenge...</h2><p className="text-sm text-slate-500">Generating questions and composing a fresh game session.</p></div>}
    {phase === 'reveal' && session && <div className={`rounded-3xl bg-gradient-to-br ${session.theme.className} text-white p-6 sm:p-10 max-w-2xl mx-auto animate-fade-in shadow-xl`}><span className="text-xs uppercase tracking-[0.25em] text-white/60">New session ready</span><h1 className="text-3xl sm:text-4xl font-black mt-3">Preparing your challenge...</h1><div className="grid sm:grid-cols-2 gap-3 mt-8"><div className="bg-white/10 border border-white/10 rounded-2xl p-4"><span className="text-xs text-white/60">🎮 Game Mode</span><strong className="block text-lg mt-1">{session.gameType.icon} {session.gameType.label}</strong><span className="text-xs text-white/70">{session.variant.label}</span></div><div className="bg-white/10 border border-white/10 rounded-2xl p-4"><span className="text-xs text-white/60">🌎 Visual Theme</span><strong className="block text-lg mt-1">{session.theme.label}</strong><span className="text-xs text-white/70">{session.questionStyle.label} presentation</span></div><div className="bg-white/10 border border-white/10 rounded-2xl p-4"><span className="text-xs text-white/60">🎯 Challenge</span><strong className="block text-lg mt-1">{session.bonus.label}</strong><span className="text-xs text-white/70">{session.event.icon} {session.event.label}</span></div><div className="bg-white/10 border border-white/10 rounded-2xl p-4"><span className="text-xs text-white/60">♥ Lives · Reward</span><strong className="block text-lg mt-1">{'♥'.repeat(session.lives)}</strong><span className="text-xs text-white/70">10 questions · {session.gameType.reward}</span></div></div><button type="button" onClick={() => setPhase('playing')} className="mt-8 w-full bg-white text-slate-950 rounded-xl py-3 font-black hover:bg-cyan-50">Enter Challenge →</button></div>}
    {phase === 'playing' && quizData && question && session && <div className="animate-fade-in"><div className={`rounded-3xl bg-gradient-to-br ${session.theme.className} text-white p-5 sm:p-7 mb-5 shadow-xl`}><div className="flex flex-wrap items-start justify-between gap-4"><div><span className="text-xs uppercase tracking-[0.2em] text-white/60">{session.gameType.icon} {session.gameType.label} · {session.variant.label}</span><h1 className="text-xl sm:text-2xl font-black mt-2">{session.progressionLabel} {currentIndex + 1} / 10</h1><p className="text-sm text-white/70 mt-1">{session.questionStyle.prefix}: {session.topic}</p></div>{isTimed && <div className={`text-center rounded-2xl px-4 py-2 border ${timeLeft <= 7 ? 'border-rose-300 bg-rose-500/30 animate-pulse' : 'border-white/20 bg-white/10'}`}><span className="block text-xs text-white/60">TIME</span><strong className="text-2xl">{timeLeft}s</strong></div>}</div><div className="grid grid-cols-3 gap-2 mt-6"><div><span className="text-xs text-white/60">{session.gameType.reward}</span><strong className="block text-lg">{score}</strong></div><div><span className="text-xs text-white/60">Streak</span><strong className="block text-lg">{streak} 🔥</strong></div><div><span className="text-xs text-white/60">Difficulty</span><strong className="block text-lg capitalize">{currentDifficulty}</strong></div></div><div className="h-2 bg-white/15 rounded-full overflow-hidden mt-5"><div className="h-full bg-cyan-300 transition-all" style={{ width: `${((currentIndex + 1) / 10) * 100}%` }} /></div>{renderModePanel()}{eventActive && <p className="text-xs text-amber-200 mt-3">{session.event.icon} Event active: {session.event.label}</p>}</div><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><QuizLives lives={lives} maxLives={session.lives} /><QuizScore score={score} streak={streak} /><span className="badge badge-primary">Best streak: {bestStreak}</span></div><QuizQuestion question={question} presentation={session.questionStyle.id} selectedOption={selectedOption} isRevealed={isAnswerRevealed} correctAnswer={revealedCorrectAnswer} hintUsed={hintUsed} onSelectOption={handleSelectOption} onUseHint={useHint} disabled={submittingAnswer || isAnswerRevealed} freeHint={eventActive && session.event.id === 'hint'} />{isAnswerRevealed && <QuizFeedback isCorrect={revealedIsCorrect} message={getFeedbackMessage(revealedIsCorrect, session.seed, currentIndex)} correctAnswerText={question[`option_${revealedCorrectAnswer}`]} explanation={revealedExplanation} scoreAdded={revealedIsCorrect ? 100 : 0} streakBonus={streak >= 5 ? 100 : streak >= 3 ? 50 : 0} isLastQuestion={isLastQuestion} isGameOver={isGameOver} onNext={nextQuestion} />}</div>}
    {phase === 'results' && finalResults && <QuizResult results={finalResults} onTryAgain={() => { setFinalResults(null); startChallenge(quizData?.topic_name || topicInput) }} onContinueLearning={() => navigate('/tutor', { state: { topic: finalResults.topic_name } })} />}
    {submittingQuiz && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="card max-w-sm w-full text-center p-6 bg-white shadow-2xl"><div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" /><h3 className="font-extrabold text-slate-900 text-lg">Tallying your challenge...</h3></div></div>}
  </div></main></div>
}