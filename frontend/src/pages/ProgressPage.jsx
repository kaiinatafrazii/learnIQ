// pages/ProgressPage.jsx — Chart.js visualizations

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import api from '../services/api'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement)

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } },
  },
}

export default function ProgressPage() {
  const { addToast } = useToast()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/progress')
      .then(res => setData(res.data))
      .catch(() => addToast('Could not load progress data.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const topicMastery = data?.topic_mastery || []
  const quizHistory  = data?.quiz_history  || []
  const streak       = data?.streak || 0

  // Chart data
  const masteryChart = {
    labels: topicMastery.map(t => t.topic_name),
    datasets: [{
      data:            topicMastery.map(t => t.mastery_score),
      backgroundColor: topicMastery.map(t =>
        t.mastery_score >= 80 ? '#14b8a6' : t.mastery_score >= 50 ? '#f59e0b' : '#f43f5e'
      ),
      borderRadius: 8,
    }],
  }

  const accuracyChart = {
    labels: quizHistory.map(q => `${q.topic_name} (${q.date})`),
    datasets: [{
      data:        quizHistory.map(q => q.accuracy),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.3,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 4,
    }],
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="section-title mb-1">📊 My Progress</h1>
          <p className="section-subtitle mb-8">Track your mastery, quiz accuracy, and learning streak.</p>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Streak + Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="card text-center">
                  <div className="text-3xl font-extrabold text-accent-600 mb-1">🔥 {streak}</div>
                  <div className="text-xs text-slate-400">Day Streak</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-extrabold text-primary-600 mb-1">{topicMastery.length}</div>
                  <div className="text-xs text-slate-400">Topics Tracked</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-extrabold text-secondary-600 mb-1">
                    {topicMastery.filter(t => t.mastery_score >= 80).length}
                  </div>
                  <div className="text-xs text-slate-400">Mastered</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-extrabold text-danger-600 mb-1">
                    {topicMastery.filter(t => t.mastery_score < 60).length}
                  </div>
                  <div className="text-xs text-slate-400">Need Work</div>
                </div>
              </div>

              {/* Topic Mastery Bar Chart */}
              {topicMastery.length > 0 && (
                <div className="card mb-6">
                  <h2 className="font-bold text-slate-800 mb-6">Topic Mastery</h2>
                  <Bar
                    data={masteryChart}
                    options={{
                      ...chartDefaults,
                      scales: {
                        y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } },
                      },
                    }}
                    height={80}
                  />
                </div>
              )}

              {/* Quiz Accuracy Line Chart */}
              {quizHistory.length > 1 && (
                <div className="card mb-6">
                  <h2 className="font-bold text-slate-800 mb-6">Quiz Accuracy Over Time</h2>
                  <Line
                    data={accuracyChart}
                    options={{
                      ...chartDefaults,
                      plugins: { ...chartDefaults.plugins, tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}%` } } },
                      scales: { y: { min: 0, max: 100, ticks: { callback: v => `${v}%` } } },
                    }}
                    height={80}
                  />
                </div>
              )}

              {/* Weak vs Strong */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="card">
                  <h2 className="font-bold text-secondary-700 mb-4">✅ Strong Topics</h2>
                  {topicMastery.filter(t => t.mastery_score >= 80).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topicMastery.filter(t => t.mastery_score >= 80).map(t => (
                        <div key={t.topic_id} className="flex items-center gap-2 badge badge-success">
                          <span>{t.topic_name}</span>
                          <span className="font-bold">{Math.round(t.mastery_score)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-slate-400 text-sm">Keep learning to build strong topics!</p>}
                </div>
                <div className="card">
                  <h2 className="font-bold text-danger-700 mb-4">⚠️ Needs Practice</h2>
                  {topicMastery.filter(t => t.mastery_score < 60).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {topicMastery.filter(t => t.mastery_score < 60).map(t => (
                        <div key={t.topic_id} className="flex items-center gap-2 badge badge-danger">
                          <span>{t.topic_name}</span>
                          <span className="font-bold">{Math.round(t.mastery_score)}%</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-slate-400 text-sm">No weak topics — great work! 🎉</p>}
                </div>
              </div>

              {topicMastery.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="font-medium text-slate-600 mb-1">No data yet</p>
                  <p className="text-sm">Complete a quiz to see your progress charts.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
