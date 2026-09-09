// pages/LandingPage.jsx — Full 10-section public landing page

import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

/* ── Feature sections data ─────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { step: '01', icon: '🧠', title: 'Learn', desc: 'AI explains any topic at your exact level with diagrams and examples.' },
  { step: '02', icon: '📝', title: 'Notes', desc: 'Structured notes are auto-generated after every lesson — no note-taking needed.' },
  { step: '03', icon: '✏️', title: 'Test', desc: 'Take adaptive MCQ quizzes generated to match your current mastery.' },
  { step: '04', icon: '🚀', title: 'Improve', desc: 'Get specific feedback on weak concepts and let the AI adapt to you.' },
]

const FEATURES = [
  {
    icon: '👨‍🏫',
    title: 'AI Teacher',
    desc: 'An animated AI teacher explains topics in your style — simple, technical, or with examples.',
    color: 'from-primary-500 to-primary-600',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-lg">🤖</div>
          <span className="text-xs font-semibold text-slate-500">AI Tutor • Speaking</span>
        </div>
        <p className="text-slate-700 italic">"Think of a CNN like a flashlight scanning a photo — each scan detects a different pattern like edges or colors."</p>
      </div>
    ),
  },
  {
    icon: '📊',
    title: 'Visual Diagrams',
    desc: 'Complex topics become clear through auto-generated flowcharts and visual boards.',
    color: 'from-secondary-500 to-secondary-600',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm font-mono text-xs">
        <div className="text-center text-slate-500 mb-2 font-sans font-semibold text-sm">CNN Pipeline</div>
        <div className="flex flex-col items-center gap-1">
          {['Input Image', 'Convolution', 'Feature Map', 'Pooling', 'Classification'].map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1 rounded-lg text-xs">{step}</div>
              {i < 4 && <div className="text-slate-300 text-xs">↓</div>}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: '📋',
    title: 'Smart Notes',
    desc: 'Every lesson generates beautiful structured notes: definition, examples, key concepts, revision.',
    color: 'from-accent-500 to-accent-600',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm">
        <p className="font-bold text-slate-800 mb-2">📋 Backpropagation</p>
        <p className="text-xs text-slate-500 font-semibold mb-1">## Definition</p>
        <p className="text-xs text-slate-600 mb-2">An algorithm that computes gradients to update neural network weights.</p>
        <p className="text-xs text-slate-500 font-semibold mb-1">## Key Concepts</p>
        <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
          <li>Chain rule of differentiation</li>
          <li>Loss function gradient</li>
          <li>Weight update step</li>
        </ul>
      </div>
    ),
  },
  {
    icon: '🎯',
    title: 'Adaptive Quiz',
    desc: 'AI-generated MCQs that match your level — easier when you\'re learning, harder as you grow.',
    color: 'from-danger-400 to-danger-500',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500">Question 3 of 5</span>
          <span className="badge badge-warning">Medium</span>
        </div>
        <p className="text-slate-700 font-medium text-xs mb-3">What does the pooling layer do in a CNN?</p>
        {['Adds more layers', 'Reduces spatial dimensions', 'Applies activation', 'Computes loss'].map((opt, i) => (
          <div key={i} className={`px-3 py-1.5 rounded-lg text-xs mb-1 border ${i === 1 ? 'bg-secondary-50 border-secondary-300 text-secondary-700' : 'border-slate-100 text-slate-600'}`}>
            {String.fromCharCode(65+i)}. {opt}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '📈',
    title: 'Performance Tracking',
    desc: 'See exactly which concepts you\'re strong in and which need more practice — not just a score.',
    color: 'from-primary-400 to-secondary-500',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm">
        <p className="text-xs font-semibold text-slate-500 mb-2">Topic Mastery</p>
        {[['CNN', 90, 'secondary'], ['Transformers', 75, 'accent'], ['Backprop', 55, 'danger']].map(([t, v, c]) => (
          <div key={t} className="mb-2">
            <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-700">{t}</span><span className="font-medium">{v}%</span></div>
            <div className="h-1.5 bg-slate-100 rounded-full"><div className={`h-full rounded-full bg-${c}-500`} style={{width:`${v}%`}}/></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '💬',
    title: 'AI Chatbot',
    desc: 'Short, direct answers to quick questions. No long essays — just what you need, when you need it.',
    color: 'from-violet-500 to-primary-500',
    sample: (
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-sm space-y-2">
        <div className="chat-bubble-user w-fit ml-auto">What is overfitting?</div>
        <div className="chat-bubble-ai">
          Overfitting is when a model memorizes training data instead of learning patterns, so it performs poorly on new data. Think of it like memorizing exam answers instead of understanding the subject.
        </div>
        <div className="flex gap-2 mt-2">
          <button className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100">Explain deeply</button>
          <button className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 border border-primary-100">Give example</button>
        </div>
      </div>
    ),
  },
]

/* ── Component ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 overflow-hidden relative">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-sm text-primary-700 font-medium mb-6">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse-slow" />
                AI-Powered • Adaptive • Personal
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Learn Smarter with<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                  Your Personal AI Tutor
                </span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                Understand concepts, visualize ideas, practice with quizzes, and improve with a tutor that adapts to your learning level.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup" className="btn-primary text-base px-8 py-3 text-center">
                  🚀 Start Learning
                </Link>
                <Link to="/login" className="btn-secondary text-base px-8 py-3 text-center">
                  Try AI Tutor
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">10+</p>
                  <p className="text-xs text-slate-400">Topics</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">AI</p>
                  <p className="text-xs text-slate-400">Adaptive</p>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">Free</p>
                  <p className="text-xs text-slate-400">To Start</p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 flex justify-center lg:justify-end animate-slide-up">
              <div className="relative w-full max-w-sm">
                {/* Main card */}
                <div className="card shadow-xl border-0 bg-gradient-to-br from-primary-50 to-white p-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-3xl shadow-md animate-bounce-gentle">
                      🤖
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">AI Tutor</p>
                      <span className="badge badge-success text-xs">● Speaking</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-primary-100 text-sm text-slate-700 italic mb-4 shadow-sm">
                    "Let's understand Backpropagation using a simple cooking analogy — adjusting a recipe based on feedback!"
                  </div>
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Topic Progress</span><span>68%</span></div>
                    <div className="h-2 bg-primary-100 rounded-full"><div className="h-full w-[68%] bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" /></div>
                  </div>
                </div>

                {/* Floating stat cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-slate-100 text-sm">
                  <p className="text-2xl font-bold text-secondary-600">82%</p>
                  <p className="text-xs text-slate-400">Quiz Accuracy</p>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-slate-100 text-sm">
                  <p className="text-2xl font-bold text-accent-600">🔥 5</p>
                  <p className="text-xs text-slate-400">Day Streak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How LearnIQ Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">A complete learning loop that adapts to you — from explanation to improvement.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card text-center group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
                <div className="text-xs font-bold text-primary-400 mb-1">STEP {item.step}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Arrow flow indicator */}
          <div className="hidden lg:flex items-center justify-center gap-4 mt-8 text-slate-400 text-sm">
            <span className="badge badge-primary">LEARN</span>
            <span>→</span>
            <span className="badge badge-success">NOTES</span>
            <span>→</span>
            <span className="badge badge-warning">TEST</span>
            <span>→</span>
            <span className="badge badge-danger">ANALYZE</span>
            <span>→</span>
            <span className="badge badge-primary">ADAPT</span>
            <span>→</span>
            <span className="badge badge-success">IMPROVE</span>
          </div>
        </div>
      </section>

      {/* ── 3–8. Features Grid ───────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything You Need to Learn</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Six powerful features built to take you from confused to confident.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                id={feature.title.toLowerCase().replace(/\s+/g, '-')}
                className="card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl shadow-md mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm mb-6 flex-1">{feature.desc}</p>

                {/* Live Preview */}
                {feature.sample}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-400/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Start Learning Smarter Today
          </h2>
          <p className="text-primary-200 text-lg mb-8">
            Join students who are learning faster with an AI tutor that actually adapts to them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
            >
              🚀 Create Free Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-center"
            >
              Log In
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">L</div>
              <div>
                <p className="font-bold text-white">LearnIQ</p>
                <p className="text-xs">AI-Powered Adaptive Learning</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <Link to="/login" className="hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs">© 2025 LearnIQ. Built for learners.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
