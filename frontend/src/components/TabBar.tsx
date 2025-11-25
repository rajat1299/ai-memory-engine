import { motion } from 'framer-motion'
import { MessageSquare, Sparkles, Search, Heart } from 'lucide-react'
import { useStore } from '../lib/store'

const tabs = [
  { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
  { id: 'facts' as const, label: 'Facts', icon: Sparkles },
  { id: 'recall' as const, label: 'Recall', icon: Search },
  { id: 'conscious' as const, label: 'Essential', icon: Heart },
]

export function TabBar() {
  const { activeTab, setActiveTab, sessionId } = useStore()

  if (!sessionId) return null

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 border-b border-ink-faint/10 bg-surface/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium transition-colors
                  ${isActive ? 'text-ink' : 'text-ink-tertiary hover:text-ink-secondary'}
                `}
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

