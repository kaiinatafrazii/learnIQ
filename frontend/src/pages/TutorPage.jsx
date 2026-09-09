// pages/TutorPage.jsx — AI Tutor with Voice, Avatar, Visual Diagrams, Notes & Adaptive Explanations

import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import MermaidViewer from '../components/MermaidViewer'
import VoiceControls from '../components/VoiceControls'
import { useToast } from '../components/Toast'
import { capitalize, difficultyClasses } from '../utils/formatters'
import api from '../services/api'

/* ── Interactive Avatar Component ─────────────────────────────────────────── */
function Avatar({ state }) {
  const stateConfig = {
    idle:      { emoji: '🤖', label: 'Ready',     bg: 'bg-primary-100 ring-primary-200', pulse: false },
    speaking:  { emoji: '🗣️', label: 'Speaking',  bg: 'bg-secondary-100 ring-teal-300',  pulse: true  },
    thinking:  { emoji: '🤔', label: 'Thinking',  bg: 'bg-accent-100 ring-amber-300',   pulse: true   },
    listening: { emoji: '👂', label: 'Listening', bg: 'bg-rose-100 ring-rose-300',      pulse: true   },
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
          state === 'speaking'
            ? 'badge-success'
            : state === 'thinking'
            ? 'badge-warning'
            : state === 'listening'
            ? 'bg-rose-100 text-rose-700'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        ● {cfg.label}
      </span>
    </div>
  )
}

/* ── Structured AI Content Renderer ──────────────────────────────────────── */
function AIContent({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="ai-content space-y-1.5 leading-relaxed text-slate-700">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-900 mt-4 mb-2">{line.slice(3)}</h2>
        if (line.startsWith('# '))  return <h1 key={i} className="text-xl font-extrabold text-slate-900 mt-4 mb-2">{line.slice(2)}</h1>
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-slate-800 mt-3 mb-1">{line.slice(4)}</h3>
        if (line.startsWith('- ')  || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4 list-disc text-slate-700 my-0.5">
              {line.slice(2)}
            </li>
          )
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={i} className="border-l-4 border-primary-500 bg-primary-50/50 p-3 rounded-r-lg my-3 text-slate-700 italic">
              {line.slice(2)}
            </blockquote>
          )
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <strong key={i} className="block mt-3 text-slate-900 font-semibold">{line.slice(2, -2)}</strong>
        }
        if (line.trim() === '') return <div key={i} className="h-2" />
        return <p key={i} className="text-slate-700">{line}</p>
      })}
    </div>
  )
}

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
  const [activeTab, setActiveTab] = useState('explanation') // 'explanation' | 'diagram'
  const [question, setQuestion] = useState('')
  const inputRef = useRef(null)

  // Auto-load if topic was passed from dashboard
  useEffect(() => {
    if (location.state?.topic) explainTopic(location.state.topic)
  }, [])

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
      })
      const d = res.data
      setExplanation(d.explanation)
      setKeyPoints(d.key_points || [])
      setDifficulty(d.difficulty)
      setTopicId(d.topic_id)
      setSessionId(d.session_id)
      setTopic(topicName)
      setAvatarState('speaking')
      // Auto-revert avatar state after initial announcement
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
    if (diagramCode) return // Already loaded

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
      await api.post('/api/tutor/notes', {
        topic,
        explanation,
        topic_id: topicId,
      })
      addToast('Notes saved successfully! Check your Notes page. 📝', 'success')
    } catch (err) {
      addToast(err.response?.data?.error || 'Could not save notes.', 'error')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0 flex flex-col">
        {/* Topic input bar */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter any topic to learn (e.g., Backpropagation, Linked Lists, Photosynthesis)…"
                className="input-field pr-12 w-full"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && explainTopic(topicInput)}
              />
            </div>
            {/* Voice Input for topic search */}
            <VoiceControls
              onTranscript={(text) => {
                setTopicInput(text)
                explainTopic(text)
              }}
              onSpeakingStateChange={setAvatarState}
            />
            <button
              onClick={() => explainTopic(topicInput)}
              disabled={loading || !topicInput.trim()}
              className="btn-primary px-6 flex-shrink-0"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                '🚀 Learn'
              )}
            </button>
          </div>
        </div>

        {/* Main 3-column layout */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr_240px] gap-6">

          {/* ── LEFT COLUMN: Avatar & Quick Actions ───────────────────── */}
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
            </div>

            {/* Quick Actions / Tutor Controls */}
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

          {/* ── CENTER COLUMN: Lesson & Diagram Area ──────────────────── */}
          <div className="min-w-0">
            {loading ? (
              <div className="card h-full flex flex-col gap-5 p-8">
                <div className="flex items-center gap-3 text-primary-600">
                  <span className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  <span className="text-sm font-semibold animate-pulse">LearnIQ Tutor is structuring your personalized lesson…</span>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="skeleton h-6 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-5/6 rounded" />
                  <div className="skeleton h-4 w-11/12 rounded" />
                  <div className="skeleton h-20 w-full rounded-xl mt-4" />
                </div>
              </div>
            ) : explanation ? (
              <div className="card animate-fade-in flex flex-col h-full">
                {/* Header with Switcher Tabs & Voice playback */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
                      📖
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-base">{topic}</h2>
                      <p className="text-xs text-slate-400">Adaptive AI Lesson</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher Tabs */}
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

                    {/* Audio read-aloud */}
                    <VoiceControls
                      textToRead={explanation}
                      onSpeakingStateChange={setAvatarState}
                    />
                  </div>
                </div>

                {/* Content View */}
                {activeTab === 'explanation' ? (
                  <div className="overflow-y-auto flex-1 pr-1">
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
                          <button
                            onClick={handleFetchDiagram}
                            className="text-xs text-primary-600 hover:underline"
                          >
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
                  Enter a topic or speak into your mic. LearnIQ breaks down complex concepts into step-by-step explanations, visual diagrams, and flash notes tailored to your level.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {['Neural Networks', 'Binary Search Trees', 'Object-Oriented Programming', 'Time Complexity & Big-O'].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTopicInput(t)
                        explainTopic(t)
                      }}
                      className="badge badge-primary cursor-pointer hover:bg-primary-200 transition-all text-xs px-3 py-1.5 shadow-sm"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Key Takeaways & Summary ─────────────────── */}
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

        {/* ── BOTTOM BAR: Ask Follow-up Question ──────────────────────── */}
        {topic && (
          <div className="bg-white border-t border-slate-100 px-4 sm:px-6 py-3 sticky bottom-0 z-10 shadow-lg">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <input
                type="text"
                placeholder={`Ask any doubt or follow-up question about ${topic}…`}
                className="input-field flex-1"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <VoiceControls
                onTranscript={(text) => {
                  setQuestion(text)
                  explainTopic(topic, text)
                  setQuestion('')
                }}
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
