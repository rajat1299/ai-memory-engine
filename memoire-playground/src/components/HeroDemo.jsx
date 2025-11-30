import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

// Simple utility for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Types of memories that might float by
const MEMORIES = [
    { id: 1, text: "User prefers concise answers", type: "preference", x: 15, y: 15 },
    { id: 2, text: "Project launch: Oct 24th", type: "fact", x: 85, y: 20 },
    { id: 3, text: "API key rotates weekly", type: "rule", x: 10, y: 60 },
    { id: 4, text: "Team meeting notes", type: "doc", x: 80, y: 70 },
    { id: 5, text: "Favorite color: Blue", type: "preference", x: 45, y: 10 },
    { id: 6, text: "Deployment pending", type: "fact", x: 90, y: 50 },
    { id: 7, text: "User role: Admin", type: "fact", x: 20, y: 85 },
    { id: 8, text: "Region: US-East", type: "preference", x: 60, y: 85 },
];

const SCENARIOS = [
    {
        question: "When is the launch?",
        relevantIds: [2, 6],
        answer: "October 24th (Deployment pending)"
    },
    {
        question: "How should I reply?",
        relevantIds: [1],
        answer: "Concise and direct."
    },
    {
        question: "Security protocols?",
        relevantIds: [3, 7],
        answer: "Rotate API keys weekly (Admin)."
    }
];

export function HeroDemo() {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [phase, setPhase] = useState('drift');

    const currentScenario = SCENARIOS[scenarioIndex];

    useEffect(() => {
        // Animation sequence loop
        const sequence = async () => {
            while (true) {
                setPhase('drift');
                await new Promise(r => setTimeout(r, 2000)); // Drift for 2s

                setPhase('gather');
                await new Promise(r => setTimeout(r, 1500)); // Gather relevant memories

                setPhase('connect');
                await new Promise(r => setTimeout(r, 3000)); // Show connection/answer

                setScenarioIndex(prev => (prev + 1) % SCENARIOS.length);
            }
        };
        sequence();
    }, []);

    return (
        <div className="relative w-full max-w-7xl mx-auto h-[600px] bg-bg rounded-3xl border border-black/5 overflow-hidden shadow-2xl perspective-1000 flex items-center justify-center">
            {/* Organic Background Texture */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-accent/5" />

            {/* Floating Memories */}
            {MEMORIES.map((memory) => (
                <FloatingMemory
                    key={memory.id}
                    memory={memory}
                    phase={phase}
                    isRelevant={currentScenario.relevantIds.includes(memory.id)}
                />
            ))}

            {/* Central Mind / Focus Point */}
            <div className="relative z-20 flex flex-col items-center justify-center">
                {/* The Question/Focus */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentScenario.question}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.5 }}
                        className="relative z-30"
                    >
                        <div className={cn(
                            "px-10 py-6 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-500 flex items-center gap-4",
                            phase === 'drift' ? "bg-white/80 text-muted-foreground scale-90" : "bg-white text-text scale-110 border border-accent/20"
                        )}>
                            <div className={cn(
                                "w-3 h-3 rounded-full transition-colors duration-500",
                                phase === 'connect' ? "bg-accent animate-pulse" : "bg-muted-foreground/30"
                            )} />
                            <span className="text-2xl font-display font-medium">
                                {currentScenario.question}
                            </span>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* The Insight/Answer */}
                <AnimatePresence>
                    {phase === 'connect' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 50 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-6"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-12 w-0.5 bg-gradient-to-b from-accent/50 to-transparent" />
                                <div className="px-8 py-4 bg-accent text-accent-foreground rounded-xl shadow-xl text-lg font-medium flex items-center gap-3 transform hover:scale-105 transition-transform">
                                    <Sparkles className="w-5 h-5" />
                                    {currentScenario.answer}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Connection Lines (The "Thread") */}
            <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full overflow-visible">
                <AnimatePresence>
                    {phase !== 'drift' && MEMORIES.map(m => {
                        if (!currentScenario.relevantIds.includes(m.id)) return null;
                        return (
                            <ConnectionLine
                                key={`line-${m.id}`}
                                startX={`${m.x}%`}
                                startY={`${m.y}%`}
                                isConnected={phase === 'connect'}
                            />
                        );
                    })}
                </AnimatePresence>
            </svg>
        </div>
    );
}

function FloatingMemory({ memory, phase, isRelevant }) {
    // Calculate target position based on phase
    // In 'drift', random float. In 'gather', move towards center (50, 50).

    const isGathering = phase !== 'drift' && isRelevant;
    const isFading = phase !== 'drift' && !isRelevant;

    return (
        <motion.div
            layout
            initial={{ x: `${memory.x}%`, y: `${memory.y}%`, opacity: 0 }}
            animate={{
                left: isGathering ? "50%" : `${memory.x}%`,
                top: isGathering ? "50%" : `${memory.y}%`,
                x: isGathering ? (memory.x < 50 ? -180 : 180) : 0, // Stop further away for larger spacing
                y: isGathering ? (memory.y < 50 ? -80 : 80) : 0,
                opacity: isFading ? 0.1 : 1,
                scale: isGathering ? 1.2 : 1,
                filter: isFading ? "blur(4px)" : "blur(0px)"
            }}
            transition={{
                duration: isGathering ? 1.2 : 2,
                ease: "easeInOut"
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
        >
            <div className={cn(
                "px-5 py-3 rounded-full text-base font-medium border transition-colors duration-500 shadow-sm whitespace-nowrap cursor-default select-none",
                isGathering
                    ? "bg-accent/10 border-accent/40 text-accent-foreground shadow-md"
                    : "bg-white/60 border-black/5 text-muted-foreground hover:bg-white hover:shadow-md"
            )}>
                {memory.text}
            </div>
        </motion.div>
    );
}

function ConnectionLine({ startX, startY, isConnected }) {
    return (
        <motion.line
            x1={startX}
            y1={startY}
            x2="50%"
            y2="50%"
            stroke="currentColor"
            strokeWidth="2"
            className="text-accent/40"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
                pathLength: isConnected ? 1 : 0.6,
                opacity: isConnected ? 1 : 0,
                strokeDasharray: isConnected ? "none" : "8 4"
            }}
            transition={{ duration: 1 }}
        />
    );
}
