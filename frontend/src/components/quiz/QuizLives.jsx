// components/quiz/QuizLives.jsx — Lives / Hearts display
import React from 'react'

export default function QuizLives({ lives = 5, maxLives = 5 }) {
  return (
    <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
      <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">Lives:</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: maxLives }).map((_, index) => {
          const isAlive = index < lives
          return (
            <span
              key={index}
              className={`text-lg transition-all duration-300 transform ${
                isAlive
                  ? 'scale-100 filter drop-shadow-sm'
                  : 'scale-90 opacity-25 grayscale'
              }`}
              title={isAlive ? 'Active Life' : 'Lost Life'}
            >
              {isAlive ? '❤️' : '🤍'}
            </span>
          )
        })}
      </div>
      <span className={`text-xs font-bold ml-1 ${lives <= 1 ? 'text-rose-600' : 'text-slate-700'}`}>
        {lives}/{maxLives}
      </span>
    </div>
  )
}
