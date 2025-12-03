import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Search, X, Command } from 'lucide-react';
import { useDocsSearch } from '../docs/DocsSearchContext';

const Navbar = () => {
    const location = useLocation();
    const isDocsPage = location.pathname.startsWith('/docs');

    // Only use search context if on docs page
    const searchContext = isDocsPage ? useDocsSearch() : null;
    const { query, setQuery, inputRef } = searchContext || {};

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/80 backdrop-blur-md border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between relative">
                <Link to="/" className="text-2xl font-display font-bold text-text tracking-tight">
                    Mémoire<span className="text-accent">.</span>
                </Link>

                {/* Conditionally render search bar or nav links */}
                {isDocsPage ? (
                    <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className={`w-4 h-4 transition-colors ${query ? 'text-accent' : 'text-muted-foreground/70'}`} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query || ''}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search docs..."
                                className="block w-full pl-10 pr-10 py-2.5 bg-secondary/30 border border-border rounded-xl text-sm text-text placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent/50 transition-all font-body"
                            />

                            {/* Right Icon: Clear or Keyboard Shortcut Hint */}
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                {query ? (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="text-muted-foreground hover:text-text transition-colors p-1 rounded-full hover:bg-black/5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                ) : (
                                    <div className="hidden lg:flex items-center gap-1 pointer-events-none opacity-40">
                                        <Command className="w-3 h-3" />
                                        <span className="text-[10px] font-mono">K</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-body text-text/70">
                        <a href="#use-cases" className="hover:text-text transition-colors">Features</a>
                        <a href="#architecture" className="hover:text-text transition-colors">System</a>
                        <a href="#stack" className="hover:text-text transition-colors">Stack</a>
                        <Link to="/docs" className="hover:text-text transition-colors">Docs</Link>
                    </div>
                )}

                <div className="flex items-center gap-4 ml-auto">
                    <Link to="/demo" className="text-sm font-body text-text hover:text-accent transition-colors">
                        Try Demo
                    </Link>
                    <a
                        href="https://github.com/rajat1299/memori"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-text hover:bg-white/10 hover:border-accent/30 hover:text-accent transition-all group"
                        aria-label="View on GitHub"
                    >
                        <svg
                            className="w-5 h-5 transition-transform group-hover:scale-110"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </a>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
