// services/quizService.js — API client for gamified AI Quiz Challenge

import api from './api'

export const quizService = {
  /**
   * Generate an AI Quiz Challenge (minimum 10 questions)
   * @param {Object} params { topic, topic_id, difficulty, question_count }
   */
  async generateQuiz({ topic, topic_id = null, difficulty = null, question_count = 10 }) {
    const res = await api.post('/api/quiz/generate', {
      topic,
      topic_id,
      difficulty,
      question_count: Math.max(10, question_count),
    })
    return res.data
  },

  /**
   * Validate a single answer during active gameplay
   * @param {Object} payload { quiz_id, question_id, selected_answer }
   */
  async checkAnswer({ quiz_id, question_id, selected_answer }) {
    const res = await api.post('/api/quiz/check-answer', {
      quiz_id,
      question_id,
      selected_answer,
    })
    return res.data
  },

  /**
   * Submit quiz answers for server-side score, lives, streak, and mastery evaluation
   * @param {Object} payload { quiz_id, answers: [{ question_id, selected_answer, hint_used }] }
   */
  async submitQuiz({ quiz_id, answers }) {
    const res = await api.post('/api/quiz/submit', {
      quiz_id,
      answers,
    })
    return res.data
  },

  /**
   * Retrieve previous quiz result
   * @param {number|string} quiz_id
   */
  async getQuizResult(quiz_id) {
    const res = await api.get(`/api/quiz/${quiz_id}/result`)
    return res.data
  },
}

export default quizService
