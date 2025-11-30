import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, Loader2, Lightbulb, History, Clock } from 'lucide-react';
import { useStore } from '../lib/store';

const RecallPanel = () => {
  const { 
    recallResults, 
    searchRecall, 
    isLoading, 
    recallQuery,
    showHistory,
    setShowHistory 
  } = useStore();
  const [query, setQuery] = useState('');

  // Re-search when toggle changes (if there's a query)
  useEffect(() => {
    if (recallQuery) {
      searchRecall(recallQuery);
    }
  }, [showHistory]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    await searchRecall(query);
  };

  const suggestions = [
    "What are my dietary restrictions?",
    "Where do I live?",
    "What's my work situation?",
    "What are my hobbies?",
  ];

  return (
    <div className="min-h-[500px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-semibold mb-2">Semantic Recall</h2>
          <p className="text-muted-foreground font-body text-sm">
            Search your memories using natural language. Mémoire finds relevant facts based on meaning, not just keywords.
          </p>
        </div>
      </div>

      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your memories..."
            className="w-full h-14 px-5 pl-12 rounded-2xl bg-card border border-border font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 h-10 rounded-xl bg-text text-bg text-sm font-body font-medium hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* History Toggle */}
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <History className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-body font-medium text-text">Show History</p>
            <p className="text-xs font-body text-muted-foreground">
              Include superseded facts (outdated info that was replaced)
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`
            relative w-12 h-7 rounded-full transition-colors
            ${showHistory ? 'bg-accent' : 'bg-muted'}
          `}
        >
          <motion.div
            animate={{ x: showHistory ? 22 : 2 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
          />
        </button>
      </div>

      {/* Quick Suggestions */}
      {!recallQuery && (
        <div className="mb-8">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wide mb-3">
            Try asking:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setQuery(suggestion)}
                className="px-4 py-2 text-sm font-body bg-muted hover:bg-secondary rounded-full transition-colors flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4 text-accent" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {recallQuery && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground font-body">
              Results for "{recallQuery}"
            </span>
            {recallResults.length > 0 && (
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-body rounded-full">
                {recallResults.length} found
              </span>
            )}
            {showHistory && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-body rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Including history
              </span>
            )}
          </div>

          {recallResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display font-medium mb-2">No Matches Found</h3>
              <p className="text-sm text-muted-foreground font-body max-w-sm">
                Try a different query or add more facts through the chat.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {recallResults.map((fact, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 bg-card rounded-xl border transition-colors ${
                      fact.is_superseded 
                        ? 'border-dashed border-muted-foreground/30 opacity-70' 
                        : 'border-border hover:border-accent/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-2 py-0.5 text-xs font-body bg-muted rounded">
                            {fact.category}
                          </span>
                          {fact.is_superseded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-body bg-yellow-100 text-yellow-700 rounded">
                              <Clock className="w-3 h-3" />
                              Superseded
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-body text-text">{fact.content}</p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-muted-foreground font-body">
                        {Math.round(fact.confidence * 100)}%
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecallPanel;
