import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = () => {
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

                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-sm font-body text-text/70">
                    <a href="#features" className="hover:text-text transition-colors">Features</a>
                    <a href="#manifesto" className="hover:text-text transition-colors">Manifesto</a>
                    <a href="#pricing" className="hover:text-text transition-colors">Pricing</a>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <Link to="/demo" className="text-sm font-body text-text hover:text-accent transition-colors">
                        Try Demo
                    </Link>
                    <Link 
                        to="/demo" 
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-md text-sm font-body text-text hover:bg-white/10 transition-colors"
                    >
                        Get Access
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
