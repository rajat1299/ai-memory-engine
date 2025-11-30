import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';

const ConsciousPanel = () => {
  const { consciousFacts, loadConscious, isLoading } = useStore();

  useEffect(() => {
    loadConscious();
  }, [loadConscious]);

  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold mb-2">Essential Memories</h2>
          <p className="text-muted-foreground font-body text-sm">
            High-priority facts that are always "top of mind" for the AI—critical context that shapes every interaction.
          </p>
        </div>
        <button
          onClick={() => loadConscious()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted hover:bg-secondary transition-colors text-sm font-body disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Card */}
      <div className="mb-8 p-4 bg-accent/5 border border-accent/20 rounded-xl">
        <div className="flex gap-3">
          <Sparkles className="w-5 h-5 text-accent flex-shrink-0" />
          <div>
            <p className="text-sm font-body text-text font-medium mb-1">
              Working Memory
            </p>
            <p className="text-sm font-body text-muted-foreground">
              These "essential" facts are injected into every prompt, giving the AI persistent awareness of your most important information—like allergies, preferences, and key relationships.
            </p>
          </div>
        </div>
      </div>

      {/* Essential Facts */}
      {isLoading && consciousFacts.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : consciousFacts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display font-medium mb-2">No Essential Facts Yet</h3>
          <p className="text-sm text-muted-foreground font-body max-w-sm">
            As you chat, critical facts will be automatically promoted to essential status based on importance and frequency.
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {consciousFacts.map((fact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative p-4 bg-card rounded-xl border-2 border-accent/20 hover:border-accent/40 transition-all overflow-hidden"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-xs font-body text-accent font-medium uppercase tracking-wide">
                      Essential
                    </span>
                  </div>
                  
                  <span className="inline-block px-2 py-0.5 text-xs font-body bg-muted rounded mb-2">
                    {fact.category}
                  </span>
                  
                  <p className="text-sm font-body text-text leading-relaxed">
                    {fact.content}
                  </p>
                  
                  <div className="mt-3 text-xs text-muted-foreground font-body">
                    {Math.round(fact.confidence * 100)}% confidence
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ConsciousPanel;

