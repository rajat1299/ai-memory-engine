import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroDemo } from './HeroDemo';

const Hero = () => {
    return (
        <section className="min-h-screen flex flex-col justify-center px-6 py-20 max-w-7xl mx-auto relative overflow-hidden">
            <div className="flex flex-col gap-16 relative z-10">

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >


                    <div className="space-y-2 mb-10 mt-16">
                        <h1 className="text-3xl md:text-4xl font-display font-medium leading-tight text-text">
                            Built to make your AI extraordinarily conscious,
                        </h1>
                        <h1 className="text-3xl md:text-4xl font-display font-medium leading-tight text-text/60">
                            <span className="text-accent">Mémoire</span> give you persistent, long-term memory.
                        </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link 
                            to="/demo"
                            className="h-14 px-8 text-base font-bold font-body rounded-full bg-text text-bg hover:bg-text/90 transition-all hover:scale-105 shadow-lg shadow-text/10 flex items-center gap-2 w-fit"
                        >
                            Install Memory
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </motion.div>

                {/* Interactive Demo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full"
                >
                    <HeroDemo />
                </motion.div>
            </div>
        </section >
    );
};

export default Hero;
