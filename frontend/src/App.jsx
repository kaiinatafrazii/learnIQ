// App.jsx — Router setup with protected routes

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/AuthProvider'
import { useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/Toast'

import LandingPage     from './pages/LandingPage'
import Login           from './pages/Login'
import Signup          from './pages/Signup'
import Dashboard       from './pages/Dashboard'
import TutorPage       from './pages/TutorPage'
import NotesPage       from './pages/NotesPage'
import QuizPage        from './pages/QuizPage'
import ProgressPage    from './pages/ProgressPage'
import ChatPage        from './pages/ChatPage'

/* ── Protected Route wrapper ──────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading LearnIQ…</p>
        </div>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

/* ── Public Route wrapper — redirect to dashboard if already logged in ── */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login"  element={<PublicRoute><Login  /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard    /></ProtectedRoute>} />
            <Route path="/tutor"     element={<ProtectedRoute><TutorPage    /></ProtectedRoute>} />
            <Route path="/notes"     element={<ProtectedRoute><NotesPage    /></ProtectedRoute>} />
            <Route path="/quiz"      element={<ProtectedRoute><QuizPage     /></ProtectedRoute>} />
            <Route path="/progress"  element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/chat"      element={<ProtectedRoute><ChatPage     /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
