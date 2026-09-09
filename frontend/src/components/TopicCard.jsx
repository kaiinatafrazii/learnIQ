// components/TopicCard.jsx — Topic / recently studied card

import { difficultyClasses, capitalize } from '../utils/formatters'

export default function TopicCard({ topic, mastery, difficulty, category, onClick }) {
  const pct = Math.round(mastery || 0)

  return (
    <div
      onClick={onClick}
      className="card-hover flex flex-col gap-3"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{topic}</p>
          {category && <p className="text-xs text-slate-400 mt-0.5">{category}</p>}
        </div>
        {difficulty && (
          <span className={difficultyClasses(difficulty)}>
            {capitalize(difficulty)}
          </span>
        )}
      </div>

      {mastery !== undefined && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Mastery</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pct >= 80 ? 'bg-secondary-500' : pct >= 50 ? 'bg-accent-500' : 'bg-danger-400'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
