import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'

const categoryColors: Record<string, string> = {
  user_identity: 'from-amber/30 to-amber/10',
  user_preference: 'from-sage/30 to-sage/10',
  biographical: 'from-rose-soft/30 to-rose-soft/10',
  relationship: 'from-purple-400/30 to-purple-400/10',
  contextual: 'from-blue-400/30 to-blue-400/10',
  default: 'from-ink-faint/30 to-ink-faint/10',
}

export function ConsciousPanel() {
  const { consciousFacts, loadConscious, isLoading } = useStore()

  useEffect(() => {
    loadConscious()
  }, [loadConscious])

  const getCategoryGradient = (category: string) =>
    categoryColors[category] || categoryColors.default

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-soft" />
            Essential Memories
          </h2>
          <p className="text-sm text-ink-secondary mt-1">
            Core facts promoted by the conscious agent — loaded at startup
          </p>
        </div>
        <button
          onClick={loadConscious}
          disabled={isLoading}
          className="p-2 rounded-xl bg-surface-tertiary hover:bg-surface-elevated transition-colors"
          title="Refresh essential memories"
        >
          <RefreshCw className={`w-4 h-4 text-ink-tertiary ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Essential Facts */}
      <div className="flex-1 overflow-y-auto">
        {consciousFacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-soft/20 to-amber/10 flex items-center justify-center">
                <Heart className="w-10 h-10 text-ink-faint" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Essential Memories</h3>
              <p className="text-sm text-ink-secondary">
                The periodic conscious agent promotes important facts here.
                Keep chatting, and core memories will emerge.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-tertiary">
                <Sparkles className="w-3 h-3" />
                <span>Runs every 6 hours</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {consciousFacts.map((fact, index) => (
                <motion.div
                  key={`${fact.content}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className={`
                    relative overflow-hidden rounded-2xl p-5
                    bg-gradient-to-br ${getCategoryGradient(fact.category)}
                    border border-white/5
                  `}
                >
                  {/* Glow effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber/5 rounded-full blur-3xl" />

                  <div className="relative">
                    {/* Category */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded-lg bg-surface/40 text-xs font-medium text-ink-secondary">
                        {fact.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-2xs text-amber">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>Essential</span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-base text-ink font-medium leading-relaxed">
                      {fact.content}
                    </p>

                    {/* Confidence Bar */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-surface/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${fact.confidence * 100}%` }}
                          transition={{ delay: index * 0.08 + 0.3, duration: 0.5 }}
                          className="h-full bg-amber/60 rounded-full"
                        />
                      </div>
                      <span className="text-2xs text-ink-secondary">
                        {Math.round(fact.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && consciousFacts.length > 0 && (
        <div className="absolute inset-0 bg-surface/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-rose-soft animate-spin" />
        </div>
      )}
    </div>
  )
}

