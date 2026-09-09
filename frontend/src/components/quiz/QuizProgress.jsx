// components/quiz/QuizProgress.jsx — Top bar with Progress, Question count, Topic, and Difficulty
import React from 'react'

export default function QuizProgress({
  currentIndex = 0,
  totalQuestions = 10,
  topicName = '',
  difficulty = 'beginner',
}) {
  const currentNum = Math.min(currentIndex + 1, totalQuestions)
  const percent = Math.round((currentNum / Math.max(1, totalQuestions)) * 100)

  const diffStyles = {
    beginner: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    school: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    intermediate: 'bg-blue-100 text-blue-700 border-blue-200',
    undergraduate: 'bg-blue-100 text-blue-700 border-blue-200',
    diploma: 'bg-blue-100 text-blue-700 border-blue-200',
    advanced: 'bg-purple-100 text-purple-700 border-purple-200',
    graduate: 'bg-purple-100 text-purple-700 border-purple-200',
  }

  const badgeStyle = diffStyles[difficulty?.toLowerCase()] || diffStyles.intermediate

  return (
    <div className="w-full mb-4">
      {/* Upper info row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 text-sm sm:text-base line-clamp-1">
            {topicName || 'AI Quiz Challenge'}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${badgeStyle}`}>
            {difficulty}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <span>Question {currentNum} of {totalQuestions}</span>
          <span className="text-slate-300">•</span>
          <span className="text-primary-600 font-bold">{percent}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
