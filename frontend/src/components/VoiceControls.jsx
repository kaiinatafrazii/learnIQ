// components/VoiceControls.jsx — Voice input (Speech-to-Text) and audio playback
import { useState, useRef, useEffect } from 'react'
import { useToast } from './Toast'
import api from '../services/api'

export default function VoiceControls({ onTranscript, textToRead, onSpeakingStateChange }) {
  const { addToast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioPlayerRef = useRef(null)

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript && onTranscript) {
          onTranscript(transcript)
        }
        setIsRecording(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
      }

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error)
        setIsRecording(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
        if (event.error !== 'no-speech') {
          addToast('Could not recognize voice. Please try again or type.', 'error')
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
      }

      recognitionRef.current = recognition
    }
  }, [onTranscript, onSpeakingStateChange])

  // Start / Stop Microphone
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.error(e)
        }
      } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      if (onSpeakingStateChange) onSpeakingStateChange('idle')
      return
    }

    // Start recording
    if (recognitionRef.current) {
      try {
        setIsRecording(true)
        if (onSpeakingStateChange) onSpeakingStateChange('listening')
        recognitionRef.current.start()
      } catch (err) {
        console.error(err)
        setIsRecording(false)
      }
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Fallback to MediaRecorder API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.webm')

          try {
            const res = await api.post('/api/voice/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data?.text && onTranscript) {
              onTranscript(res.data.text)
            }
          } catch (err) {
            addToast('Voice transcription failed. You can type instead.', 'error')
          } finally {
            stream.getTracks().forEach((track) => track.stop())
            setIsRecording(false)
            if (onSpeakingStateChange) onSpeakingStateChange('idle')
          }
        }

        mediaRecorder.start()
        setIsRecording(true)
        if (onSpeakingStateChange) onSpeakingStateChange('listening')
      } catch (err) {
        addToast('Microphone access denied or not available.', 'error')
      }
    } else {
      addToast('Voice input is not supported in this browser.', 'error')
    }
  }

  // Play / Pause Text-to-Speech
  const toggleSpeech = async () => {
    if (isPlaying) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current = null
      }
      setIsPlaying(false)
      if (onSpeakingStateChange) onSpeakingStateChange('idle')
      return
    }

    if (!textToRead) return

    // Clean markdown symbols for cleaner speech
    const cleanText = textToRead
      .replace(/#+\s/g, '')
      .replace(/[*_`]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/- /g, '')
      .slice(0, 800) // Read initial core response

    // Try Web Speech Synthesis first for zero latency
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => {
        setIsPlaying(true)
        if (onSpeakingStateChange) onSpeakingStateChange('speaking')
      }

      utterance.onend = () => {
        setIsPlaying(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
      }

      utterance.onerror = () => {
        setIsPlaying(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
      }

      window.speechSynthesis.speak(utterance)
    } else {
      // Fallback to backend OpenAI TTS API
      try {
        setIsPlaying(true)
        if (onSpeakingStateChange) onSpeakingStateChange('thinking')
        const res = await api.post('/api/voice/speak', { text: cleanText })
        const audioSrc = `data:audio/mp3;base64,${res.data.audio_base64}`
        const audio = new Audio(audioSrc)
        audioPlayerRef.current = audio

        audio.onplay = () => {
          if (onSpeakingStateChange) onSpeakingStateChange('speaking')
        }

        audio.onended = () => {
          setIsPlaying(false)
          if (onSpeakingStateChange) onSpeakingStateChange('idle')
        }

        audio.play()
      } catch (err) {
        setIsPlaying(false)
        if (onSpeakingStateChange) onSpeakingStateChange('idle')
        addToast('Could not play voice audio.', 'error')
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
      }
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* Microphone button */}
      <button
        type="button"
        onClick={toggleRecording}
        title={isRecording ? 'Stop listening' : 'Speak your question'}
        className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isRecording
            ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-200'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        <span className="text-lg leading-none">{isRecording ? '⏹️' : '🎙️'}</span>
      </button>

      {/* Read aloud button (if text provided) */}
      {textToRead && (
        <button
          type="button"
          onClick={toggleSpeech}
          title={isPlaying ? 'Stop reading' : 'Read explanation aloud'}
          className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
            isPlaying
              ? 'bg-secondary-500 text-white animate-pulse shadow-lg shadow-teal-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span className="text-lg leading-none">{isPlaying ? '⏸️' : '🔊'}</span>
        </button>
      )}
    </div>
  )
}
