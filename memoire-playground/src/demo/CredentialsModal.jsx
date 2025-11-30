import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Key, AlertTriangle, X } from 'lucide-react';
import { useStore } from '../lib/store';

const CredentialsModal = () => {
  const { showCredentialsModal, newCredentials, hideCredentials } = useStore();
  const [copied, setCopied] = useState({ key: false, id: false });

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [field]: true });
      setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!showCredentialsModal || !newCredentials) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-text/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-bg rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-text">
                  Your API Credentials
                </h2>
                <p className="text-sm font-body text-muted-foreground">
                  Account created successfully
                </p>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="mx-6 mt-4 p-4 bg-accent/5 border border-accent/20 rounded-xl flex gap-3">
            <AlertTriangle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-body text-text font-medium">
                Save your API key now
              </p>
              <p className="text-sm font-body text-muted-foreground mt-1">
                This is the only time you'll see your API key. Store it securely—you'll need it for all API requests via the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">X-API-Key</code> header.
              </p>
            </div>
          </div>

          {/* Credentials */}
          <div className="p-6 space-y-4">
            {/* User ID */}
            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-muted-foreground uppercase tracking-wide">
                User ID
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-muted rounded-lg font-body text-sm text-text break-all">
                  {newCredentials.id}
                </div>
                <button
                  onClick={() => copyToClipboard(newCredentials.id, 'id')}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-secondary hover:bg-muted transition-colors"
                >
                  {copied.id ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-body font-medium text-muted-foreground uppercase tracking-wide">
                API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-muted rounded-lg font-body text-sm text-text break-all">
                  {newCredentials.api_key}
                </div>
                <button
                  onClick={() => copyToClipboard(newCredentials.api_key, 'key')}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-secondary hover:bg-muted transition-colors"
                >
                  {copied.key ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Usage Hint */}
            <div className="p-4 bg-secondary rounded-xl">
              <p className="text-xs font-body text-muted-foreground mb-2">Example usage:</p>
              <code className="text-xs font-body text-text block">
                curl -H "X-API-Key: {newCredentials.api_key.slice(0, 16)}..." \
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8000/v1/facts/{newCredentials.id.slice(0, 8)}...
              </code>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <button
              onClick={hideCredentials}
              className="w-full h-12 px-6 bg-text text-bg rounded-full font-body font-bold text-sm hover:bg-text/90 transition-colors flex items-center justify-center gap-2"
            >
              I've saved my credentials
            </button>
            <p className="text-center text-xs font-body text-muted-foreground mt-3">
              Your API key has been stored locally for this session
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={hideCredentials}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CredentialsModal;

