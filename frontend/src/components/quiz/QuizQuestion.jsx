// components/quiz/QuizQuestion.jsx — Question card with Options and Hint system
import React, { useEffect, useState } from 'react'
import QuizOption from './QuizOption'

const OPTION_KEYS = ['a', 'b', 'c', 'd']
const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' }

export default function QuizQuestion({
  question,
  selectedOption = null,
  isRevealed = false,
  correctAnswer = null,
  hintUsed = false,
  onSelectOption = () => {},
  onUseHint = () => {},
  disabled = false,
  presentation = 'normal',
  freeHint = false,
}) {
  const [showHintBox, setShowHintBox] = useState(hintUsed)
  const options = question?.displayOptions || OPTION_KEYS.map((key) => ({ key, text: question?.[`option_${key}`] }))

  useEffect(() => {
    setShowHintBox(Boolean(hintUsed))
  }, [question?.id, hintUsed])

  if (!question) return null

  const handleHintClick = () => {
    if (!showHintBox) {
      setShowHintBox(true)
      onUseHint()
    } else {
      setShowHintBox(false)
    }
  }

  return (
    <div className="card shadow-md border border-slate-100 bg-white mb-6 animate-fade-in">
      {/* Header: Concept Tag + Hint Button */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
          #{question.concept_tag || 'concept'}
        </span>

        {/* Hint button */}
        {question.hint && (
          <button
            type="button"
            onClick={handleHintClick}
            disabled={disabled && !showHintBox}
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
              hintUsed || showHintBox
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <span>💡</span>
            <span>{showHintBox ? 'Hide Hint' : freeHint ? 'Free Hint' : 'Need a Hint?'}</span>
            {!hintUsed && !freeHint && <span className="text-[10px] text-amber-600 font-bold">(-10 pts)</span>}
          </button>
        )}
      </div>

      {/* Answer-neutral Hint Box */}
      {showHintBox && question.hint && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
          <span className="text-base shrink-0">💡</span>
          <div>
            <strong className="font-semibold block mb-0.5">Helpful Hint:</strong>
            <p className="text-amber-800 leading-relaxed">{question.hint}</p>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-600 mb-2">
        {presentation === 'mission' ? 'Mission briefing' : presentation === 'clue' ? 'Evidence clue' : presentation === 'attack' ? 'Defend your position' : presentation === 'checkpoint' ? 'Checkpoint decision' : 'Quick challenge'}
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
        {question.question}
      </h2>

      {/* 4 Answer Options */}
      <div className="space-y-3">
        {options.map(({ key, text: optText }) => {
          if (!optText) return null

          const isUserChoice = selectedOption === key
          const isThisCorrect = isRevealed ? key === correctAnswer : null

          return (
            <QuizOption
              key={key}
              optionKey={key}
              label={OPTION_LABELS[key]}
              text={optText}
              selected={isUserChoice}
              isCorrect={isThisCorrect}
              isUserSelection={isUserChoice}
              disabled={disabled || isRevealed}
              onSelect={onSelectOption}
            />
          )
        })}
      </div>
    </div>
  )
}
