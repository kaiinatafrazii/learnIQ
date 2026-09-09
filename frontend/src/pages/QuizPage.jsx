// pages/QuizPage.jsx — AI-generated MCQ quiz

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import { capitalize, difficultyClasses } from '../utils/formatters'
import api from '../services/api'

const OPTION_KEYS = ['a', 'b', 'c', 'd']
const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' }

export default function QuizPage() {
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [topic,      setTopic]      = useState('')
  const [quiz,       setQuiz]       = useState(null)
  const [answers,    setAnswers]    = useState({})  // {question_id: selected}
  const [results,    setResults]    = useState(null)
  const [step,       setStep]       = useState('input') // input | quiz | results
  const [qIndex,     setQIndex]     = useState(0)
  const [loading,    setLoading]    = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const generateQuiz = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/api/quiz/generate', { topic, num_questions: 5 })
      setQuiz(res.data)
      setAnswers({})
      setQIndex(0)
      setStep('quiz')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not generate quiz. Retry?', 'error')
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (questionId, option) => {
    setAnswers(a => ({ ...a, [questionId]: option }))
  }

  const submitQuiz = async () => {
    const answersArr = quiz.questions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] || 'a',
    }))
    setSubmitting(true)
    try {
      const res = await api.post('/api/quiz/submit', {
        quiz_id: quiz.quiz_id,
        answers: answersArr,
      })
      setResults(res.data)
      setStep('results')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not submit quiz.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const currentQ = quiz?.questions?.[qIndex]

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Step 1: Topic input ─────────────────────────────────────── */}
          {step === 'input' && (
            <div className="animate-fade-in">
              <h1 className="section-title mb-1">✏️ Take a Quiz</h1>
              <p className="section-subtitle mb-8">Enter a topic and get an AI-generated adaptive quiz.</p>

              <div className="card">
                <h2 className="font-bold text-slate-800 mb-4">What topic do you want to be quizzed on?</h2>
                <input
                  type="text"
                  placeholder="e.g. Convolutional Neural Networks"
                  className="input-field mb-4"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && generateQuiz()}
                />
                <button
                  onClick={generateQuiz}
                  disabled={loading || !topic.trim()}
                  className="btn-primary w-full py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Generating quiz…
                    </span>
                  ) : '🚀 Generate Quiz'}
                </button>

                {/* Suggestions */}
                <div className="mt-6">
                  <p className="text-xs text-slate-400 mb-2">Quick picks:</p>
                  <div className="flex flex-wrap gap-2">
                    {['CNN', 'Backpropagation', 'Big-O', 'Overfitting', 'Python Basics'].map(t => (
                      <button key={t} onClick={() => { setTopic(t); }} className="badge badge-primary cursor-pointer hover:bg-primary-200 transition-colors">{t}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Quiz Questions ──────────────────────────────────── */}
          {step === 'quiz' && currentQ && (
            <div className="animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="section-title">{quiz.topic_name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${difficultyClasses(quiz.difficulty)}`}>{capitalize(quiz.difficulty)}</span>
                    <span className="text-slate-400 text-xs">Question {qIndex + 1} of {quiz.questions.length}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 mb-1">Progress</div>
                  <div className="w-24 h-1.5 bg-slate-200 rounded-full">
                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${((qIndex + 1) / quiz.questions.length) * 100}%` }} />
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="card mb-4">
                <p className="font-semibold text-slate-900 text-base mb-6">{currentQ.question}</p>
                <div className="space-y-2">
                  {OPTION_KEYS.map(key => {
                    const optText = currentQ[`option_${key}`]
                    const selected = answers[currentQ.id] === key
                    return (
                      <button
                        key={key}
                        onClick={() => selectAnswer(currentQ.id, key)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 ${
                          selected
                            ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <span className={`font-bold mr-2 ${selected ? 'text-white' : 'text-primary-500'}`}>{OPTION_LABELS[key]}.</span>
                        {optText}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setQIndex(i => Math.max(0, i - 1))}
                  disabled={qIndex === 0}
                  className="btn-ghost border border-slate-200 disabled:opacity-30"
                >
                  ← Previous
                </button>

                {qIndex < quiz.questions.length - 1 ? (
                  <button
                    onClick={() => setQIndex(i => i + 1)}
                    disabled={!answers[currentQ.id]}
                    className="btn-primary disabled:opacity-50"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={submitQuiz}
                    disabled={submitting || Object.keys(answers).length < quiz.questions.length}
                    className="btn-primary bg-secondary-500 hover:bg-secondary-600"
                  >
                    {submitting ? '…' : 'Submit Quiz ✓'}
                  </button>
                )}
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">{Object.keys(answers).length}/{quiz.questions.length} answered</p>
            </div>
          )}

          {/* ── Step 3: Results ─────────────────────────────────────────── */}
          {step === 'results' && results && (
            <div className="animate-slide-up">
              {/* Score Header */}
              <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white mb-6 text-center">
                <div className="text-6xl font-extrabold mb-2">{results.score}<span className="text-3xl text-primary-300">/{results.total}</span></div>
                <div className="text-primary-200 text-sm mb-2">Quiz Complete — {results.topic_name}</div>
                <div className={`badge text-base px-4 py-2 ${results.accuracy >= 80 ? 'bg-secondary-400 text-white' : results.accuracy >= 60 ? 'bg-accent-400 text-white' : 'bg-danger-400 text-white'}`}>
                  {results.accuracy}% Accuracy
                </div>
              </div>

              {/* Strong / Weak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="card">
                  <h3 className="font-bold text-secondary-700 mb-3">✅ Strong Areas</h3>
                  {results.strong_areas.length ? (
                    <div className="flex flex-wrap gap-2">{results.strong_areas.map(a => <span key={a} className="badge badge-success">{a}</span>)}</div>
                  ) : <p className="text-slate-400 text-sm">None identified</p>}
                </div>
                <div className="card">
                  <h3 className="font-bold text-danger-700 mb-3">⚠️ Weak Areas</h3>
                  {results.weak_areas.length ? (
                    <div className="flex flex-wrap gap-2">{results.weak_areas.map(a => <span key={a} className="badge badge-danger">{a}</span>)}</div>
                  ) : <p className="text-slate-400 text-sm">None identified</p>}
                </div>
              </div>

              {/* AI Feedback */}
              {results.feedback && (
                <div className="card border-l-4 border-primary-400 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🤖</span>
                    <p className="font-bold text-slate-800">AI Feedback</p>
                  </div>
                  <div className="ai-content text-sm text-slate-700">
                    {results.feedback.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} className="block mt-2">{line.slice(2,-2)}</strong>
                      if (line.startsWith('- ')) return <li key={i}>{line.slice(2)}</li>
                      if (line.trim()) return <p key={i}>{line}</p>
                      return null
                    })}
                  </div>
                </div>
              )}

              {/* Question review */}
              <div className="card mb-6">
                <h3 className="font-bold text-slate-800 mb-4">Question Review</h3>
                <div className="space-y-4">
                  {results.questions_with_answers.map((q, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${q.is_correct ? 'border-secondary-200 bg-secondary-50' : 'border-danger-200 bg-danger-50'}`}>
                      <div className="flex items-start gap-2 mb-2">
                        <span>{q.is_correct ? '✅' : '❌'}</span>
                        <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                      </div>
                      <p className="text-xs text-slate-600 ml-6">
                        Your answer: <strong>{OPTION_LABELS[q.selected_answer]}. {q[`option_${q.selected_answer}`]}</strong>
                      </p>
                      {!q.is_correct && (
                        <p className="text-xs text-secondary-700 ml-6 mt-1">
                          Correct: <strong>{OPTION_LABELS[q.correct_answer]}. {q[`option_${q.correct_answer}`]}</strong>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 ml-6 mt-2 italic">{q.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => { setStep('input'); setQuiz(null); setResults(null) }} className="btn-secondary flex-1">Try Another Quiz</button>
                <button onClick={() => navigate('/tutor', { state: { topic: results.topic_name } })} className="btn-primary flex-1">Revise Topic →</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
