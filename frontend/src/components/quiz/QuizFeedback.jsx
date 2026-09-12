// components/quiz/QuizFeedback.jsx — Immediate feedback card after answering
import React from 'react'

export default function QuizFeedback({
  isCorrect = false,
  explanation = '',
  message = '',
  correctAnswerText = '',
  scoreAdded = 100,
  streakBonus = 0,
  isLastQuestion = false,
  isGameOver = false,
  onNext = () => {},
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 mb-6 animate-slide-up ${
      isCorrect
        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
        : 'bg-rose-50/90 border-rose-300 text-rose-950'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* Title / Badge */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isCorrect ? '🎉' : '💔'}</span>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">
              {message || (isCorrect ? 'Awesome! Correct Answer!' : 'Not quite! Lost 1 Life.')}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {isCorrect ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ {isCorrect ? `+${scoreAdded} XP` : 'One life lost'} {streakBonus > 0 && `(+${streakBonus} 🔥 Streak Bonus!)`}
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                  Review the explanation and keep going.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onNext}
          className={`self-end sm:self-auto px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all active:scale-95 ${
            isGameOver
              ? 'bg-slate-900 hover:bg-slate-800 ring-2 ring-slate-400/30'
              : isCorrect
              ? 'bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-400/30'
              : 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-400/30'
          }`}
        >
          {isGameOver
            ? 'View Game Over Results →'
            : isLastQuestion
            ? 'Finish & See Results 🏆'
            : 'Next Question →'}
        </button>
      </div>

      {/* Explanation text */}
      {explanation && (
        <div className="pt-2.5 border-t border-black/10">
          {!isCorrect && correctAnswerText && <p className="text-xs sm:text-sm leading-relaxed mb-1"><strong className="font-semibold mr-1">Correct answer:</strong>{correctAnswerText}</p>}
          <p className="text-xs sm:text-sm leading-relaxed opacity-90">
            <strong className="font-semibold mr-1">Explanation:</strong>
            {explanation}
          </p>
        </div>
      )}
    </div>
  )
}
