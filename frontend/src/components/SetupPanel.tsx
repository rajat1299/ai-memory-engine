import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Key, ArrowRight, Loader2, Plus } from 'lucide-react'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

export function SetupPanel() {
  const { setUser, createSession, isLoading, error, setError } = useStore()
  const [userId, setUserId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [step, setStep] = useState<'user' | 'confirm'>('user')
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) return
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setUser(userId.trim(), apiKey.trim() || null)
    await createSession()
  }

  // Generate a random UUID for demo purposes
  const generateDemoId = () => {
    const uuid = crypto.randomUUID()
    setUserId(uuid)
  }

  // Create a new user via the API
  const handleCreateUser = async () => {
    setIsCreatingUser(true)
    setError(null)
    try {
      const result = await api.createUser()
      setUserId(result.id)
      setApiKey(result.api_key)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Welcome Message */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber/20 to-amber-muted/10 flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber to-amber-muted flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </motion.div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to Mémoire</h2>
          <p className="text-ink-secondary text-sm">
            Your AI's long-term memory, made simple.
          </p>
        </div>

        {/* Setup Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-8"
        >
          {step === 'user' ? (
            <form onSubmit={handleUserSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  User ID
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter UUID or create a new user"
                    className="w-full pl-11 pr-4 py-3 bg-surface-tertiary rounded-xl text-ink placeholder:text-ink-faint focus-glow text-sm font-mono"
                  />
                </div>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    disabled={isCreatingUser}
                    className="flex items-center gap-1 text-xs text-amber hover:text-amber-muted transition-colors disabled:opacity-50"
                  >
                    {isCreatingUser ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    Create new user
                  </button>
                  <span className="text-ink-faint text-xs">or</span>
                  <button
                    type="button"
                    onClick={generateDemoId}
                    className="text-xs text-ink-tertiary hover:text-ink-secondary transition-colors"
                  >
                    Generate random ID
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">
                  API Key <span className="text-ink-faint">(optional)</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Leave empty for open access"
                    className="w-full pl-11 pr-4 py-3 bg-surface-tertiary rounded-xl text-ink placeholder:text-ink-faint focus-glow text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!userId.trim()}
                className="w-full py-3 px-4 bg-amber hover:bg-amber-muted disabled:opacity-50 disabled:cursor-not-allowed text-surface font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Ready to start?</h3>
                <p className="text-sm text-ink-secondary">
                  This will create a new conversation session.
                </p>
              </div>

              <div className="bg-surface-tertiary rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-secondary">User ID</span>
                  <span className="font-mono text-xs truncate max-w-[180px]">{userId}</span>
                </div>
                {apiKey && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-secondary">API Key</span>
                    <span className="text-ink-tertiary">••••••••</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-rose-soft/10 border border-rose-soft/20 rounded-xl p-3 text-sm text-rose-soft">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('user')}
                  className="flex-1 py-3 px-4 bg-surface-tertiary hover:bg-surface-elevated text-ink font-medium rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-amber hover:bg-amber-muted disabled:opacity-50 text-surface font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Start Session
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer hint */}
        <p className="text-center text-xs text-ink-faint mt-6">
          Tip: Click "Create new user" to register in the database, <br />
          or enter an existing User ID if you have one.
        </p>
      </motion.div>
    </div>
  )
}

