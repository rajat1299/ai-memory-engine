import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Brain, Search, Sparkles, LogOut } from 'lucide-react';
import { Toaster } from 'sonner';
import { useStore } from '../lib/store';
import CredentialsModal from './CredentialsModal';
import AuthPage from './AuthPage';
import ChatPanel from './ChatPanel';
import FactsPanel from './FactsPanel';
import RecallPanel from './RecallPanel';
import ConsciousPanel from './ConsciousPanel';

const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'facts', label: 'Facts', icon: Brain },
  { id: 'recall', label: 'Recall', icon: Search },
  { id: 'conscious', label: 'Essentials', icon: Sparkles },
];

const DemoPage = () => {
  const { 
    userId, 
    sessionId, 
    activeTab, 
    setActiveTab, 
    createSession,
    logout,
    isLoading,
  } = useStore();

  // Auto-create session when user exists but no session
  useEffect(() => {
    if (userId && !sessionId && !isLoading) {
      createSession();
    }
  }, [userId, sessionId, isLoading, createSession]);

  const handleLogout = () => {
    logout();
  };

  // Auth / Onboarding Screen
  if (!userId) {
    return (
      <>
        <Toaster position="bottom-right" richColors />
        <CredentialsModal />
        <AuthPage />
      </>
    );
  }

  // Main Demo Interface
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col">
      <Toaster position="bottom-right" richColors />
      <CredentialsModal />

      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-display font-bold text-text tracking-tight">
            Mémoire<span className="text-accent">.</span>
          </Link>

          {/* Tab Navigation */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-full">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  relative px-4 py-2 rounded-full font-body text-sm transition-colors flex items-center gap-2
                  ${activeTab === id 
                    ? 'text-text' 
                    : 'text-muted-foreground hover:text-text'
                  }
                `}
              >
                {activeTab === id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-card rounded-full shadow-sm"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body text-muted-foreground hover:text-text hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden sticky top-[65px] z-40 px-4 py-2 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 py-2 rounded-full font-body text-xs transition-colors flex items-center justify-center gap-1
                ${activeTab === id 
                  ? 'bg-card text-text shadow-sm' 
                  : 'text-muted-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'facts' && <FactsPanel />}
            {activeTab === 'recall' && <RecallPanel />}
            {activeTab === 'conscious' && <ConsciousPanel />}
          </motion.div>
        </div>
      </main>

      {/* Session Info Footer */}
      <footer className="px-6 py-4 border-t border-border bg-secondary/50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-body text-muted-foreground">
          <span>Session: {sessionId?.slice(0, 8)}...</span>
          <span>•</span>
          <span>User: {userId?.slice(0, 8)}...</span>
        </div>
      </footer>
    </div>
  );
};

export default DemoPage;
