// pages/Dashboard.jsx — Student dashboard with stats, recommendations, recent activity

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import TopicCard from '../components/TopicCard'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { getGreeting, capitalize, formatDate } from '../utils/formatters'
import api from '../services/api'

function SkeletonCard() {
  return <div className="card"><div className="skeleton h-20 w-full" /></div>
}

export default function Dashboard() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get('/api/dashboard')
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(() => { if (!cancelled) addToast('Could not load dashboard data.', 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const stats = data?.stats || {}
  const profile = data?.profile || {}
  const recentSessions = data?.recent_sessions || []
  const recentQuizzes = data?.recent_quizzes || []
  const topicProgress = data?.topic_progress || []

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

          {/* ── Welcome Banner ──────────────────────────────────────────── */}
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <h1 className="text-2xl font-bold">{getGreeting(data?.user?.name || user?.name)}</h1>
                <p className="text-primary-200 text-sm mt-1">
                  Ready to learn something new today?
                  {data?.last_topic && ` You were last studying `}
                  {data?.last_topic && <strong className="text-white">{data.last_topic}</strong>}
                </p>
              </div>
              {data?.last_topic && (
                <button
                  onClick={() => navigate('/tutor')}
                  className="bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-all duration-200 text-sm flex-shrink-0 shadow-sm"
                >
                  Continue Learning →
                </button>
              )}
            </div>
          </div>

          {/* ── Stats Row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              <>
                <StatCard icon="📚" label="Topics Completed" value={stats.topics_completed ?? 0} color="primary" />
                <StatCard icon="🎯" label="Quiz Accuracy"    value={`${stats.quiz_accuracy ?? 0}%`} color="success" />
                <StatCard icon="⏱️" label="Learning Time"    value={`${stats.learning_time_hours ?? 0}h`} color="warning" />
                <StatCard icon="🔥" label="Day Streak"       value={`${stats.streak_days ?? 0} days`} color="danger" />
              </>
            )}
          </div>

          {/* ── Main Grid ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Recommended + Recent Topics ─────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Recommended */}
              {data?.recommended_topic && (
                <div className="card border-2 border-accent-200 bg-accent-50/50 animate-slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-warning">⭐ Recommended for you</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-lg">Revise {data.recommended_topic}</h3>
                      <p className="text-slate-500 text-sm mt-1">Based on your recent quiz performance.</p>
                    </div>
                    <button
                      onClick={() => navigate('/tutor', { state: { topic: data.recommended_topic } })}
                      className="btn-primary text-sm flex-shrink-0"
                    >
                      Start →
                    </button>
                  </div>
                </div>
              )}

              {/* Recently Studied */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-800">Recently Studied</h2>
                  <button onClick={() => navigate('/tutor')} className="text-primary-600 text-sm font-medium hover:underline">+ New Topic</button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="text-sm">No lessons yet. Start your first topic!</p>
                    <button onClick={() => navigate('/tutor')} className="btn-primary mt-4 text-sm">Start Learning</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentSessions.slice(0, 4).map((s) => {
                      const progress = topicProgress.find(p => p.topic_id === s.topic_id)
                      return (
                        <TopicCard
                          key={s.id}
                          topic={s.topic_name}
                          category={s.category}
                          mastery={progress?.mastery_score}
                          difficulty={s.difficulty}
                          onClick={() => navigate('/tutor', { state: { topic: s.topic_name } })}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Quizzes */}
              {recentQuizzes.length > 0 && (
                <div className="card">
                  <h2 className="font-bold text-slate-800 mb-4">Recent Quiz Results</h2>
                  <div className="space-y-3">
                    {recentQuizzes.map((q) => {
                      const acc = q.total_questions ? Math.round(q.score / q.total_questions * 100) : 0
                      return (
                        <div key={q.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{q.topic_name}</p>
                            <p className="text-xs text-slate-400">{formatDate(q.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">{q.score}/{q.total_questions}</span>
                            <span className={`badge ${acc >= 80 ? 'badge-success' : acc >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                              {acc}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Profile + Weak Topics ──────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* Learning Profile */}
              <div className="card">
                <h2 className="font-bold text-slate-800 mb-4">Your Profile</h2>
                {loading ? (
                  <div className="skeleton h-24 w-full rounded-xl" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-500">Overall Mastery</span>
                      <span className="text-2xl font-bold text-primary-600">{Math.min(100, Math.round(profile.overall_mastery ?? 0))}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full mb-4">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, profile.overall_mastery ?? 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Current Level</span>
                      <span className={`badge ${profile.current_level === 'advanced' ? 'badge-danger' : profile.current_level === 'intermediate' ? 'badge-warning' : 'badge-success'}`}>
                        {capitalize(profile.current_level || 'beginner')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Weak Topics */}
              <div className="card">
                <h2 className="font-bold text-slate-800 mb-4">⚠️ Weak Topics</h2>
                {loading ? (
                  <div className="skeleton h-20 w-full rounded-xl" />
                ) : profile.weak_topics?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.weak_topics.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => navigate('/tutor', { state: { topic: t } })}
                        className="badge badge-danger hover:bg-danger-200 cursor-pointer transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm text-center py-4">No weak topics yet — keep learning! 🎉</p>
                )}
              </div>

              {/* Strong Topics */}
              {profile.strong_topics?.length > 0 && (
                <div className="card">
                  <h2 className="font-bold text-slate-800 mb-4">✅ Strong Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.strong_topics.map((t, i) => (
                      <span key={i} className="badge badge-success">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="card">
                <h2 className="font-bold text-slate-800 mb-4">Quick Actions</h2>
                <div className="flex flex-col gap-2">
                  <button onClick={() => navigate('/tutor')}    className="btn-primary text-sm w-full py-2.5">🤖 Start AI Lesson</button>
                  <button onClick={() => navigate('/quiz')}     className="btn-secondary text-sm w-full py-2.5">✏️ Take a Quiz</button>
                  <button onClick={() => navigate('/chat')}     className="btn-ghost text-sm w-full py-2.5 border border-slate-200">💬 Ask AI a Question</button>
                  <button onClick={() => navigate('/progress')} className="btn-ghost text-sm w-full py-2.5 border border-slate-200">📊 View Progress</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
