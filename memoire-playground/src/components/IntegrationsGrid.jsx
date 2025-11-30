import React from 'react';
import { motion } from 'framer-motion';
import { Music, Image, Calendar, FileText, Mail, MessageCircle, Github, Twitter, Instagram, Linkedin } from 'lucide-react';

const integrations = [
    { name: 'Spotify', icon: Music, color: '#1DB954' },
    { name: 'Photos', icon: Image, color: '#FF6F61' },
    { name: 'Calendar', icon: Calendar, color: '#4285F4' },
    { name: 'Notes', icon: FileText, color: '#F5E8D8' },
    { name: 'Mail', icon: Mail, color: '#EA4335' },
    { name: 'Messages', icon: MessageCircle, color: '#34B7F1' },
    { name: 'GitHub', icon: Github, color: '#ffffff' },
    { name: 'Twitter', icon: Twitter, color: '#1DA1F2' },
    { name: 'Instagram', icon: Instagram, color: '#E1306C' },
    { name: 'LinkedIn', icon: Linkedin, color: '#0077B5' },
];

const IntegrationsGrid = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-display font-light mb-6">
                    Connect your <span className="text-gold italic">digital life</span>.
                </h2>
                <p className="text-text/70 font-body max-w-2xl mx-auto">
                    Memory integrates with the apps you use every day to build a complete picture of your past.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {integrations.map((item, index) => (
                    <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, borderColor: item.color }}
                        className="group relative flex flex-col items-center justify-center p-8 bg-white/5 border border-white/5 rounded-xl transition-colors duration-300 hover:bg-white/10 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Glow */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                            style={{ backgroundColor: item.color }}
                        ></div>

                        <item.icon
                            size={32}
                            className="mb-3 text-text/80 group-hover:text-white transition-colors relative z-10"
                            style={{ color: 'inherit' }} // Allow inline style override if needed, but class handles it
                        />
                        <span className="text-sm font-body text-text/60 group-hover:text-white transition-colors relative z-10">
                            {item.name}
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default IntegrationsGrid;
