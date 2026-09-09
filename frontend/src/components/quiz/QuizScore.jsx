// components/quiz/QuizScore.jsx — Live Score & Streak display
import React from 'react'

export default function QuizScore({ score = 0, streak = 0 }) {
  const getStreakBonus = () => {
    if (streak >= 5) return '+75 Bonus!'
    if (streak >= 3) return '+40 Bonus!'
    if (streak >= 2) return '+20 Bonus!'
    return null
  }

  const bonusText = getStreakBonus()

  return (
    <div className="flex items-center gap-3">
      {/* Score */}
      <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Score:</span>
        <span className="text-sm font-extrabold text-primary-600 tracking-tight">
          {score}
        </span>
      </div>

      {/* Streak */}
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
        streak >= 3
          ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
          : streak > 0
          ? 'bg-slate-50 border-slate-200 text-slate-700'
          : 'bg-white border-slate-200 text-slate-400 opacity-80'
      }`}>
        <span className={`text-base ${streak >= 3 ? 'animate-bounce' : ''}`}>🔥</span>
        <span className="text-xs font-bold">
          {streak}
        </span>
        {bonusText && (
          <span className="hidden sm:inline text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-900 ml-0.5">
            {bonusText}
          </span>
        )}
      </div>
    </div>
  )
}
