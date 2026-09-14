// pages/TutorPage.jsx — AI Tutor with Multilingual Voice, Topic Images, and Human-Friendly Explanations

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MermaidViewer from '../components/MermaidViewer'
import VoiceControls from '../components/VoiceControls'
import { useToast } from '../components/Toast'
import { capitalize, difficultyClasses } from '../utils/formatters'
import api from '../services/api'

/* ── Language config ──────────────────────────────────────────────────────── */
const LANGUAGES = [
  { code: 'en',   label: 'English',  flag: '🇮🇳', nativeLabel: 'English' },
  { code: 'hing', label: 'Hinglish', flag: '🇮🇳', nativeLabel: 'Hinglish' },
  { code: 'or',   label: 'Odia',     flag: '🇮🇳', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'bn',   label: 'Bengali',  flag: '🇮🇳', nativeLabel: 'বাংলা' },
]

/* ── Interactive Avatar Component ─────────────────────────────────────────── */
function Avatar({ state }) {
  const stateConfig = {
    idle:      { emoji: '🤖', label: 'Ready',     bg: 'bg-primary-100 ring-primary-200', pulse: false },
    speaking:  { emoji: '🗣️', label: 'Speaking',  bg: 'bg-secondary-100 ring-teal-300',  pulse: true  },
    thinking:  { emoji: '🤔', label: 'Thinking',  bg: 'bg-accent-100 ring-amber-300',   pulse: true  },
    listening: { emoji: '👂', label: 'Listening', bg: 'bg-rose-100 ring-rose-300',      pulse: true  },
  }
  const cfg = stateConfig[state] || stateConfig.idle
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-24 h-24 ${cfg.bg} ring-4 rounded-3xl flex items-center justify-center text-5xl shadow-lg transition-all duration-300 ${
          cfg.pulse ? 'animate-pulse' : 'hover:scale-105'
        }`}
      >
        <span>{cfg.emoji}</span>
      </div>
      <span
        className={`badge font-medium transition-colors ${
          state === 'speaking'  ? 'badge-success' :
          state === 'thinking'  ? 'badge-warning' :
          state === 'listening' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-600'
        }`}
      >
        ● {cfg.label}
      </span>
    </div>
  )
}

/* ── Inline parser for clean human-friendly rendering ─────────────────────── */
function renderInline(text) {
  if (!text) return ''
  // 1. Clean up rogue double quotes / quotes ''word'' -> word
  let clean = text.replace(/''([^'\n]+)''/g, '$1').replace(/''/g, '')
  // Strip single quotes around isolated words: 'Photosynthesis' -> Photosynthesis
  clean = clean.replace(/(^|[\s(])'([A-Za-z0-9_ -]{2,35})'([\s).,;:!?]|$)/g, '$1$2$3')
  // Strip rogue asterisks **word** -> word, *word* -> word
  clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1')
  clean = clean.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
  // Clean LaTeX artifacts
  clean = clean.replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\pm/g, '±').replace(/\\sqrt/g, '√').replace(/\\to/g, '→')
  clean = clean.replace(/\$\$(.*?)\$\$/g, '$1').replace(/\$(.*?)\$/g, '$1')

  // Parse inline `code`
  const parts = []
  const regex = /(`([^`]+)`)/g
  let last = 0
  let m
  while ((m = regex.exec(clean)) !== null) {
    if (m.index > last) parts.push(clean.slice(last, m.index))
    parts.push(
      <code key={m.index} className="bg-slate-100 text-primary-700 px-1.5 py-0.5 rounded text-[0.82em] font-mono font-medium">
        {m[2]}
      </code>
    )
    last = m.index + m[0].length
  }
  if (last < clean.length) parts.push(clean.slice(last))
  return parts.length ? parts : clean
}

/* ── Structured AI Content Renderer ──────────────────────────────────────── */
function AIContent({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let inBulletGroup = false
  let bulletBuffer = []

  const flushBullets = (key) => {
    if (bulletBuffer.length === 0) return
    elements.push(
      <ul key={`ul-${key}`} className="space-y-1.5 my-2 ml-1">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
            <span className="text-sm">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    bulletBuffer = []
    inBulletGroup = false
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // 1. Headers
    if (trimmed.startsWith('# ')) {
      flushBullets(i)
      elements.push(
        <h1 key={i} className="text-xl font-extrabold text-slate-900 mt-5 mb-2 flex items-center gap-2">
          {renderInline(trimmed.slice(2))}
        </h1>
      )
    } else if (trimmed.startsWith('## ')) {
      flushBullets(i)
      elements.push(
        <h2 key={i} className="text-base font-bold text-slate-800 mt-5 mb-1.5 flex items-center gap-1.5">
          {renderInline(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith('### ')) {
      flushBullets(i)
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-slate-700 mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      )
    // 2. Blockquotes
    } else if (trimmed.startsWith('> ')) {
      flushBullets(i)
      const inner = trimmed.slice(2)
      elements.push(
        <blockquote key={i} className="border-l-4 border-primary-500 bg-primary-50/70 px-4 py-3 rounded-r-xl my-3 text-slate-800 text-sm leading-relaxed">
          {renderInline(inner)}
        </blockquote>
      )
    // 3. Dedicated Equation / Formula Block
    } else if (
      trimmed.toLowerCase().startsWith('equation:') ||
      trimmed.toLowerCase().startsWith('formula:') ||
      trimmed.toLowerCase().startsWith('formula :') ||
      trimmed.toLowerCase().startsWith('equation :')
    ) {
      flushBullets(i)
      const parts = trimmed.split(':')
      const label = parts[0].trim()
      const formula = parts.slice(1).join(':').trim()
      elements.push(
        <div key={i} className="my-3 p-3.5 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800">
          <div className="text-[10px] uppercase font-bold tracking-widest text-primary-400 mb-1 flex items-center gap-1.5">
            <span>📐</span> {label}
          </div>
          {formula ? (
            <div className="font-mono text-base md:text-lg font-semibold tracking-wide text-emerald-300 py-0.5">
              {renderInline(formula)}
            </div>
          ) : null}
        </div>
      )
    // 4. Worked Example header
    } else if (
      trimmed.toLowerCase().startsWith('worked example:') ||
      trimmed.toLowerCase().startsWith('worked calculation:')
    ) {
      flushBullets(i)
      elements.push(
        <div key={i} className="mt-4 mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg w-fit">
          <span>⚡</span> {renderInline(trimmed)}
        </div>
      )
    // 5. Where: variable definition header
    } else if (trimmed.toLowerCase() === 'where:' || trimmed.toLowerCase() === 'where :') {
      flushBullets(i)
      elements.push(
        <p key={i} className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2.5 mb-1">
          {trimmed}
        </p>
      )
    // 6. Key Takeaways header
    } else if (trimmed.toLowerCase().startsWith('key takeaways')) {
      flushBullets(i)
      elements.push(
        <div key={i} className="mt-5 mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          <span>{renderInline(trimmed.replace(/:$/, ''))}</span>
        </div>
      )
    // 7. Bullets
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      bulletBuffer.push(trimmed.replace(/^[-*•]\s/, ''))
      inBulletGroup = true
    // 8. Numbered lists
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushBullets(i)
      const content = trimmed.replace(/^\d+\.\s/, '')
      const num = trimmed.match(/^(\d+)/)[1]
      elements.push(
        <div key={i} className="flex items-start gap-2.5 my-1.5">
          <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {num}
          </span>
          <span className="text-slate-700 leading-relaxed text-sm">{renderInline(content)}</span>
        </div>
      )
    // 9. Spacers
    } else if (trimmed === '' || trimmed === '---') {
      flushBullets(i)
      if (trimmed === '') elements.push(<div key={i} className="h-1.5" />)
    // 10. General text paragraphs
    } else {
      flushBullets(i)
      elements.push(
        <p key={i} className="text-slate-700 leading-relaxed text-sm">
          {renderInline(trimmed)}
        </p>
      )
    }
  })
  flushBullets('end')

  return <div className="ai-content space-y-0.5">{elements}</div>
}

/* ── Language Selector ────────────────────────────────────────────────────── */
function LangSelector({ lang, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          title={l.label}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            lang === l.code
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {l.nativeLabel}
        </button>
      ))}
    </div>
  )
}

/* ── Topic Image — Google Gemini Imagen 3 (via secure backend) ───────────── */
function TopicImage({ topic }) {
  const [imgSrc, setImgSrc]   = useState(null)   // data:image/png;base64,...
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!topic) { setImgSrc(null); setError(null); return }
    let cancelled = false
    setLoading(true)
    setImgSrc(null)
    setError(null)

    api.post('/api/tutor/image', { topic })
      .then(res => {
        if (cancelled) return
        const { image_base64, mime_type } = res.data
        setImgSrc(`data:${mime_type};base64,${image_base64}`)
      })
      .catch(err => {
        if (cancelled) return
        // Silently hide image section on error — don't break the lesson
        setError(err?.response?.data?.error || 'Image unavailable')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [topic])

  if (loading) {
    return (
      <div className="w-full h-44 rounded-xl bg-gradient-to-br from-slate-100 to-primary-50 animate-pulse flex flex-col items-center justify-center gap-2 mb-5 border border-slate-100">
        <span className="text-2xl animate-spin">🎨</span>
        <span className="text-xs text-slate-400 font-medium">Preparing visual overview…</span>
      </div>
    )
  }

  if (error || !imgSrc) return null

  return (
    <div className="mb-5 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900/5">
      <img
        src={imgSrc}
        alt={`Visual illustration for ${topic}`}
        className="w-full max-h-56 object-contain"
      />
      <p className="text-[11px] text-slate-400 px-3 py-1.5 bg-slate-50 italic flex items-center justify-between border-t border-slate-100">
        <span className="flex items-center gap-1">
          <span>✨</span> Visual Concept Overview · {topic}
        </span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Educational Asset</span>
      </p>
    </div>
  )
}



/* ── Main TutorPage ───────────────────────────────────────────────────────── */
export default function TutorPage() {
  const location = useLocation()
  const { addToast } = useToast()

  const [topic, setTopic] = useState(location.state?.topic || '')
  const [topicInput, setTopicInput] = useState(location.state?.topic || '')
  const [explanation, setExplanation] = useState('')
  const [keyPoints, setKeyPoints] = useState([])
  const [difficulty, setDifficulty] = useState('')
  const [topicId, setTopicId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [avatarState, setAvatarState] = useState('idle')
  const [loading, setLoading] = useState(false)
  const [diagramLoading, setDiagramLoading] = useState(false)
  const [diagramCode, setDiagramCode] = useState('')
  const [activeTab, setActiveTab] = useState('explanation')
  const [question, setQuestion] = useState('')

  // Language preference — persisted in localStorage
  const [lang, setLang] = useState(() => localStorage.getItem('learniq_lang') || 'en')

  const inputRef = useRef(null)

  const handleLangChange = (code) => {
    setLang(code)
    localStorage.setItem('learniq_lang', code)
  }

  // Auto-load if topic was passed from dashboard
  useEffect(() => {
    if (location.state?.topic) explainTopic(location.state.topic)
  }, []) // eslint-disable-line

  const explainTopic = async (topicName, followUp = null) => {
    if (!topicName?.trim()) return
    setLoading(true)
    setAvatarState('thinking')
    setExplanation('')
    setKeyPoints([])
    setDiagramCode('')
    setActiveTab('explanation')

    try {
      const res = await api.post('/api/tutor/explain', {
        topic: topicName,
        follow_up_question: followUp || undefined,
        lang,
      })
      const d = res.data
      setExplanation(d.explanation)
      setKeyPoints(d.key_points || [])
      setDifficulty(d.difficulty)
      setTopicId(d.topic_id)
      setSessionId(d.session_id)
      setTopic(topicName)
      setAvatarState('speaking')
      setTimeout(() => setAvatarState('idle'), 6000)
    } catch (err) {
      const msg = err.response?.data?.error || 'AI tutor is having trouble. Please retry.'
      addToast(msg, 'error')
      setAvatarState('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchDiagram = async () => {
    if (!topic) return
    setActiveTab('diagram')
    if (diagramCode) return

    setDiagramLoading(true)
    setAvatarState('thinking')
    try {
      const res = await api.post('/api/tutor/diagram', {
        topic,
        explanation_context: explanation,
      })
      setDiagramCode(res.data.mermaid || '')
      setAvatarState('idle')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not generate visual diagram.', 'error')
      setAvatarState('idle')
    } finally {
      setDiagramLoading(false)
    }
  }

  const handleAsk = () => {
    if (!question.trim()) return
    setAvatarState('listening')
    explainTopic(topic || topicInput, question)
    setQuestion('')
  }

  const handleGenerateNotes = async () => {
    if (!explanation || !topic) return
    try {
      await api.post('/api/tutor/notes', { topic, explanation, topic_id: topicId })
      addToast('Notes saved successfully! Check your Notes page. 📝', 'success')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not save notes.', 'error')
    }
  }

  const currentLangLabel = LANGUAGES.find(l => l.code === lang)?.nativeLabel || 'English'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0 flex flex-col">
        {/* ── Topic input bar ─────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter any topic to learn (e.g., Backpropagation, Photosynthesis, GST)…"
                className="input-field pr-12 w-full"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && explainTopic(topicInput)}
              />
            </div>

            {/* Language Selector */}
            <LangSelector lang={lang} onChange={handleLangChange} />

            {/* Voice Input for topic search */}
            <VoiceControls
              lang={lang}
              onTranscript={(text) => { setTopicInput(text); explainTopic(text) }}
              onSpeakingStateChange={setAvatarState}
            />
            <button
              onClick={() => explainTopic(topicInput)}
              disabled={loading || !topicInput.trim()}
              className="btn-primary px-6 flex-shrink-0"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              ) : '🚀 Learn'}
            </button>
          </div>
        </div>

        {/* ── Main 3-column layout ────────────────────────────────────────── */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr_240px] gap-6">

          {/* ── LEFT COLUMN: Avatar & Quick Actions ─────────────────────── */}
          <div className="flex flex-col items-center gap-4 lg:items-stretch">
            <div className="card w-full flex flex-col items-center py-6 gap-4 text-center">
              <Avatar state={avatarState} />
              {topic && (
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">Current Topic</p>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{topic}</p>
                  {difficulty && (
                    <span className={`badge mt-2.5 inline-block ${difficultyClasses(difficulty)}`}>
                      {capitalize(difficulty)} Level
                    </span>
                  )}
                </div>
              )}
              {/* Active language indicator */}
              <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                🌐 {currentLangLabel}
              </div>
            </div>

            {/* Quick Actions */}
            {explanation && (
              <div className="card w-full space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tutor Assistance</p>
                <button
                  onClick={() => explainTopic(topic)}
                  className="btn-ghost text-xs w-full justify-start text-left border border-slate-100 py-2.5 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  🔁 Explain Again
                </button>
                <button
                  onClick={() => explainTopic(topic, 'Please explain this more simply with an easy everyday analogy.')}
                  className="btn-ghost text-xs w-full justify-start text-left border border-slate-100 py-2.5 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  🐢 Explain Simply
                </button>
                <button
                  onClick={() => explainTopic(topic, 'Give me a concrete real-world code or practical example.')}
                  className="btn-ghost text-xs w-full justify-start text-left border border-slate-100 py-2.5 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  💡 Give Example
                </button>
                <button
                  onClick={handleFetchDiagram}
                  className={`btn-ghost text-xs w-full justify-start text-left border border-slate-100 py-2.5 transition-colors ${
                    activeTab === 'diagram' ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  📊 Show Flowchart
                </button>
                <button
                  onClick={handleGenerateNotes}
                  className="btn-ghost text-xs w-full justify-start text-left border border-slate-100 py-2.5 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                >
                  📝 Save into Notes
                </button>
              </div>
            )}
          </div>

          {/* ── CENTER COLUMN: Lesson & Diagram Area ──────────────────────── */}
          <div className="min-w-0">
            {loading ? (
              <div className="card h-full flex flex-col gap-5 p-8">
                <div className="flex items-center gap-3 text-primary-600">
                  <span className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  <span className="text-sm font-semibold animate-pulse">LearnIQ Tutor is preparing your lesson…</span>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="skeleton h-40 w-full rounded-xl" />
                  <div className="skeleton h-6 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-5/6 rounded" />
                  <div className="skeleton h-4 w-11/12 rounded" />
                  <div className="skeleton h-20 w-full rounded-xl mt-4" />
                </div>
              </div>
            ) : explanation ? (
              <div className="card animate-fade-in flex flex-col h-full">
                {/* Header: tabs + voice */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">📖</div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">{topic}</h2>
                      <p className="text-xs text-slate-400">Adaptive AI Lesson · {currentLangLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium">
                      <button
                        onClick={() => setActiveTab('explanation')}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === 'explanation'
                            ? 'bg-white text-slate-800 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📄 Lesson
                      </button>
                      <button
                        onClick={handleFetchDiagram}
                        className={`px-3 py-1.5 rounded-lg transition-all ${
                          activeTab === 'diagram'
                            ? 'bg-white text-slate-800 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📊 Flowchart
                      </button>
                    </div>
                    {/* Audio read-aloud — passes lang for Indian voice */}
                    <VoiceControls
                      lang={lang}
                      textToRead={explanation}
                      onSpeakingStateChange={setAvatarState}
                    />
                  </div>
                </div>

                {/* Content View */}
                {activeTab === 'explanation' ? (
                  <div className="overflow-y-auto flex-1 pr-1">
                    {/* Topic Image at top of lesson */}
                    <TopicImage topic={topic} />
                    <AIContent text={explanation} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center">
                    {diagramLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <span className="w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                        <p className="text-xs text-slate-500 font-medium">Generating visual diagram...</p>
                      </div>
                    ) : diagramCode ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Flow & Logic Diagram</span>
                          <button onClick={handleFetchDiagram} className="text-xs text-primary-600 hover:underline">
                            🔄 Regenerate Diagram
                          </button>
                        </div>
                        <MermaidViewer chart={diagramCode} />
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm text-slate-500 mb-3">No diagram generated yet.</p>
                        <button onClick={handleFetchDiagram} className="btn-primary text-xs px-4 py-2">
                          ✨ Generate Visual Flowchart
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="card h-full flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed border-slate-200">
                <div className="text-6xl mb-4 animate-bounce-gentle">🤖</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">What would you like to master today?</h2>
                <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
                  Enter a topic or speak into your mic. LearnIQ explains in your language with images, diagrams, and flash notes.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {['Neural Networks', 'Binary Search Trees', 'Photosynthesis', 'GST & Taxation', 'Time Complexity & Big-O'].map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTopicInput(t); explainTopic(t) }}
                      className="badge badge-primary cursor-pointer hover:bg-primary-200 transition-all text-xs px-3 py-1.5 shadow-sm"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Key Takeaways ─────────────────────────────── */}
          <div>
            {explanation && keyPoints.length > 0 ? (
              <div className="card animate-slide-up bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-teal-600 text-base">🎯</span>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Key Takeaways</p>
                </div>
                <ul className="space-y-3">
                  {keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="card bg-slate-50/50 border border-slate-100 text-center py-8">
                <p className="text-xs text-slate-400">Key bullet points and summary will appear here as you learn.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM BAR: Ask Follow-up ─────────────────────────────────── */}
        {topic && (
          <div className="bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sticky bottom-0 z-10 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <input
                type="text"
                placeholder={`Ask any doubt about ${topic}… (in ${currentLangLabel})`}
                className="input-field flex-1"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <VoiceControls
                lang={lang}
                onTranscript={(text) => { setQuestion(text); explainTopic(topic, text); setQuestion('') }}
                onSpeakingStateChange={setAvatarState}
              />
              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="btn-primary px-5 flex-shrink-0"
              >
                Ask Tutor
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
