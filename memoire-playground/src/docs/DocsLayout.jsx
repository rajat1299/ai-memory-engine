import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import DocsSidebar from './DocsSidebar';
import DocsTOC from './DocsTOC';

const DocsLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-bg text-text font-body selection:bg-accent selection:text-bg">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-24 flex gap-12 relative">
                {/* Left Sidebar - Navigation */}
                <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pb-10 no-scrollbar">
                    <DocsSidebar />
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0 py-8 pb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </main>

                {/* Right Sidebar - Table of Contents */}
                <aside className="hidden xl:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pb-10 no-scrollbar">
                    <DocsTOC />
                </aside>
            </div>
        </div>
    );
};

export default DocsLayout;
