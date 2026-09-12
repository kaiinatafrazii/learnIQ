const HISTORY_KEY = 'learniq_quiz_sessions'

const GAME_TYPES = [
  {
    id: 'hangman',
    label: 'Hangman Challenge',
    icon: '🧩',
    reward: 'Lives',
    variants: [
      { id: 'classic', label: 'Classic Rescue', description: 'Protect the learner avatar with five lives.' },
      { id: 'rebuild', label: 'Rebuild Mode', description: 'Correct answers rebuild the escape route.' },
      { id: 'rescue', label: 'Rescue Mission', description: 'Every correct answer moves the learner closer to safety.' },
    ],
  },
  {
    id: 'boss',
    label: 'Boss Battle',
    icon: '⚔',
    reward: 'Battle damage',
    variants: [
      { id: 'combo', label: 'Combo Attack', description: 'Streaks make each correct answer hit harder.' },
      { id: 'shield', label: 'Shield Breaker', description: 'Correct answers break layers of the boss shield.' },
      { id: 'duel', label: 'Knowledge Duel', description: 'Trade health for every risky mistake.' },
    ],
  },
  {
    id: 'treasure',
    label: 'Treasure Hunt',
    icon: '🗺',
    reward: 'Coins',
    variants: [
      { id: 'temple', label: 'Temple Route', description: 'Unlock ancient checkpoints with correct answers.' },
      { id: 'expedition', label: 'Lost Expedition', description: 'Preserve energy while crossing the knowledge map.' },
      { id: 'vault', label: 'Hidden Vault', description: 'Collect keys and open the final vault.' },
    ],
  },
  {
    id: 'time',
    label: 'Time Rush',
    icon: '⏱',
    reward: 'Speed XP',
    variants: [
      { id: 'sprint', label: 'Quick Sprint', description: 'Fast answers earn a clean speed bonus.' },
      { id: 'pressure', label: 'Pressure Line', description: 'Each round tightens the time window slightly.' },
      { id: 'checkpoint', label: 'Checkpoint Run', description: 'Beat the clock to secure each checkpoint.' },
    ],
  },
  {
    id: 'mystery',
    label: 'Mystery Case',
    icon: '🔎',
    reward: 'Clues',
    variants: [
      { id: 'detective', label: 'Evidence Board', description: 'Correct answers reveal evidence for the case.' },
      { id: 'signal', label: 'Signal Trace', description: 'Follow the strongest concept signals to the answer.' },
      { id: 'archive', label: 'Classified Archive', description: 'Unlock a final deduction from collected clues.' },
    ],
  },
  {
    id: 'survival',
    label: 'Survival',
    icon: '🛡',
    reward: 'XP',
    variants: [
      { id: 'last_stand', label: 'Last Stand', description: 'Hold five lives while difficulty rises fairly.' },
      { id: 'frontier', label: 'Frontier Run', description: 'Build a streak to push deeper into the topic.' },
      { id: 'recovery', label: 'Recovery Route', description: 'Smart answers can restore one lost life.' },
    ],
  },
]

const THEMES = [
  { id: 'space', label: 'Space Mission', className: 'from-slate-950 via-indigo-950 to-slate-900', accent: 'cyan' },
  { id: 'temple', label: 'Ancient Temple', className: 'from-stone-950 via-amber-950 to-slate-900', accent: 'amber' },
  { id: 'cyber', label: 'Cyber Lab', className: 'from-slate-950 via-cyan-950 to-slate-900', accent: 'cyan' },
  { id: 'detective', label: 'Detective Mystery', className: 'from-slate-950 via-violet-950 to-slate-900', accent: 'violet' },
  { id: 'ocean', label: 'Underwater Mission', className: 'from-slate-950 via-blue-950 to-slate-900', accent: 'sky' },
  { id: 'mountain', label: 'Mountain Expedition', className: 'from-slate-950 via-emerald-950 to-slate-900', accent: 'emerald' },
  { id: 'future', label: 'Future City', className: 'from-slate-950 via-rose-950 to-slate-900', accent: 'rose' },
  { id: 'science', label: 'Science Lab', className: 'from-slate-950 via-teal-950 to-slate-900', accent: 'teal' },
]

const QUESTION_STYLES = [
  { id: 'mission', label: 'Mission', prefix: 'MISSION' },
  { id: 'challenge', label: 'Quick Challenge', prefix: '⚡ QUICK CHALLENGE' },
  { id: 'clue', label: 'Clue', prefix: '🔎 CLUE' },
  { id: 'attack', label: 'Boss Attack', prefix: '⚔ BOSS ATTACK' },
  { id: 'checkpoint', label: 'Checkpoint', prefix: 'CHECKPOINT' },
]

const BONUSES = [
  { id: 'double', label: 'Double Points', description: 'One marked round pays 2x.' },
  { id: 'shield', label: 'Streak Shield', description: 'One mistake will not break the streak.' },
  { id: 'recovery', label: 'Life Recovery', description: 'A marked correct answer restores a life.' },
  { id: 'hint', label: 'Hint Token', description: 'One marked question gives a free hint.' },
  { id: 'speed', label: 'Speed Bonus', description: 'Fast correct answers earn extra XP.' },
]

