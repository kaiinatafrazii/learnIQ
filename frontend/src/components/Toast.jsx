// components/Toast.jsx — Global toast notification

import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium
              animate-slide-up backdrop-blur-sm
              ${toast.type === 'error'   ? 'bg-danger-50  border-danger-200  text-danger-800'  : ''}
              ${toast.type === 'success' ? 'bg-secondary-50 border-secondary-200 text-secondary-800' : ''}
              ${toast.type === 'info'    ? 'bg-primary-50 border-primary-200 text-primary-800'  : ''}
              ${toast.type === 'warning' ? 'bg-accent-50  border-accent-200  text-accent-800'   : ''}
            `}
          >
            {/* Icon */}
            <span className="text-base flex-shrink-0">
              {toast.type === 'error'   && '⚠️'}
              {toast.type === 'success' && '✅'}
              {toast.type === 'info'    && 'ℹ️'}
              {toast.type === 'warning' && '⚡'}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
