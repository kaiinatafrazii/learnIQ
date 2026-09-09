// components/Navbar.jsx — Public landing page navbar

import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            L
          </div>
          <span className="font-bold text-slate-900 text-lg">LearnIQ</span>
        </Link>

        {/* Nav Links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">How It Works</a>
          <a href="#features"     className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">Features</a>
          <a href="#chatbot"      className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">AI Chat</a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login"  className="btn-ghost text-sm hidden sm:inline-flex">Log In</Link>
          <Link to="/signup" className="btn-primary text-sm">Start Learning</Link>
        </div>
      </div>
    </nav>
  )
}
