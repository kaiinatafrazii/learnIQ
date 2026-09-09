// hooks/AuthProvider.jsx — JSX-bearing auth provider (separate from useAuth.js)

import { useState, useEffect } from 'react'
import { AuthContext } from './useAuth'
import api from '../services/api'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('learniq_token')
    const savedUser  = localStorage.getItem('learniq_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { token: t, user: u } = res.data
    localStorage.setItem('learniq_token', t)
    localStorage.setItem('learniq_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
    return u
  }

  const register = async (name, email, password, education_level) => {
    const res = await api.post('/api/auth/register', { name, email, password, education_level })
    const { token: t, user: u } = res.data
    localStorage.setItem('learniq_token', t)
    localStorage.setItem('learniq_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('learniq_token')
    localStorage.removeItem('learniq_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
