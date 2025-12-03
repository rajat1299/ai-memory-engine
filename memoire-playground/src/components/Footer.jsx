import React from 'react';

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-bg pt-24 pb-12 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="font-display font-bold text-2xl tracking-tight">Mémoire<span className="text-accent">.</span></span>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                            The standard for agentic memory. Built for the next generation of AI applications.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li>
                                <button onClick={scrollToTop} className="hover:text-text transition-colors text-left">
                                    Home
                                </button>
                            </li>
                            <li><a href="/#use-cases" className="hover:text-text transition-colors">Features</a></li>
                            <li><a href="/demo" className="hover:text-text transition-colors">Demo</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Resources</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="/docs" className="hover:text-text transition-colors">Documentation</a></li>
                            <li><a href="mailto:rajattiwari1099@gmail.com" className="hover:text-text transition-colors">Contact</a></li>
                            <li><a href="https://github.com/rajat1299/ai-memory-engine" target="_blank" rel="noopener noreferrer" className="hover:text-text transition-colors">GitHub</a></li>
                            <li><a href="/privacy" className="hover:text-text transition-colors">Privacy</a></li>
                        </ul>
                    </div>
                </div>

                <div className="h-px w-full bg-border mb-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© 2025 Mémoire Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
