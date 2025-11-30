import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Key, Plus, Loader2 } from 'lucide-react';
import { useStore } from '../lib/store';

const AuthPage = ({ onAuthenticated }) => {
  const { createUser, loginWithCredentials, isLoading, error, setError } = useStore();
  const [mode, setMode] = useState(null); // null | 'new' | 'existing'
  const [existingUserId, setExistingUserId] = useState('');
  const [existingApiKey, setExistingApiKey] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await createUser();
      onAuthenticated?.();
    } catch (err) {
      console.error('Failed to create user:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUseExisting = (e) => {
    e.preventDefault();
    if (!existingUserId.trim() || !existingApiKey.trim()) {
      setError('Please enter both User ID and API Key');
      return;
    }
    loginWithCredentials(existingUserId.trim(), existingApiKey.trim());
    onAuthenticated?.();
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Logo */}
        <div className="p-6">
          <Link to="/" className="text-2xl font-display font-bold text-text tracking-tight">
            Mémoire<span className="text-accent">.</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md flex flex-col items-center"
          >
            <h1 className="text-3xl font-display font-semibold text-text mb-2 text-center">
              Welcome to Mémoire
            </h1>
            <p className="text-muted-foreground font-body mb-8 text-center">
              Get started with your AI memory space.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-body w-full"
              >
                {error}
              </motion.div>
            )}

            {/* Create New Account Button */}
            <button
              onClick={handleCreateNew}
              disabled={isCreating || isLoading}
              className="w-full h-14 px-6 mb-4 rounded-xl bg-text text-bg font-body font-bold text-sm hover:bg-text/90 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating your space...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create New Memory Space
                </>
              )}
            </button>

            {/* Use Existing Credentials Button */}
            <button
              onClick={() => setMode(mode === 'existing' ? null : 'existing')}
              className="w-full h-14 px-6 rounded-xl bg-card border border-border text-text font-body font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-3"
            >
              <Key className="w-5 h-5" />
              Use Existing Credentials
            </button>

            {/* Existing Credentials Form */}
            {mode === 'existing' && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleUseExisting}
                className="mt-6 space-y-4 w-full"
              >
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-bg px-4 text-muted-foreground font-body">
                      enter your credentials
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={existingUserId}
                    onChange={(e) => setExistingUserId(e.target.value)}
                    placeholder="User ID"
                    className="w-full h-12 px-4 rounded-xl bg-card border border-border font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                  <input
                    type="password"
                    value={existingApiKey}
                    onChange={(e) => setExistingApiKey(e.target.value)}
                    placeholder="API Key"
                    className="w-full h-12 px-4 rounded-xl bg-card border border-border font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!existingUserId.trim() || !existingApiKey.trim() || isLoading}
                  className="w-full h-12 px-6 rounded-xl bg-accent text-white font-body font-bold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            <p className="text-xs text-center font-body text-muted-foreground mt-8">
              Your credentials are stored locally in this browser.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Image Card */}
      <div className="hidden lg:flex w-[50%] p-4 items-center justify-center bg-bg">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
          <img
            src="/edejess-sM3vnE5Ml0s-unsplash.jpg"
            alt="Abstract Art"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Optional Overlay for better contrast if needed, but user asked to remove text so maybe clean image is best */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

