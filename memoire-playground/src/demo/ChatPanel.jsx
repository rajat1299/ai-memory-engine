import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';

const ChatPanel = () => {
  const { messages, pendingJobs, sendMessage, isLoading } = useStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const suggestions = [
    "I live in Austin, Texas and love hiking",
    "My favorite programming language is Python",
    "I'm allergic to peanuts and shellfish",
    "I prefer dark mode and minimal interfaces",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-display font-semibold mb-2">Chat Interface</h2>
        <p className="text-muted-foreground font-body text-sm">
          Send messages and watch as Mémoire extracts and remembers important facts.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-card border border-border p-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-display font-medium mb-2">Start a Conversation</h3>
            <p className="text-sm text-muted-foreground font-body max-w-sm mb-6">
              Tell Mémoire about yourself. Share facts, preferences, and memories—they'll be extracted and remembered.
            </p>
            
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-2 text-xs font-body bg-muted hover:bg-secondary rounded-lg transition-colors text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-[80%] px-4 py-3 rounded-2xl font-body text-sm
                      ${msg.role === 'user' 
                        ? 'bg-text text-bg rounded-br-sm' 
                        : 'bg-muted text-text rounded-bl-sm'
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Pending extraction indicator */}
            {pendingJobs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground font-body"
              >
                <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  <span>Extracting {pendingJobs.length} memory fact{pendingJobs.length > 1 ? 's' : ''}...</span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Mémoire something about yourself..."
            disabled={isLoading}
            className="w-full h-14 px-5 pr-14 rounded-full bg-card border border-border font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-text text-bg flex items-center justify-center hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;

