import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type Phase = 'drift' | 'gather' | 'connect';
type FactCategory = 'biographical' | 'work_context' | 'user_preference' | 'relationship' | 'learning';

interface Memory {
  id: number;
  text: string;
  category: FactCategory;
  x: number;
  y: number;
}

interface Scenario {
  question: string;
  relevantIds: number[];
  answer: string;
}

interface FloatingMemoryProps {
  memory: Memory;
  phase: Phase;
  isRelevant: boolean;
  gatherPosition?: { x: number; y: number };
}

// ============================================================================
// Constants
// ============================================================================

const cn = (...classes: (string | boolean | undefined)[]) => 
  classes.filter(Boolean).join(" ");

const TIMING = {
  DRIFT: 2500,
  GATHER: 1500,
  CONNECT: 3000,
} as const;

// Positions are percentages - keep away from edges
const MEMORIES: Memory[] = [
  { id: 1, text: "Lives in Austin, Texas", category: "biographical", x: 15, y: 20 },
  { id: 2, text: "Works at OpenAI", category: "work_context", x: 75, y: 18 },
  { id: 3, text: "Partner is Sarah", category: "relationship", x: 12, y: 60 },
  { id: 4, text: "Learning Rust", category: "learning", x: 78, y: 70 },
  { id: 5, text: "Prefers dark mode", category: "user_preference", x: 50, y: 12 },
  { id: 6, text: "Is a Staff Engineer", category: "work_context", x: 80, y: 45 },
  { id: 7, text: "Loves hiking", category: "user_preference", x: 18, y: 78 },
  { id: 8, text: "Allergic to peanuts", category: "biographical", x: 65, y: 82 },
];

const SCENARIOS: Scenario[] = [
  {
    question: "Where do I live?",
    relevantIds: [1],
    answer: "Austin, Texas"
  },
  {
    question: "What's my job?",
    relevantIds: [2, 6],
    answer: "Staff Engineer at OpenAI"
  },
  {
    question: "Dietary restrictions?",
    relevantIds: [8],
    answer: "Allergic to peanuts"
  },
  {
    question: "Weekend plans?",
    relevantIds: [7, 3],
    answer: "Hiking with Sarah"
  },
];

// Pre-defined gather positions around center (so cards don't overlap)
const GATHER_POSITIONS: { x: number; y: number }[] = [
  { x: 25, y: 35 },   // top-left
  { x: 75, y: 35 },   // top-right
  { x: 20, y: 65 },   // bottom-left
  { x: 80, y: 65 },   // bottom-right
  { x: 50, y: 25 },   // top-center
  { x: 50, y: 75 },   // bottom-center
];

const CATEGORY_COLORS: Record<FactCategory, string> = {
  biographical: "bg-purple-100/80 border-purple-300/50 text-purple-800",
  work_context: "bg-blue-100/80 border-blue-300/50 text-blue-800",
  user_preference: "bg-amber-100/80 border-amber-300/50 text-amber-800",
  relationship: "bg-pink-100/80 border-pink-300/50 text-pink-800",
  learning: "bg-emerald-100/80 border-emerald-300/50 text-emerald-800",
};

// ============================================================================
// Main Component
// ============================================================================

