import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal } from 'lucide-react';

export default function CTASection() {
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
                        className="text-4xl md:text-6xl font-display font-medium mb-8 text-[#FBF9F6] leading-tight"
                    >
                        Memory makes <br />
                        <span className="text-accent italic">intelligence</span> useful
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-[#FBF9F6]/70 mb-12 font-body"
                    >
                        Try Memoire now
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <button className="px-10 py-5 bg-[#FBF9F6] text-[#2B2622] rounded-full font-medium text-lg hover:bg-[#FBF9F6]/90 transition-colors flex items-center gap-2 group">
                            Start Building
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="px-10 py-5 bg-transparent text-[#FBF9F6] border border-[#FBF9F6]/20 rounded-full font-medium text-lg hover:bg-[#FBF9F6]/10 transition-colors flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            Read Documentation
                        </button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
