// pages/Signup.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

const EDUCATION_LEVELS = [
  { value: 'school',         label: 'School' },
  { value: 'diploma',        label: 'Diploma' },
  { value: 'undergraduate',  label: 'Undergraduate' },
  { value: 'graduate',       label: 'Graduate' },
  { value: 'other',          label: 'Other' },
]

export default function Signup() {
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm]               = useState({ name: '', email: '', password: '', education_level: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim())        e.name            = 'Name is required.'
    if (!form.email)              e.email           = 'Email is required.'
    if (form.password.length < 6) e.password        = 'Password must be at least 6 characters.'
    if (!form.education_level)    e.education_level = 'Please select your education level.'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.education_level)
      addToast('Account created! Welcome to LearnIQ! 🎉', 'success')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.'
      addToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ id, label, type = 'text', placeholder, field, autoComplete }) => {
    const isPasswordField = field === 'password'
    const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type

    return (
      <div>
        <label htmlFor={id} className="label">{label}</label>
        <div className={isPasswordField ? 'relative' : ''}>
          <input
            id={id}
            type={inputType}
            autoComplete={autoComplete}
            placeholder={placeholder}
            className={`input-field ${isPasswordField ? 'pr-10' : ''} ${errors[field] ? 'border-danger-400 focus:ring-danger-300' : ''}`}
            value={form[field]}
            onChange={(e) => { setForm(f => ({...f, [field]: e.target.value})); setErrors(er => ({...er, [field]: ''})) }}
          />
          {isPasswordField && (
            <button
              type="button"
              id="signup-toggle-password-visibility"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {errors[field] && <p className="text-danger-500 text-xs mt-1">{errors[field]}</p>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">L</div>
            <span className="font-bold text-slate-900 text-xl">LearnIQ</span>
          </Link>
        </div>

        <div className="card shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Start learning smarter with your personal AI tutor.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Field id="name"     label="Full Name"   field="name"     placeholder="Your name"       autoComplete="name" />
            <Field id="email"    label="Email"        field="email"    type="email" placeholder="you@example.com" autoComplete="email" />
            <Field id="password" label="Password"     field="password" type="password" placeholder="Min. 6 characters" autoComplete="new-password" />

            {/* Education Level */}
            <div>
              <label htmlFor="education_level" className="label">Education Level</label>
              <select
                id="education_level"
                className={`input-field ${errors.education_level ? 'border-danger-400' : ''}`}
                value={form.education_level}
                onChange={(e) => { setForm(f => ({...f, education_level: e.target.value})); setErrors(er => ({...er, education_level: ''})) }}
              >
                <option value="">Select your level…</option>
                {EDUCATION_LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              {errors.education_level && <p className="text-danger-500 text-xs mt-1">{errors.education_level}</p>}
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account 🚀'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
