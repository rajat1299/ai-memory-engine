/**
 * Mémoire API Client
 * Typed interface to the backend REST API
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/v1'

class ApiClient {
  apiKey = null

  setApiKey(key) {
    this.apiKey = key
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Users
  async createUser() {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  // Sessions
  async createSession(userId) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    })
  }

  // Chat
  async ingestMessage(userId, sessionId, role, content) {
    return this.request('/ingest', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        role,
        content,
      }),
    })
  }

  async getHistory(sessionId, limit = 50) {
    return this.request(`/history/${sessionId}?limit=${limit}`)
  }

  // Memory Recall - now supports current_view_only toggle
  async recall(userId, query, { limit = 10, currentViewOnly = true } = {}) {
    return this.request('/recall', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        query,
        limit,
        current_view_only: currentViewOnly,
      }),
    })
  }

  // Conscious Memory
  async getConscious(userId) {
    return this.request(`/conscious/${userId}`)
  }

  // Facts
  async getFacts(userId) {
    return this.request(`/facts/${userId}`)
  }

  async deleteFact(factId) {
    return this.request(`/facts/${factId}`, {
      method: 'DELETE',
    })
  }
}

export const api = new ApiClient()
