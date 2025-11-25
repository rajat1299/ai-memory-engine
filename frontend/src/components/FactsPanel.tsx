import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trash2, RefreshCw, Loader2, Star } from 'lucide-react'
import { useStore } from '../lib/store'

const categoryColors: Record<string, string> = {
  user_identity: 'bg-amber/20 text-amber border-amber/30',
  user_preference: 'bg-sage/20 text-sage border-sage/30',
  biographical: 'bg-rose-soft/20 text-rose-soft border-rose-soft/30',
  relationship: 'bg-purple-400/20 text-purple-400 border-purple-400/30',
  contextual: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  default: 'bg-ink-faint/20 text-ink-secondary border-ink-faint/30',
}

export function FactsPanel() {
  const { facts, loadFacts, deleteFact, isLoading } = useStore()

  useEffect(() => {
    loadFacts()
  }, [loadFacts])

  const getCategoryStyle = (category: string) =>
    categoryColors[category] || categoryColors.default

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber" />
            Extracted Facts
          </h2>
          <p className="text-sm text-ink-secondary mt-1">
            Memories automatically extracted from your conversations
          </p>
        </div>
        <button
          onClick={loadFacts}
          disabled={isLoading}
          className="p-2 rounded-xl bg-surface-tertiary hover:bg-surface-elevated transition-colors"
          title="Refresh facts"
        >
          <RefreshCw className={`w-4 h-4 text-ink-tertiary ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Facts Grid */}
      <div className="flex-1 overflow-y-auto">
        {facts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-ink-faint" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Facts Yet</h3>
              <p className="text-sm text-ink-secondary">
                Send some messages in the Chat tab. Mémoire will extract facts
                automatically.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {facts.map((fact, index) => (
                <motion.div
                  key={fact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  className="group glass rounded-2xl p-4 hover:bg-surface-tertiary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-2xs font-medium border ${getCategoryStyle(
                            fact.category
                          )}`}
                        >
                          {fact.category.replace('_', ' ')}
                        </span>
                        {fact.is_essential && (
                          <Star className="w-3 h-3 text-amber fill-amber" />
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-sm text-ink">{fact.content}</p>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 text-2xs text-ink-tertiary">
                        <span>
                          Confidence: {Math.round(fact.confidence * 100)}%
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(fact.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteFact(fact.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-soft/10 transition-all"
                      title="Delete fact"
                    >
                      <Trash2 className="w-4 h-4 text-rose-soft" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && facts.length > 0 && (
        <div className="absolute inset-0 bg-surface/50 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber animate-spin" />
        </div>
      )}
    </div>
  )
}

