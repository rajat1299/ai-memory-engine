/**
 * Global State Management with Zustand
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from './api'

const initialState = {
  userId: null,
  sessionId: null,
  apiKey: null,
  activeTab: 'chat',
  isLoading: false,
  error: null,
  messages: [],
  pendingJobs: [],
  facts: [],
  consciousFacts: [],
  recallResults: [],
  recallQuery: '',
  showHistory: false, // New: toggle for including superseded facts
  showCredentialsModal: false,
  newCredentials: null,
}

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (userId, apiKey = null) => {
        api.setApiKey(apiKey)
        set({ userId, apiKey, sessionId: null, messages: [] })
      },

      setSession: (sessionId) => {
        set({ sessionId, messages: [] })
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setError: (error) => set({ error }),

      setShowHistory: (show) => set({ showHistory: show }),

      showCredentials: (credentials) => {
        set({ showCredentialsModal: true, newCredentials: credentials })
      },

      hideCredentials: () => {
        set({ showCredentialsModal: false, newCredentials: null })
      },

      createUser: async () => {
        set({ isLoading: true, error: null })
        try {
          const result = await api.createUser()
          // Store credentials and show modal
          api.setApiKey(result.api_key)
          set({
            userId: result.id,
            apiKey: result.api_key,
            isLoading: false,
            showCredentialsModal: true,
            newCredentials: result,
          })
          return result
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to create user',
            isLoading: false,
          })
          throw err
        }
      },

      // Login with existing credentials
      loginWithCredentials: (userId, apiKey) => {
        api.setApiKey(apiKey)
        set({ userId, apiKey, sessionId: null, messages: [], error: null })
      },

      createSession: async () => {
        const { userId } = get()
        if (!userId) return

        set({ isLoading: true, error: null })
        try {
          const session = await api.createSession(userId)
          set({ sessionId: session.id, messages: [], isLoading: false })
          return session
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to create session',
            isLoading: false,
          })
        }
      },

      sendMessage: async (content) => {
        const { userId, sessionId } = get()
        if (!userId || !sessionId) return

        set({ isLoading: true, error: null })
        try {
          const result = await api.ingestMessage(userId, sessionId, 'user', content)

          // Optimistically add message to UI
          const newMessage = {
            id: result.chat_log_id,
            session_id: sessionId,
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
          }

          set((state) => ({
            messages: [...state.messages, newMessage],
            pendingJobs: result.job_id
              ? [...state.pendingJobs, result.job_id]
              : state.pendingJobs,
            isLoading: false,
          }))

          // Clear pending jobs after delay and notify user
          if (result.job_id) {
            setTimeout(async () => {
              set((state) => ({
                pendingJobs: state.pendingJobs.filter((id) => id !== result.job_id),
              }))
              // Show toast notification
              const { toast } = await import('sonner')
              toast.success('Memory extraction complete', {
                description: 'New facts have been remembered.',
                action: {
                  label: 'View Facts',
                  onClick: () => set({ activeTab: 'facts' }),
                },
              })
              // Auto-refresh facts in background
              const { userId } = get()
              if (userId) {
                try {
                  const response = await api.getFacts(userId)
                  set({ facts: response.facts })
                } catch {
                  // Silently fail
                }
              }
            }, 12000)
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to send message',
            isLoading: false,
          })
        }
      },

      loadHistory: async () => {
        const { sessionId } = get()
        if (!sessionId) return

        set({ isLoading: true, error: null })
        try {
          const history = await api.getHistory(sessionId)
          set({ messages: history.messages, isLoading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load history',
            isLoading: false,
          })
        }
      },

      loadFacts: async () => {
        const { userId } = get()
        if (!userId) return

        set({ isLoading: true, error: null })
        try {
          const response = await api.getFacts(userId)
          set({ facts: response.facts, isLoading: false })
        } catch (err) {
          set({ facts: [], isLoading: false })
        }
      },

      loadConscious: async () => {
        const { userId } = get()
        if (!userId) return

        set({ isLoading: true, error: null })
        try {
          const response = await api.getConscious(userId)
          set({ consciousFacts: response.relevant_facts, isLoading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load conscious memory',
            isLoading: false,
          })
        }
      },

      // Updated to support showHistory toggle
      searchRecall: async (query) => {
        const { userId, showHistory } = get()
        if (!userId || !query.trim()) return

        set({ isLoading: true, error: null, recallQuery: query })
        try {
          const response = await api.recall(userId, query, { 
            currentViewOnly: !showHistory 
          })
          set({ recallResults: response.relevant_facts, isLoading: false })
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to search memories',
            isLoading: false,
          })
        }
      },

      deleteFact: async (factId) => {
        set({ isLoading: true, error: null })
        try {
          await api.deleteFact(factId)
          set((state) => ({
            facts: state.facts.filter((f) => f.id !== factId),
            isLoading: false,
          }))
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to delete fact',
            isLoading: false,
          })
        }
      },

      logout: () => {
        api.setApiKey(null)
        set(initialState)
      },

      reset: () => {
        api.setApiKey(null)
        set(initialState)
      },
    }),
    {
      name: 'memoire-storage',
      partialize: (state) => ({
        userId: state.userId,
        sessionId: state.sessionId,
        apiKey: state.apiKey,
      }),
      onRehydrate: () => (state) => {
        // Restore API key on hydration
        if (state?.apiKey) {
          api.setApiKey(state.apiKey)
        }
      },
    }
  )
)
