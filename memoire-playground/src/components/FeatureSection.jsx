import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Zap, ArrowRight, Server } from 'lucide-react';

const FeatureCard = ({ title, description, icon: Icon, className, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className={`p-8 bg-[#252525] border border-white/5 rounded-2xl hover:border-accent/30 transition-colors group ${className}`}
    >
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
            <Icon size={24} className="text-text/80 group-hover:text-accent transition-colors" />
        </div>
        <h3 className="text-2xl font-display mb-4">{title}</h3>
        <p className="text-text/60 font-body leading-relaxed mb-6">{description}</p>
        <div className="flex items-center gap-2 text-accent text-sm font-bold font-body cursor-pointer group-hover:translate-x-1 transition-transform">
            <span>Learn more</span>
            <ArrowRight size={16} />
        </div>
    </motion.div>
);

const FeatureSection = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="mb-16">
                <h2 className="text-4xl md:text-6xl font-display font-light mb-6">
                    Dual Memory <span className="text-accent italic">Architecture</span>.
                </h2>
                <p className="text-text/70 font-body max-w-xl text-lg">
                    A production-grade memory engine that mimics human cognition.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Large Card - Conscious */}
                <FeatureCard
                    title="Conscious Memory"
                    description="Essential facts like identity and long-term preferences are always available via /v1/conscious. No retrieval latency for the things that define your user."
                    icon={Zap}
                    className="md:col-span-2 bg-gradient-to-br from-[#252525] to-[#1e1e1e]"
                    delay={0}
                />

                {/* Tall Card - Sidecar */}
                <FeatureCard
                    title="Sidecar Brain"
                    description="Runs as a standalone Docker service alongside your app. Your main application stays lightweight while Mémoire handles ingestion, embedding, and optimization."
                    icon={Server}
                    className="md:row-span-2 bg-[#2A2A2A]"
                    delay={0.2}
                />

                {/* Standard Card - Recall */}
                <FeatureCard
                    title="Total Recall"
                    description="Hybrid vector + fuzzy search via /v1/recall. Retrieve specific facts with filters for time, category, and confidence."
                    icon={Search}
                    className="md:col-span-2"
                    delay={0.4}
                />
            </div>
        </section>
    );
};

export default FeatureSection;
