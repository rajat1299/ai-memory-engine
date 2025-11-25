import { motion } from 'framer-motion'
import { Brain, LogOut } from 'lucide-react'
import { useStore } from '../lib/store'

export function Header() {
  const { userId, sessionId, reset } = useStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber to-amber-muted flex items-center justify-center">
              <Brain className="w-5 h-5 text-surface" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-sage border-2 border-surface" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Mémoire</h1>
            <p className="text-2xs text-ink-secondary -mt-0.5">Memory Engine</p>
          </div>
        </motion.div>

        {/* Session Info & Actions */}
        {userId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="text-right">
              <p className="text-xs text-ink-secondary">Session Active</p>
              <p className="text-2xs font-mono text-ink-tertiary truncate max-w-[140px]">
                {sessionId ? sessionId.slice(0, 8) + '...' : 'No session'}
              </p>
            </div>
            <button
              onClick={reset}
              className="p-2 rounded-xl hover:bg-surface-tertiary transition-colors group"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-ink-tertiary group-hover:text-ink-secondary transition-colors" />
            </button>
          </motion.div>
        )}
      </div>
    </header>
  )
}

