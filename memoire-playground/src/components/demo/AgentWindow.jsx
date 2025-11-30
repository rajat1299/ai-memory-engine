import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, X, Terminal } from 'lucide-react';

const AgentWindow = () => {
    const [messages, setMessages] = useState([
        { role: 'system', content: 'Mémoire Sidecar initialized. Listening on port 8000.' },
        { role: 'assistant', content: 'I am ready. You can ask me to recall context or analyze memory patterns.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleCommand = async (cmd) => {
        setInput(cmd);
        setIsTyping(true);

        // Simulate typing delay
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'user', content: cmd }]);
            setInput('');
            setIsTyping(false);

            // Simulate processing
            setTimeout(() => {
                let response = '';
                if (cmd.includes('Recall')) {
                    response = 'Found 3 relevant memories from last week:\n1. "User prefers dark mode" (Confidence: 0.98)\n2. "Working on Python AsyncIO" (Confidence: 0.95)\n3. "Role: Senior Engineer" (Confidence: 0.99)';
                } else if (cmd.includes('Analyze')) {
                    response = 'Memory Graph Analysis:\n- Strong cluster around "Python Development"\n- Recent focus shift to "Frontend/React"\n- 15 new entities extracted today.';
                } else {
                    response = 'Command processed. Memory state updated.';
                }
                setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            }, 1000);
        }, 800);
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            initial={{ x: 100, y: 100, opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-20 right-20 w-[400px] bg-[#1a1a1a]/95 backdrop-blur-xl border border-accent/20 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 cursor-move"
        >
            {/* Header */}
            <div className="h-10 bg-accent/10 border-b border-accent/10 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2 text-accent">
                    <Bot size={16} />
                    <span className="font-bold text-sm">Mémoire Agent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs text-white/50">Online</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="h-[300px] p-4 overflow-y-auto font-mono text-sm space-y-4 cursor-text" onPointerDown={(e) => e.stopPropagation()}>
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-accent/20 text-accent' : msg.role === 'system' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white'}`}>
                            {msg.role === 'assistant' ? <Sparkles size={14} /> : msg.role === 'system' ? <Terminal size={14} /> : <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className={`p-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-black/20 text-white/80'}`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                    <div className="flex gap-2 text-white/30 text-xs items-center">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce delay-75">.</span>
                        <span className="animate-bounce delay-150">.</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/5 bg-black/20" onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => handleCommand('/recall "context"')} className="px-2 py-1 rounded bg-white/5 hover:bg-accent/20 text-xs text-accent border border-accent/10 whitespace-nowrap transition-colors">
                        /recall "context"
                    </button>
                    <button onClick={() => handleCommand('/analyze --graph')} className="px-2 py-1 rounded bg-white/5 hover:bg-blue-500/20 text-xs text-blue-400 border border-blue-500/10 whitespace-nowrap transition-colors">
                        /analyze --graph
                    </button>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        readOnly
                        placeholder="Ask Mémoire..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                    />
                    <Send size={14} className="absolute right-3 top-3 text-white/30" />
                </div>
            </div>
        </motion.div>
    );
};

export default AgentWindow;