const EVENTS = [
  { id: 'double', label: '2X POINTS', icon: '✦' },
  { id: 'shield', label: 'STREAK SHIELD', icon: '🛡' },
  { id: 'recovery', label: 'LIFE RECOVERY', icon: '♥' },
  { id: 'speed', label: 'SPEED ROUND', icon: '⚡' },
  { id: 'mystery', label: 'MYSTERY BONUS', icon: '?' },
  { id: 'hint', label: 'FREE HINT', icon: '💡' },
]

const RESULT_TITLES = {
  hangman: ['Rescue Complete', 'Escape Route Secured', 'Learner Rebuilt'],
  boss: ['Boss Defeated', 'Battle Won', 'System Protected'],
  treasure: ['Treasure Unlocked', 'Vault Opened', 'Expedition Complete'],
  time: ['Run Complete', 'Clock Conquered', 'Speed Record Set'],
  mystery: ['Case Solved', 'Mystery Unlocked', 'Evidence Confirmed'],
  survival: ['You Survived', 'Frontier Secured', 'Last Stand Complete'],
}

function hashSeed(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return hash >>> 0
}

function randomFrom(seed) {
  let state = seed >>> 0
  return () => {
    state = Math.imul(1664525, state) + 1013904223
    return (state >>> 0) / 4294967296
  }
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)]
}

function readHistory() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeHistory(history) {
  try { window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-5))) } catch { /* storage is optional */ }
}

export function createSessionConfiguration(topic, difficulty) {
  const history = readHistory()
  const seed = Date.now() + Math.floor(Math.random() * 1000000)
  const random = randomFrom(hashSeed(`${topic}:${difficulty}:${seed}`))
  const recent = history.slice(-5)
  let candidate

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const gameType = pick(GAME_TYPES, random)
    const variant = pick(gameType.variants, random)
    const theme = pick(THEMES, random)
    const questionStyle = pick(QUESTION_STYLES, random)
    const bonus = pick(BONUSES, random)
    const event = pick(EVENTS, random)
    candidate = { gameType, variant, theme, questionStyle, bonus, event }
    const exactRepeat = recent.some((item) => [gameType.id, variant.id, theme.id, questionStyle.id, bonus.id, event.id].every((key, index) => item[['gameType', 'variant', 'theme', 'questionStyle', 'bonus', 'event'][index]] === key))
    const repeatedParts = recent.reduce((count, item) => count + [gameType.id === item.gameType, variant.id === item.variant, theme.id === item.theme, questionStyle.id === item.questionStyle].filter(Boolean).length, 0)
    if (!exactRepeat && repeatedParts < 3) break
  }

  const timerByDifficulty = { beginner: 35, intermediate: 28, advanced: 22 }
  const config = {
    seed,
    topic,
    difficulty,
    gameType: candidate.gameType,
    variant: candidate.variant,
    theme: candidate.theme,
    questionStyle: candidate.questionStyle,
    bonus: candidate.bonus,
    event: candidate.event,
    timer: timerByDifficulty[difficulty] || 28,
    lives: candidate.gameType.id === 'time' && candidate.variant.id === 'sprint' ? 4 : 5,
    progressionLabel: candidate.gameType.id === 'boss' ? 'Battle Round' : candidate.gameType.id === 'mystery' ? 'Clue' : candidate.gameType.id === 'treasure' ? 'Checkpoint' : candidate.gameType.id === 'time' ? 'Sprint' : candidate.gameType.id === 'survival' ? 'Level' : 'Mission',
    resultTitle: pick(RESULT_TITLES[candidate.gameType.id], random),
  }
  writeHistory([...history, { gameType: config.gameType.id, variant: config.variant.id, theme: config.theme.id, questionStyle: config.questionStyle.id, bonus: config.bonus.id, event: config.event.id }])
  return config
}

export function prepareSessionQuestions(questions, seed) {
  const random = randomFrom(hashSeed(String(seed)))
  const shuffled = [...questions]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled.map((question) => {
    const keys = ['a', 'b', 'c', 'd']
    for (let index = keys.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1))
      const currentKey = keys[index]
      keys[index] = keys[swapIndex]
      keys[swapIndex] = currentKey
    }
    return { ...question, displayOptions: keys.map((key) => ({ key, text: question[`option_${key}`] })) }
  })
}

export function getFeedbackMessage(isCorrect, seed, index) {
  const correct = ['Excellent!', 'Nice streak!', 'Perfect!', 'Right on target!', 'Great answer!', 'You got it!']
  const wrong = ['Not quite.', 'Close one.', "Let's learn from this.", 'Almost there.', 'Good attempt.']
  const messages = isCorrect ? correct : wrong
  return messages[(hashSeed(`${seed}:${index}`) % messages.length)]
}