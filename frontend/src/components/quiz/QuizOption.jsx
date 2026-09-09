// components/quiz/QuizOption.jsx — Large interactive answer button
import React from 'react'

export default function QuizOption({
  optionKey = 'a',
  label = 'A',
  text = '',
  selected = false,
  isCorrect = null,       // true | false | null (null means not revealed yet)
  isUserSelection = false,
  disabled = false,
  onSelect = () => {},
}) {
  // Determine color styling based on answer check state
  let stateClasses = 'bg-white text-slate-700 border-slate-200 hover:border-primary-400 hover:bg-primary-50/40'
  let badgeClasses = 'bg-slate-100 text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700'
  let icon = null

  if (isCorrect !== null) {
    if (isCorrect) {
      // This is the correct answer
      stateClasses = 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-sm ring-2 ring-emerald-400/20'
      badgeClasses = 'bg-emerald-500 text-white font-bold'
      icon = <span className="text-emerald-600 font-bold ml-auto text-lg">✓</span>
    } else if (isUserSelection && !isCorrect) {
      // This is what the user incorrectly clicked
      stateClasses = 'bg-rose-50 text-rose-900 border-rose-400 shadow-sm ring-2 ring-rose-400/20'
      badgeClasses = 'bg-rose-500 text-white font-bold'
      icon = <span className="text-rose-500 font-bold ml-auto text-lg">✕</span>
    } else {
      // Other options after reveal
      stateClasses = 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
      badgeClasses = 'bg-slate-200 text-slate-400'
    }
  } else if (selected) {
    stateClasses = 'bg-primary-50 text-primary-900 border-primary-500 shadow-sm ring-2 ring-primary-400/20'
    badgeClasses = 'bg-primary-500 text-white font-bold'
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(optionKey)}
      disabled={disabled}
      className={`group w-full flex items-center text-left p-3.5 sm:p-4 rounded-xl border text-sm sm:text-base font-medium transition-all duration-200 cursor-pointer disabled:cursor-default ${stateClasses}`}
    >
      {/* Option Key Badge [A], [B], [C], [D] */}
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm mr-3 shrink-0 transition-colors ${badgeClasses}`}>
        {label}
      </span>

      {/* Option Text */}
      <span className="flex-1 leading-snug break-words">
        {text}
      </span>

      {/* Result indicator icon if revealed */}
      {icon}
    </button>
  )
}
