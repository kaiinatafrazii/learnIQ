// pages/Signup.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'

const EDUCATION_LEVELS = [
  { value: 'school', label: 'School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'undergraduate', label: 'Undergraduate' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'other', label: 'Other' },
]

function SignupField({ id, label, type = 'text', placeholder, field, autoComplete, value, error, showPassword, onChange, onTogglePassword }) {
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
          className={`input-field ${isPasswordField ? 'pr-10' : ''} ${error ? 'border-danger-400 focus:ring-danger-300' : ''}`}
          value={value}
          onChange={onChange}
        />
        {isPasswordField && (
          <button
            type="button"
            id="signup-toggle-password-visibility"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '◉' : '◌'}
          </button>
        )}
      </div>
      {error && <p className="text-danger-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function Signup() {
  const { register } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', education_level: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = {}
    if (!form.name.trim()) validationErrors.name = 'Name is required.'
    if (!form.email) validationErrors.email = 'Email is required.'
    if (form.password.length < 6) validationErrors.password = 'Password must be at least 6 characters.'
    if (!form.education_level) validationErrors.education_level = 'Please select your education level.'
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.education_level)
      addToast('Account created! Welcome to LearnIQ! 🎉', 'success')
      navigate('/dashboard')
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.'
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-white flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-100 rounded-full blur-3xl opacity-30" />
      </div>
      <div className="relative w-full max-w-md animate-fade-in">
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
            <SignupField id="name" label="Full Name" field="name" placeholder="Your name" autoComplete="name" value={form.name} error={errors.name} onChange={updateField('name')} />
            <SignupField id="email" label="Email" field="email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} error={errors.email} onChange={updateField('email')} />
            <SignupField id="password" label="Password" field="password" type="password" placeholder="Min. 6 characters" autoComplete="new-password" value={form.password} error={errors.password} showPassword={showPassword} onTogglePassword={() => setShowPassword((current) => !current)} onChange={updateField('password')} />
            <div>
              <label htmlFor="education_level" className="label">Education Level</label>
              <select id="education_level" className={`input-field ${errors.education_level ? 'border-danger-400' : ''}`} value={form.education_level} onChange={updateField('education_level')}>
                <option value="">Select your level…</option>
                {EDUCATION_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
              </select>
              {errors.education_level && <p className="text-danger-500 text-xs mt-1">{errors.education_level}</p>}
            </div>
            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Creating account…' : 'Create Account 🚀'}
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
