import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './lib/store'
import {
  Header,
  TabBar,
  SetupPanel,
  ChatPanel,
  FactsPanel,
  RecallPanel,
  ConsciousPanel,
} from './components'

function App() {
  const { sessionId, activeTab } = useStore()

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Warm gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-soft/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber/[0.02] rounded-full blur-[150px]" />
        
        {/* Subtle grain texture */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Header */}
      <Header />

      {/* Tab Bar (only shown when session is active) */}
      <TabBar />

      {/* Main Content */}
      <main className={`relative ${sessionId ? 'pt-28' : 'pt-16'}`}>
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!sessionId ? (
              <motion.div
                key="setup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SetupPanel />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="min-h-[calc(100vh-7rem)]"
              >
                {activeTab === 'chat' && <ChatPanel />}
                {activeTab === 'facts' && <FactsPanel />}
                {activeTab === 'recall' && <RecallPanel />}
                {activeTab === 'conscious' && <ConsciousPanel />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App

