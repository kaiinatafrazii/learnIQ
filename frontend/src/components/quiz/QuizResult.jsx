// components/quiz/QuizResult.jsx — Game Over / Quiz Complete summary with Mistake Review
import React, { useState } from 'react'

const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' }

export default function QuizResult({
  results,
  onTryAgain = () => {},
  onContinueLearning = () => {},
}) {
  const [filterView, setFilterView] = useState('all') // 'all' | 'mistakes'

  if (!results) return null

  const isGameOver = Boolean(results.game_over || results.remaining_lives === 0)
  const score = results.score || 0
  const total = results.total_questions || 10
  const correct = results.correct_answers || 0
  const wrong = results.wrong_answers || 0
  const accuracy = results.accuracy ?? 0
  const bestStreak = results.highest_streak || 0
  const performance = results.performance_level || (accuracy >= 85 ? 'Advanced' : accuracy >= 60 ? 'Intermediate' : 'Beginner / Needs Revision')

  const questionsWithAnswers = results.questions_with_answers || []
  const incorrectQuestions = questionsWithAnswers.filter(q => !q.is_correct)

  const displayedQuestions = filterView === 'mistakes' ? incorrectQuestions : questionsWithAnswers

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* ── Main Hero Card ─────────────────────────────────────────── */}
      <div className={`card overflow-hidden text-white mb-6 p-6 sm:p-8 text-center relative ${
        isGameOver
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 border-rose-900'
          : accuracy >= 80
          ? 'bg-gradient-to-br from-indigo-600 via-primary-600 to-emerald-600'
          : 'bg-gradient-to-br from-indigo-700 via-primary-700 to-slate-800'
      }`}>
        <div className="text-4xl sm:text-5xl mb-3">
          {isGameOver ? '💀' : accuracy >= 80 ? '🏆' : '🎯'}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
          {isGameOver ? 'Game Over — Challenge Ended!' : 'AI Quiz Challenge Complete!'}
        </h1>
        <p className="text-sm sm:text-base opacity-80 mb-6">
          Topic: <span className="font-semibold">{results.topic_name}</span>
        </p>

        {/* Big Score Display */}
        <div className="inline-flex items-baseline gap-1 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 mb-6">
          <span className="text-4xl sm:text-5xl font-black text-white">{score}</span>
          <span className="text-lg sm:text-xl text-white/70 font-semibold">pts</span>
        </div>

        {/* 4 Stats Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-left">
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-white/70 block">Accuracy</span>
            <span className="text-xl font-bold text-white">{accuracy}%</span>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-white/70 block">Correct / Total</span>
            <span className="text-xl font-bold text-emerald-300">{correct} / {total}</span>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-white/70 block">Best Streak</span>
            <span className="text-xl font-bold text-amber-300">{bestStreak} 🔥</span>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <span className="text-[11px] font-semibold text-white/70 block">Mastery Rating</span>
            <span className="text-xs sm:text-sm font-bold text-white block mt-1 truncate">{performance}</span>
          </div>
        </div>
      </div>

      {/* ── Strong Areas & Needs Improvement ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Strong Areas */}
        <div className="card border border-emerald-100 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-emerald-600 font-bold text-lg">✓</span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Strong Areas</h3>
          </div>
          {results.strong_concepts && results.strong_concepts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {results.strong_concepts.map((concept) => (
                <span
                  key={concept}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  ✓ {concept.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Keep practicing to build your strong concepts!</p>
          )}
        </div>

        {/* Needs Improvement */}
        <div className="card border border-rose-100 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-rose-500 font-bold text-lg">⚠</span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Needs Improvement</h3>
          </div>
          {results.weak_concepts && results.weak_concepts.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {results.weak_concepts.map((concept) => (
                <span
                  key={concept}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200"
                >
                  ⚠ {concept.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-semibold">Clean sheet! No major weak areas identified.</p>
          )}
        </div>
      </div>

      {/* ── Recommended Next Step Card ─────────────────────────────── */}
      <div className="card bg-gradient-to-r from-primary-50 via-indigo-50 to-white border border-primary-100 mb-6 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🚀</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
              Recommended Next Step
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {results.recommended_next_step || 'Review your mistake explanations below and take another quiz to cement your mastery.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Improvement Suggestions (if returned) ───────────────── */}
      {results.improvement_suggestions && (
        <div className="card border border-slate-200 bg-white mb-6 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">AI Tutor Feedback</h4>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {results.improvement_suggestions}
          </p>
        </div>
      )}

      {/* ── Action Buttons ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('mistake-review-section')
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }}
          className="btn-secondary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <span>📋</span>
          <span>Review Mistakes ({wrong})</span>
        </button>

        <button
          type="button"
          onClick={onTryAgain}
          className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <span>🔄</span>
          <span>Try Again</span>
        </button>

        <button
          type="button"
          onClick={onContinueLearning}
          className="btn-secondary py-3 px-5 text-sm font-bold flex items-center justify-center gap-1.5"
        >
          <span>📚</span>
          <span className="hidden sm:inline">Continue Learning</span>
        </button>
      </div>

      {/* ── Mistake & Question Review Section ──────────────────────── */}
      <div id="mistake-review-section" className="card border border-slate-200 bg-white mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              Question & Mistake Review
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Carefully study explanations to avoid repeating mistakes.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterView('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterView === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Questions ({questionsWithAnswers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterView('mistakes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterView === 'mistakes'
                  ? 'bg-white text-rose-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mistakes Only ({incorrectQuestions.length})
            </button>
          </div>
        </div>

        {/* Questions List */}
        {displayedQuestions.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="font-bold text-slate-800 text-sm">No mistakes to review!</p>
            <p className="text-xs text-slate-400 mt-1">You answered all questions correctly in this view.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedQuestions.map((q, idx) => {
              const isCorrect = q.is_correct
              const userOptKey = q.selected_answer?.toLowerCase()
              const correctOptKey = q.correct_answer?.toLowerCase()

              return (
                <div
                  key={q.question_id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  {/* Top line with indicator and concept tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}>
                        {isCorrect ? '✓' : '✕'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Question {idx + 1}
                      </span>
                    </div>
                    {q.concept_tag && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        #{q.concept_tag}
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="font-bold text-slate-900 text-sm sm:text-base mb-3 leading-snug">
                    {q.question}
                  </p>

                  {/* Answers Comparison */}
                  <div className="space-y-1.5 text-xs sm:text-sm mb-3">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-500 w-28 shrink-0">Your Answer:</span>
                      <span className={`font-semibold ${isCorrect ? 'text-emerald-800' : 'text-rose-700'}`}>
                        {userOptKey ? `${OPTION_LABELS[userOptKey] || userOptKey}. ${q[`option_${userOptKey}`] || userOptKey}` : 'Unanswered'}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-emerald-700 w-28 shrink-0">Correct Answer:</span>
                        <span className="font-bold text-emerald-800">
                          {correctOptKey ? `${OPTION_LABELS[correctOptKey] || correctOptKey}. ${q[`option_${correctOptKey}`] || correctOptKey}` : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong className="font-semibold text-slate-900 block mb-0.5">Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