export function HeroDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('drift');
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const currentScenario = SCENARIOS[scenarioIndex];

  const sleep = useCallback((ms: number, signal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });
    });
  }, []);

  const runSequence = useCallback(async (signal: AbortSignal) => {
    try {
      while (!signal.aborted) {
        while (!isVisibleRef.current && !signal.aborted) {
          await sleep(100, signal);
        }

        setPhase('drift');
        await sleep(TIMING.DRIFT, signal);

        if (!isVisibleRef.current) continue;
        setPhase('gather');
        await sleep(TIMING.GATHER, signal);

        if (!isVisibleRef.current) continue;
        setPhase('connect');
        await sleep(TIMING.CONNECT, signal);

        setScenarioIndex(prev => (prev + 1) % SCENARIOS.length);
      }
    } catch {
      // Aborted
    }
  }, [sleep]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    abortRef.current = new AbortController();
    runSequence(abortRef.current.signal);

    return () => {
      observer.disconnect();
      abortRef.current?.abort();
    };
  }, [runSequence]);

  // Assign gather positions to relevant memories
  const getGatherPosition = (memoryId: number): { x: number; y: number } | undefined => {
    const relevantIndex = currentScenario.relevantIds.indexOf(memoryId);
    if (relevantIndex === -1) return undefined;
    return GATHER_POSITIONS[relevantIndex % GATHER_POSITIONS.length];
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-7xl mx-auto h-[500px] md:h-[550px] bg-bg rounded-3xl border border-border overflow-hidden shadow-xl"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-accent/[0.03] to-secondary/50" />
      
      {/* Floating Memories */}
      {MEMORIES.map((memory) => (
        <FloatingMemory
          key={memory.id}
          memory={memory}
          phase={phase}
          isRelevant={currentScenario.relevantIds.includes(memory.id)}
          gatherPosition={getGatherPosition(memory.id)}
        />
      ))}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DF6C25" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#DF6C25" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {phase !== 'drift' && currentScenario.relevantIds.map((id, index) => {
          const memory = MEMORIES.find(m => m.id === id);
          if (!memory) return null;
          const gatherPos = GATHER_POSITIONS[index % GATHER_POSITIONS.length];
          return (
            <motion.line
              key={`line-${id}`}
              x1={`${gatherPos.x}%`}
              y1={`${gatherPos.y}%`}
              x2="50%"
              y2="50%"
              stroke="url(#lineGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: phase === 'connect' ? 1 : 0.6, 
                opacity: phase === 'connect' ? 0.7 : 0.3 
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          );
        })}
      </svg>

      {/* Central Question & Answer */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
        <div className="flex flex-col items-center">
          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenario.question}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <div className={cn(
                "px-8 py-5 rounded-2xl shadow-lg backdrop-blur-sm flex items-center gap-3 transition-colors duration-300",
                phase === 'drift' 
                  ? "bg-white/60 text-text/60" 
                  : "bg-white text-text border border-accent/20"
              )}>
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                  phase === 'connect' ? "bg-accent" : "bg-text/20"
                )} />
                <span className="text-xl md:text-2xl font-display font-medium">
                  {currentScenario.question}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Answer */}
          <AnimatePresence>
            {phase === 'connect' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="mt-4"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-px bg-gradient-to-b from-accent/50 to-transparent" />
                  <div className="px-6 py-3 bg-accent text-white rounded-xl shadow-lg text-base md:text-lg font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {currentScenario.answer}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FloatingMemory
// ============================================================================

function FloatingMemory({ memory, phase, isRelevant, gatherPosition }: FloatingMemoryProps) {
  const isGathering = phase !== 'drift' && isRelevant && gatherPosition;
  const isFading = phase !== 'drift' && !isRelevant;

  // Target position
  const targetX = isGathering ? gatherPosition.x : memory.x;
  const targetY = isGathering ? gatherPosition.y : memory.y;

  return (
    <motion.div
      initial={{ 
        left: `${memory.x}%`, 
        top: `${memory.y}%`,
        x: "-50%",
        y: "-50%",
        opacity: 0,
      }}
      animate={{
        left: `${targetX}%`,
        top: `${targetY}%`,
        x: "-50%",
        y: "-50%",
        opacity: isFading ? 0.2 : 1,
        scale: isGathering ? 1.05 : 1,
        filter: isFading ? "blur(2px)" : "blur(0px)",
      }}
      transition={{
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{ zIndex: isGathering ? 25 : 10 }}
      className="absolute"
    >
      <div className={cn(
        "px-4 py-2 rounded-full text-sm font-body font-medium border whitespace-nowrap select-none transition-shadow duration-300",
        isGathering
          ? "bg-white border-accent/50 text-text shadow-md ring-1 ring-accent/30"
          : cn(CATEGORY_COLORS[memory.category], "shadow-sm")
      )}>
        {memory.text}
      </div>
    </motion.div>
  );
}

export default HeroDemo;
