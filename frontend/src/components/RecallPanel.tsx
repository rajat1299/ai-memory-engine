import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, ArrowRight } from 'lucide-react'
import { useStore } from '../lib/store'

const categoryColors: Record<string, string> = {
  user_identity: 'bg-amber/20 text-amber',
  user_preference: 'bg-sage/20 text-sage',
  biographical: 'bg-rose-soft/20 text-rose-soft',
  relationship: 'bg-purple-400/20 text-purple-400',
  contextual: 'bg-blue-400/20 text-blue-400',
  default: 'bg-ink-faint/20 text-ink-secondary',
}

export function RecallPanel() {
  const { recallResults, recallQuery, searchRecall, isLoading } = useStore()
  const [query, setQuery] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    await searchRecall(query)
  }

  const getCategoryStyle = (category: string) =>
    categoryColors[category] || categoryColors.default

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Search className="w-5 h-5 text-amber" />
          Recall Memories
        </h2>
        <p className="text-sm text-ink-secondary mt-1">
          Search through stored facts using natural language
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to remember? (e.g., 'hobbies', 'location')"
            className="w-full pl-11 pr-24 py-3 bg-surface-tertiary rounded-xl text-ink placeholder:text-ink-faint focus-glow text-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber hover:bg-amber-muted disabled:opacity-30 disabled:cursor-not-allowed text-surface text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Search
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {recallQuery && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-ink-tertiary mb-4"
          >
            Showing results for "{recallQuery}"
          </motion.p>
        )}

        {recallResults.length === 0 && !recallQuery ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
                <Search className="w-8 h-8 text-ink-faint" />
              </div>
              <h3 className="text-lg font-medium mb-2">Search Your Memories</h3>
              <p className="text-sm text-ink-secondary">
                Enter a query above to find relevant facts from your
                conversation history.
              </p>
            </div>
          </motion.div>
        ) : recallResults.length === 0 && recallQuery ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center max-w-sm">
              <p className="text-ink-secondary">
                No memories found for "{recallQuery}"
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {recallResults.map((fact, index) => (
                <motion.div
                  key={`${fact.content}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Relevance Indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: `rgba(134, 192, 149, ${fact.confidence})`,
                        }}
                      />
                      <span className="text-2xs text-ink-faint">
                        {Math.round(fact.confidence * 100)}%
                      </span>
                    </div>

                    <div className="flex-1">
                      {/* Category */}
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-2xs font-medium mb-2 ${getCategoryStyle(
                          fact.category
                        )}`}
                      >
                        {fact.category.replace('_', ' ')}
                      </span>

                      {/* Content */}
                      <p className="text-sm text-ink">{fact.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

