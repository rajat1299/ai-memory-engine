import React from 'react';
import { motion } from 'framer-motion';
import { Database, Server, Cpu, MessageSquare, Check } from 'lucide-react';

const Node = ({ icon: Icon, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="flex flex-col items-center gap-3 z-10"
    >
        <div className="w-16 h-16 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center shadow-lg">
            <Icon size={32} className="text-accent" />
        </div>
        <span className="text-sm font-mono text-text/70">{label}</span>
    </motion.div>
);

const Connection = ({ delay }) => (
    <motion.div
        initial={{ width: 0, opacity: 0 }}
        whileInView={{ width: '60px', opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.8 }}
        className="h-[2px] bg-gradient-to-r from-accent/20 to-accent/80 hidden md:block relative top-[-14px]"
    >
        <div className="absolute right-0 top-[-3px] w-2 h-2 rounded-full bg-accent animate-pulse"></div>
    </motion.div>
);

const ArchitectureDiagram = () => {
    return (
        <section className="py-32 bg-secondary/30 relative overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    {/* Left Column: Diagram */}
                    <div className="lg:w-1/2 w-full">
                        <div className="bg-bg rounded-2xl border border-border p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 py-20 min-h-[400px]">
                                <Node icon={MessageSquare} label="Your App" delay={0} />
                                <Connection delay={0.5} />

                                <Node icon={Server} label="Mémoire API" delay={1.0} />
                                <Connection delay={1.5} />

                                <div className="flex flex-col gap-12 relative mt-12 md:mt-0">
                                    {/* Worker Branch */}
                                    <div className="absolute top-[-140px] left-[50%] translate-x-[-50%] flex flex-col items-center">
                                        <Node icon={Cpu} label="Worker (LLM)" delay={2.2} />
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            whileInView={{ height: '60px', opacity: 1 }}
                                            transition={{ delay: 2.0 }}
                                            className="w-[2px] bg-accent/20 mt-2"
                                        ></motion.div>
                                    </div>

                                    <Node icon={Database} label="Postgres + Vector" delay={2.5} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:w-1/2 w-full">
                        <h2 className="text-4xl font-display font-medium mb-6">
                            How <span className="text-accent">Mémoire</span> Works
                        </h2>
                        <p className="text-lg text-text/70 mb-8 font-body leading-relaxed">
                            Mémoire runs as a separate process alongside your main application. This architecture decouples memory management from your business logic.
                        </p>

                        <div className="space-y-6">
                            {[
                                { title: "Language Agnostic", desc: "Connect via REST or gRPC from Python, Node, Go, or Rust." },
                                { title: "Independent Scaling", desc: "Scale your memory layer independently from your compute layer." },
                                { title: "Fault Isolation", desc: "If your app crashes, your memory service stays up. No data loss." }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center mt-1 shrink-0">
                                        <Check className="w-3 h-3 text-accent" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-text font-display">{item.title}</h4>
                                        <p className="text-sm text-text/60 mt-1 font-body">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ArchitectureDiagram;
