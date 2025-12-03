import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Copy, Check } from 'lucide-react';

export default function CTASection() {
    const [copied, setCopied] = useState(false);
    const installCommand = 'pip install memoire==0.1.0';

    const handleCopy = () => {
        navigator.clipboard.writeText(installCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-32 container mx-auto px-6">
            <div className="bg-[#2B2622] rounded-[2rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
                {/* Abstract Shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-display font-medium mb-12 text-[#FBF9F6] leading-tight"
                    >
                        Memory makes <br />
                        <span className="text-accent italic">intelligence</span> useful
                    </motion.h2>

                    {/* Command Component */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 max-w-md mx-auto"
                    >
                        <div className="group relative bg-[#FBF9F6] border border-[#2B2622]/20 rounded-xl px-6 py-4 flex items-center justify-between hover:border-accent/50 transition-all duration-300">
                            <code className="text-sm font-mono text-[#2B2622] select-all">
                                {installCommand}
                            </code>
                            <button
                                onClick={handleCopy}
                                className="p-2 rounded-lg hover:bg-[#2B2622]/5 transition-colors"
                                aria-label="Copy command"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4 text-[#2B2622]/50 group-hover:text-[#2B2622]/80 transition-colors" />
                                )}
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3"
                    >
                        <button className="px-6 py-3 bg-[#FBF9F6] text-[#2B2622] rounded-full font-medium text-sm hover:bg-[#FBF9F6]/90 transition-all hover:scale-105 flex items-center gap-2 group">
                            Start Building
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-6 py-3 bg-transparent text-[#FBF9F6] border border-[#FBF9F6]/20 rounded-full font-medium text-sm hover:bg-[#FBF9F6]/10 hover:border-[#FBF9F6]/40 transition-all hover:scale-105 flex items-center gap-2">
                            <Terminal className="w-4 h-4" />
                            Read Documentation
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
