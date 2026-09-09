// pages/NotesPage.jsx — Smart Notes with search, edit, delete

import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../components/Toast'
import { formatDate, truncate } from '../utils/formatters'
import api from '../services/api'

function NoteModal({ note, onClose, onSave }) {
  const [title,   setTitle]   = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving,  setSaving]  = useState(false)
  const { addToast } = useToast()

  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/api/notes/${note.id}`, { title, content })
      addToast('Note updated!', 'success')
      onSave({ ...note, title, content })
    } catch {
      addToast('Could not save note.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const download = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${title}.md`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <input
            className="font-bold text-slate-900 text-lg flex-1 bg-transparent outline-none"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="flex items-center gap-2 ml-4">
            <button onClick={download} className="btn-ghost text-xs border border-slate-200 py-1.5 px-3">⬇ Download</button>
            <button onClick={save} disabled={saving} className="btn-primary text-xs py-1.5 px-4">
              {saving ? '…' : 'Save'}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1">✕</button>
          </div>
        </div>
        <textarea
          className="flex-1 px-6 py-4 text-sm text-slate-700 resize-none outline-none font-mono leading-relaxed overflow-auto"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  )
}

export default function NotesPage() {
  const { addToast } = useToast()
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [active,  setActive]  = useState(null)

  useEffect(() => {
    api.get('/api/notes')
      .then(res => setNotes(res.data.notes || []))
      .catch(() => addToast('Could not load notes.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const deleteNote = async (id) => {
    if (!confirm('Delete this note?')) return
    try {
      await api.delete(`/api/notes/${id}`)
      setNotes(ns => ns.filter(n => n.id !== id))
      addToast('Note deleted.', 'info')
    } catch {
      addToast('Could not delete note.', 'error')
    }
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.topic_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {active && (
        <NoteModal
          note={active}
          onClose={() => setActive(null)}
          onSave={(updated) => {
            setNotes(ns => ns.map(n => n.id === updated.id ? updated : n))
            setActive(null)
          }}
        />
      )}

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="section-title">📝 My Notes</h1>
              <p className="section-subtitle">{notes.length} note{notes.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search notes…"
            className="input-field mb-6"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-base font-medium text-slate-600 mb-1">No notes yet</p>
              <p className="text-sm">Complete an AI lesson to auto-generate your first notes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(note => (
                <div key={note.id} className="card-hover flex flex-col gap-3 group relative">
                  <div onClick={() => setActive(note)}>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="badge badge-primary text-xs">{note.topic_name || 'General'}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{note.title}</h3>
                    <p className="text-slate-400 text-xs">{truncate(note.content?.replace(/[#*>`-]/g, ''), 100)}</p>
                    <p className="text-xs text-slate-300 mt-3">Updated {formatDate(note.updated_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-danger-500 text-xs p-1"
                    aria-label="Delete note"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
