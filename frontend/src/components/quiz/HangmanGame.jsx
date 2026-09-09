// components/quiz/HangmanGame.jsx — Gamified Hangman-style visual state
import React, { useEffect, useState } from 'react'

export default function HangmanGame({ lives = 5, maxLives = 5, lastResult = null }) {
  const [celebrate, setCelebrate] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (lastResult === 'correct') {
      setCelebrate(true)
      const timer = setTimeout(() => setCelebrate(false), 1400)
      return () => clearTimeout(timer)
    } else if (lastResult === 'wrong') {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 600)
      return () => clearTimeout(timer)
    }
  }, [lastResult])

  // Map lives to game mood and title
  const stateMeta = {
    5: { label: 'Safe & Confident', emoji: '😊', desc: 'Platform is solid. You have all 5 lives!', statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    4: { label: 'Tension Rising',   emoji: '😐', desc: '1 mistake made. Danger chain is lowering!', statusColor: 'text-blue-600 bg-blue-50 border-blue-200' },
    3: { label: 'Unstable Ground',  emoji: '😟', desc: '2 mistakes! Platform is starting to collapse.', statusColor: 'text-amber-600 bg-amber-50 border-amber-200' },
    2: { label: 'High Danger!',     emoji: '😨', desc: 'Only 2 lives left! Character is losing balance.', statusColor: 'text-orange-600 bg-orange-50 border-orange-200' },
    1: { label: 'Critical Peril!',  emoji: '😰', desc: '1 Life Remaining! Hanging on by fingertips!', statusColor: 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse' },
    0: { label: 'Game Over!',       emoji: '💀', desc: 'All lives lost! Review your answers below.', statusColor: 'text-slate-800 bg-slate-100 border-slate-300' },
  }

  const currentMeta = stateMeta[Math.max(0, Math.min(5, lives))] || stateMeta[5]

  return (
    <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      lives === 0
        ? 'border-slate-300 bg-slate-50/80 shadow-inner'
        : lives === 1
        ? 'border-rose-300 bg-rose-50/40 shadow-sm'
        : 'border-indigo-100 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/50 shadow-sm'
    } p-4 sm:p-5 mb-6`}>
      
      {/* Top Banner Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="character mood">{currentMeta.emoji}</span>
          <div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${currentMeta.statusColor}`}>
              {currentMeta.label}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">{currentMeta.desc}</p>
          </div>
        </div>

        {/* Danger Meter indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Danger:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => {
              const lostCount = maxLives - lives
              const isFilled = level <= lostCount
              return (
                <div
                  key={level}
                  className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
                    isFilled
                      ? level >= 4
                        ? 'bg-rose-500'
                        : level >= 2
                        ? 'bg-amber-400'
                        : 'bg-yellow-400'
                      : 'bg-slate-200'
                  }`}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* SVG Hangman Challenge Scene */}
      <div className={`relative w-full h-44 sm:h-52 flex items-center justify-center ${shake ? 'animate-bounce' : ''}`}>
        <svg
          viewBox="0 0 400 200"
          className="w-full h-full max-w-md drop-shadow-sm select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Grid & Sky */}
          <rect x="0" y="0" width="400" height="200" rx="16" fill="transparent" />
          
          {/* Gallows / Crane structure */}
          {/* Ground Base */}
          <line x1="40" y1="185" x2="360" y2="185" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          
          {/* Left Vertical Post */}
          <line x1="80" y1="185" x2="80" y2="25" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          {/* Diagonal Brace */}
          <line x1="80" y1="65" x2="120" y2="25" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
          {/* Top Horizontal Beam */}
          <line x1="76" y1="25" x2="250" y2="25" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
          {/* Top Hook Ring */}
          <circle cx="230" cy="25" r="5" stroke="#334155" strokeWidth="3" fill="#64748b" />

          {/* Danger Chain / Rope (lowers as lives decrease) */}
          <line
            x1="230"
            y1="25"
            x2="230"
            y2={lives <= 1 ? "85" : lives === 2 ? "70" : lives === 3 ? "55" : "40"}
            stroke={lives <= 2 ? "#e11d48" : "#94a3b8"}
            strokeWidth="3"
            strokeDasharray={lives <= 1 ? "none" : "3,3"}
            className="transition-all duration-500"
          />

          {/* Platform beneath character */}
          {lives >= 5 && (
            // Full solid platform
            <g className="transition-all duration-300">
              <rect x="180" y="155" width="100" height="14" rx="4" fill="#6366f1" />
              <rect x="185" y="157" width="90" height="4" rx="2" fill="#818cf8" opacity="0.6" />
              <line x1="180" y1="185" x2="200" y2="169" stroke="#94a3b8" strokeWidth="3" />
              <line x1="280" y1="185" x2="260" y2="169" stroke="#94a3b8" strokeWidth="3" />
            </g>
          )}

          {lives === 4 && (
            // Slightly tilted platform
            <g transform="rotate(3 230 155)" className="transition-all duration-300">
              <rect x="185" y="155" width="90" height="14" rx="4" fill="#3b82f6" />
              <line x1="190" y1="185" x2="205" y2="169" stroke="#94a3b8" strokeWidth="3" />
              <line x1="270" y1="185" x2="255" y2="169" stroke="#94a3b8" strokeWidth="3" />
            </g>
          )}

          {lives === 3 && (
            // Cracked small platform
            <g transform="rotate(7 230 155)" className="transition-all duration-300">
              <rect x="195" y="157" width="70" height="12" rx="3" fill="#f59e0b" />
              <line x1="210" y1="157" x2="225" y2="169" stroke="#b45309" strokeWidth="2" />
              <line x1="200" y1="185" x2="215" y2="169" stroke="#94a3b8" strokeWidth="3" />
            </g>
          )}

          {lives === 2 && (
            // Tiny wobbling stone block
            <g transform="rotate(-12 230 160)" className="transition-all duration-300">
              <rect x="210" y="160" width="40" height="12" rx="3" fill="#f97316" />
              <line x1="220" y1="185" x2="230" y2="172" stroke="#94a3b8" strokeWidth="2" />
            </g>
          )}

          {lives <= 1 && (
            // Platform broken completely into rubble
            <g className="transition-all duration-300">
              <rect x="175" y="180" width="15" height="5" rx="1" fill="#cbd5e1" transform="rotate(15 175 180)" />
              <rect x="270" y="181" width="18" height="4" rx="1" fill="#cbd5e1" transform="rotate(-20 270 181)" />
              <circle cx="230" cy="183" r="3" fill="#94a3b8" />
            </g>
          )}

          {/* Safety Trampoline / Net at the bottom if lives == 0 */}
          {lives === 0 && (
            <g className="animate-fade-in">
              <path d="M 170 178 Q 230 195 290 178" stroke="#10b981" strokeWidth="4" strokeDasharray="4,2" fill="none" />
              <line x1="170" y1="178" x2="170" y2="185" stroke="#059669" strokeWidth="3" />
              <line x1="290" y1="178" x2="290" y2="185" stroke="#059669" strokeWidth="3" />
              <text x="230" y="172" textAnchor="middle" fill="#059669" fontSize="10" fontWeight="bold">SAFETY NET</text>
            </g>
          )}

          {/* ======================================================== */}
          {/* THE LEARNER CHARACTER "LEX" (Vector Astronaut/Student)  */}
          {/* ======================================================== */}
          <g
            id="character-lex"
            className="transition-all duration-500 ease-out"
            transform={
              lives >= 5
                ? 'translate(230, 115)'
                : lives === 4
                ? 'translate(230, 115) rotate(2)'
                : lives === 3
                ? 'translate(230, 118) rotate(-4)'
                : lives === 2
                ? 'translate(230, 122) rotate(6)'
                : lives === 1
                ? 'translate(230, 110) rotate(-10)' // Dangling by arms
                : 'translate(230, 150)' // Fallen safely
            }
          >
            {/* Safe Shield Aura when Celebrate */}
            {celebrate && (
              <circle cx="0" cy="-10" r="38" fill="#6366f1" opacity="0.15" className="animate-ping" />
            )}

            {/* Arms */}
            {lives >= 2 ? (
              // Normal or Balancing Arms
              <g stroke="#334155" strokeWidth="4" strokeLinecap="round">
                <line x1="-12" y1="-5" x2={lives >= 4 ? "-20" : "-24"} y2={lives >= 4 ? "4" : "-12"} />
                <line x1="12" y1="-5" x2={lives >= 4 ? "20" : "24"} y2={lives >= 4 ? "4" : "-12"} />
              </g>
            ) : lives === 1 ? (
              // Hanging Arms reaching for the rope
              <g stroke="#e11d48" strokeWidth="4" strokeLinecap="round">
                <line x1="-10" y1="-8" x2="0" y2="-24" />
                <line x1="10" y1="-8" x2="0" y2="-24" />
              </g>
            ) : (
              // Relaxed / Fallen Arms
              <g stroke="#64748b" strokeWidth="4" strokeLinecap="round">
                <line x1="-12" y1="0" x2="-22" y2="8" />
                <line x1="12" y1="0" x2="22" y2="8" />
              </g>
            )}

            {/* Legs */}
            {lives >= 2 ? (
              <g stroke="#1e293b" strokeWidth="5" strokeLinecap="round">
                <line x1="-6" y1="16" x2="-8" y2="34" />
                <line x1="6" y1="16" x2="8" y2="34" />
                {/* Shoes */}
                <ellipse cx="-10" cy="35" rx="5" ry="3" fill="#475569" />
                <ellipse cx="10" cy="35" rx="5" ry="3" fill="#475569" />
              </g>
            ) : lives === 1 ? (
              // Dangling Kicking Legs
              <g stroke="#1e293b" strokeWidth="5" strokeLinecap="round">
                <line x1="-6" y1="16" x2="-14" y2="30" />
                <line x1="6" y1="16" x2="2" y2="32" />
              </g>
            ) : (
              // Sitting / landed
              <g stroke="#64748b" strokeWidth="5" strokeLinecap="round">
                <line x1="-6" y1="12" x2="-18" y2="18" />
                <line x1="6" y1="12" x2="18" y2="18" />
              </g>
            )}

            {/* Torso / Jacket */}
            <rect
              x="-14"
              y="-12"
              width="28"
              height="30"
              rx="8"
              fill={lives <= 1 ? "#f43f5e" : lives <= 3 ? "#f59e0b" : "#4f46e5"}
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Student tie/zipper */}
            <line x1="0" y1="-10" x2="0" y2="14" stroke="#ffffff" strokeWidth="2" strokeDasharray="3,2" />

            {/* Head / Helmet */}
            <circle cx="0" cy="-24" r="16" fill="#f8fafc" stroke="#1e293b" strokeWidth="3" />

            {/* Graduation Cap / Tech Cap */}
            <path d="M -16 -34 L 0 -40 L 16 -34 L 0 -28 Z" fill="#1e293b" />
            <line x1="10" y1="-32" x2="12" y2="-24" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="12" cy="-23" r="2" fill="#f59e0b" />

            {/* Face Expressions */}
            {lives >= 5 && (
              // 😊 Smiling Happy Face
              <g>
                <circle cx="-5" cy="-24" r="2.5" fill="#1e293b" />
                <circle cx="5" cy="-24" r="2.5" fill="#1e293b" />
                <path d="M -5 -20 Q 0 -15 5 -20" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="-9" cy="-20" r="2" fill="#f43f5e" opacity="0.4" />
                <circle cx="9" cy="-20" r="2" fill="#f43f5e" opacity="0.4" />
              </g>
            )}

            {lives === 4 && (
              // 😐 Neutral / Alert Face
              <g>
                <circle cx="-5" cy="-24" r="2.5" fill="#1e293b" />
                <circle cx="5" cy="-24" r="2.5" fill="#1e293b" />
                <line x1="-4" y1="-18" x2="4" y2="-18" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {lives === 3 && (
              // 😟 Worried Face with sweat drop
              <g>
                <circle cx="-5" cy="-24" r="2.5" fill="#1e293b" />
                <circle cx="5" cy="-24" r="2.5" fill="#1e293b" />
                <path d="M -5 -17 Q 0 -22 5 -17" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Sweat bead */}
                <path d="M 12 -28 Q 14 -24 12 -22 Q 10 -24 12 -28" fill="#38bdf8" />
              </g>
            )}

            {lives === 2 && (
              // 😨 Scared Face
              <g>
                <circle cx="-5" cy="-25" r="3" fill="#1e293b" />
                <circle cx="5" cy="-25" r="3" fill="#1e293b" />
                <ellipse cx="0" cy="-17" rx="3.5" ry="4.5" fill="#1e293b" />
                <path d="M 13 -28 Q 15 -23 13 -21 Q 11 -23 13 -28" fill="#38bdf8" />
              </g>
            )}

            {lives === 1 && (
              // 😰 Panicked Clinging Face
              <g>
                <ellipse cx="-5" cy="-25" rx="3.5" ry="4" fill="#e11d48" />
                <ellipse cx="5" cy="-25" rx="3.5" ry="4" fill="#e11d48" />
                <ellipse cx="0" cy="-16" rx="4" ry="5.5" fill="#1e293b" />
                {/* Sweat drops */}
                <circle cx="-13" cy="-22" r="2" fill="#38bdf8" />
                <circle cx="13" cy="-22" r="2" fill="#38bdf8" />
              </g>
            )}

            {lives === 0 && (
              // 😵 Dizzy X Eyes
              <g>
                <line x1="-7" y1="-26" x2="-3" y2="-22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="-3" y1="-26" x2="-7" y2="-22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="3" y1="-26" x2="7" y2="-22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="7" y1="-26" x2="3" y2="-22" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
                <ellipse cx="0" cy="-16" rx="4" ry="3" fill="#64748b" />
              </g>
            )}
          </g>

          {/* Celebratory Floating Stars if Correct */}
          {celebrate && (
            <g className="animate-fade-in">
              <text x="210" y="70" fontSize="20" fill="#f59e0b">✨</text>
              <text x="255" y="65" fontSize="22" fill="#10b981">⭐</text>
              <text x="230" y="55" fontSize="16" fill="#6366f1">🎉</text>
              <rect x="205" y="76" width="60" height="18" rx="9" fill="#10b981" />
              <text x="235" y="89" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">+100</text>
            </g>
          )}

          {/* Wrong Flash indicator if Wrong */}
          {shake && (
            <g className="animate-fade-in">
              <text x="215" y="60" fontSize="24" fill="#f43f5e">💔</text>
              <rect x="200" y="68" width="70" height="18" rx="9" fill="#f43f5e" />
              <text x="235" y="81" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">-1 LIFE</text>
            </g>
          )}
        </svg>
      </div>

      {/* Lives Heart Bar inside Hangman area */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {[0, 1, 2, 3, 4].map((i) => {
          const isAlive = i < lives
          return (
            <span
              key={i}
              className={`text-2xl transition-all duration-300 transform ${
                isAlive
                  ? 'scale-100 filter drop-shadow-sm hover:scale-110'
                  : 'scale-90 opacity-25 grayscale'
              }`}
              title={isAlive ? 'Life active' : 'Life lost'}
            >
              {isAlive ? '❤️' : '🤍'}
            </span>
          )
        })}
      </div>
    </div>
  )
}
