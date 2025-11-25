import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, RefreshCw } from 'lucide-react'
import { useStore } from '../lib/store'

export function ChatPanel() {
  const { messages, sendMessage, loadHistory, isLoading, error, pendingJobs } = useStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const message = input
    setInput('')
    await sendMessage(message)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
                <span className="text-2xl">💭</span>
              </div>
              <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
              <p className="text-sm text-ink-secondary">
                Send messages to your AI. Mémoire will automatically extract
                and remember important facts.
              </p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] px-4 py-3 rounded-2xl text-sm
                    ${
                      message.role === 'user'
                        ? 'bg-amber text-surface rounded-br-md'
                        : 'bg-surface-tertiary text-ink rounded-bl-md'
                    }
                  `}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="text-2xs opacity-60 mt-1.5">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      {pendingJobs.length > 0 && (
        <div className="px-6 py-2 border-t border-ink-faint/10">
          <div className="flex items-center gap-2 text-xs text-amber">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Extracting facts from {pendingJobs.length} message(s)...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 border-t border-rose-soft/20">
          <p className="text-xs text-rose-soft">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-ink-faint/10">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <button
            type="button"
            onClick={loadHistory}
            className="p-3 rounded-xl bg-surface-tertiary hover:bg-surface-elevated transition-colors"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4 text-ink-tertiary" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me something memorable..."
              className="w-full px-4 py-3 bg-surface-tertiary rounded-xl text-ink placeholder:text-ink-faint focus-glow text-sm pr-12"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-amber hover:bg-amber-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-surface animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-surface" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

