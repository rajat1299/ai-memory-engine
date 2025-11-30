import React from 'react';
import { Brain } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-bg pt-24 pb-12 border-t border-border">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-text text-bg rounded flex items-center justify-center">
                                <Brain className="w-5 h-5" />
                            </div>
                            <span className="font-display font-bold text-xl">Mémoire</span>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
                            The standard for agentic memory. Built for the next generation of AI applications.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Product</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="#" className="hover:text-text transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">Integration</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">Enterprise</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">Changelog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Resources</h4>
                        <ul className="space-y-4 text-muted-foreground">
                            <li><a href="#" className="hover:text-text transition-colors">Documentation</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">API Reference</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">Community</a></li>
                            <li><a href="#" className="hover:text-text transition-colors">GitHub</a></li>
                        </ul>
                    </div>
                </div>

                <div className="h-px w-full bg-border mb-8" />

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© 2024 Memory Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-text transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-text transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
