import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode,
  Settings,
  Play,
  Maximize2,
  X,
  Database,
  Search,
  Activity,
  Cpu,
  ChevronRight,
  Command,
  Brain,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

type Language = 'python' | 'env' | 'plaintext';
type SidebarItemId = 'explorer' | 'search' | 'database' | 'debug';
type RunPhase = 'idle' | 'starting' | 'recalling' | 'injecting' | 'responding' | 'ingesting' | 'done';

interface FileData {
  name: string;
  language: Language;
  content: string;
}

interface SidebarItem {
  id: SidebarItemId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface Token {
  text: string;
  className: string;
}

interface CodeHighlighterProps {
  code: string;
  language: Language;
}

// ============================================================================
// Constants
// ============================================================================

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

// Real SDK code based on actual documentation
const FILES: Record<string, FileData> = {
  'main.py': {
    name: 'main.py',
    language: 'python',
    content: `from memoire import Memoire
import openai

# Initialize Mémoire with your API key
memoire = Memoire(api_key="memori_xxx")

# Wrap your OpenAI client - memory is now automatic
client = memoire.wrap(openai.OpenAI())

# Every conversation is automatically:
# 1. Checked for relevant memories (recall)
# 2. Enhanced with context (injection)
# 3. Recorded for future use (ingest)

response = client.chat.completions.create(
    model="gpt-4",
    user="user-123",  # Required: identifies the user
    messages=[
        {"role": "user", "content": "What should I do this weekend?"}
    ]
)

# Mémoire recalls: lives in Austin, loves hiking
# Response: "Since you're in Austin and love hiking..."
print(response.choices[0].message.content)`,
  },
  '.env': {
    name: '.env',
    language: 'env',
    content: `# Mémoire Backend Configuration
DATABASE_URL=postgresql+asyncpg://memori:memori@db:5432/memori
REDIS_URL=redis://redis:6379

# LLM Provider for fact extraction
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Embedding model
EMBEDDING_MODEL=text-embedding-3-small

# Or use OpenRouter (100+ models)
# LLM_PROVIDER=openrouter
# OPENROUTER_API_KEY=sk-or-your-key`,
  },
  'logs.txt': {
    name: 'logs.txt',
    language: 'plaintext',
    content: `[INFO] Mémoire SDK initialized
[INFO] Wrapping OpenAI client...
[RECALL] Query: "What should I do this weekend?"
[RECALL] Found 3 relevant facts:
  → [biographical] Lives in Austin, Texas (0.92)
  → [user_preference] Loves hiking (0.88)
  → [relationship] Partner is Sarah (0.75)
[INJECT] Added context to system prompt
[RESPONSE] Generated personalized answer
[INGEST] Recording conversation...
[EXTRACT] Queued fact extraction job
[SUCCESS] Memory cycle complete`,
  },
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'explorer', icon: FileCode, label: 'Explorer' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'database', icon: Database, label: 'Memory View' },
  { id: 'debug', icon: Activity, label: 'Debug' },
];

// Terminal output for simulated run
const TERMINAL_STEPS: { phase: RunPhase; lines: string[] }[] = [
  { phase: 'starting', lines: ['[INFO] Mémoire SDK v1.0.0', '[INFO] Connecting to backend...'] },
  { phase: 'recalling', lines: ['[RECALL] Searching memories for: "What should I do this weekend?"'] },
  { phase: 'injecting', lines: [
    '[RECALL] Found relevant facts:',
    '  → Lives in Austin, Texas (confidence: 0.92)',
    '  → Loves hiking (confidence: 0.88)',
    '[INJECT] Enhancing prompt with context...',
  ]},
  { phase: 'responding', lines: ['[LLM] Generating response...'] },
  { phase: 'ingesting', lines: ['[INGEST] Recording conversation', '[EXTRACT] Queued extraction job_abc123'] },
  { phase: 'done', lines: ['[SUCCESS] Memory cycle complete ✓'] },
];

// ============================================================================
// Syntax Highlighting (Safe, no innerHTML)
// ============================================================================

function tokenizePython(code: string): Token[][] {
  const lines = code.split('\n');
  const keywords = ['from', 'import', 'def', 'return', 'if', 'else', 'for', 'while', 'class', 'with', 'as', 'try', 'except', 'raise', 'True', 'False', 'None'];
  const builtins = ['print', 'len', 'range', 'str', 'int', 'list', 'dict'];

  return lines.map(line => {
    const tokens: Token[] = [];
    let remaining = line;
    
    while (remaining.length > 0) {
      // Check for comments
      if (remaining.startsWith('#')) {
        tokens.push({ text: remaining, className: 'text-[#6a9955]' });
        break;
      }
      
      // Check for strings
      const stringMatch = remaining.match(/^(["'])(.*?)\1/) || remaining.match(/^(["'])(.*)$/);
      if (stringMatch) {
        tokens.push({ text: stringMatch[0], className: 'text-[#ce9178]' });
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Check for f-strings
      const fstringMatch = remaining.match(/^f(["'])/);
      if (fstringMatch) {
        tokens.push({ text: 'f', className: 'text-[#ce9178]' });
        remaining = remaining.slice(1);
        continue;
      }

      // Check for keywords
      const wordMatch = remaining.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        let className = 'text-[#d4d4d4]';
        
        if (keywords.includes(word)) {
          className = 'text-[#c586c0]';
        } else if (builtins.includes(word)) {
          className = 'text-[#dcdcaa]';
        } else if (word === 'memoire' || word === 'client' || word === 'response' || word === 'openai') {
          className = 'text-[#9cdcfe]';
        } else if (word === 'Memoire' || word === 'OpenAI') {
          className = 'text-[#4ec9b0]';
        }
        
        tokens.push({ text: word, className });
        remaining = remaining.slice(word.length);
        continue;
      }

      // Check for numbers
      const numMatch = remaining.match(/^\d+/);
      if (numMatch) {
        tokens.push({ text: numMatch[0], className: 'text-[#b5cea8]' });
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // Default: single character
      tokens.push({ text: remaining[0], className: 'text-[#d4d4d4]' });
      remaining = remaining.slice(1);
    }

    return tokens;
  });
}

function tokenizeEnv(code: string): Token[][] {
  const lines = code.split('\n');
  
  return lines.map(line => {
    if (line.startsWith('#')) {
      return [{ text: line, className: 'text-[#6a9955]' }];
    }
    
    const parts = line.split('=');
    if (parts.length >= 2) {
      return [
        { text: parts[0], className: 'text-[#9cdcfe]' },
        { text: '=', className: 'text-[#d4d4d4]' },
        { text: parts.slice(1).join('='), className: 'text-[#ce9178]' },
      ];
    }
    
    return [{ text: line, className: 'text-[#d4d4d4]' }];
  });
}

function tokenizePlaintext(code: string): Token[][] {
  const lines = code.split('\n');
  
  return lines.map(line => {
    const tokens: Token[] = [];
    
    // Color log levels
    if (line.includes('[INFO]')) {
      const [before, after] = line.split('[INFO]');
      if (before) tokens.push({ text: before, className: 'text-[#d4d4d4]' });
      tokens.push({ text: '[INFO]', className: 'text-[#569cd6]' });
      if (after) tokens.push({ text: after, className: 'text-[#d4d4d4]' });
    } else if (line.includes('[RECALL]')) {
      const [before, after] = line.split('[RECALL]');
      if (before) tokens.push({ text: before, className: 'text-[#d4d4d4]' });
      tokens.push({ text: '[RECALL]', className: 'text-[#dcdcaa]' });
      if (after) tokens.push({ text: after, className: 'text-[#d4d4d4]' });
    } else if (line.includes('[INJECT]')) {
      const [before, after] = line.split('[INJECT]');
      if (before) tokens.push({ text: before, className: 'text-[#d4d4d4]' });
      tokens.push({ text: '[INJECT]', className: 'text-[#c586c0]' });
      if (after) tokens.push({ text: after, className: 'text-[#d4d4d4]' });
    } else if (line.includes('[SUCCESS]')) {
      const [before, after] = line.split('[SUCCESS]');
      if (before) tokens.push({ text: before, className: 'text-[#d4d4d4]' });
      tokens.push({ text: '[SUCCESS]', className: 'text-[#4ec9b0]' });
      if (after) tokens.push({ text: after, className: 'text-[#d4d4d4]' });
    } else if (line.includes('[EXTRACT]') || line.includes('[INGEST]') || line.includes('[RESPONSE]')) {
      const match = line.match(/\[(EXTRACT|INGEST|RESPONSE)\]/);
      if (match) {
        const idx = line.indexOf(match[0]);
        tokens.push({ text: line.slice(0, idx), className: 'text-[#d4d4d4]' });
        tokens.push({ text: match[0], className: 'text-[#9cdcfe]' });
        tokens.push({ text: line.slice(idx + match[0].length), className: 'text-[#d4d4d4]' });
      }
    } else if (line.startsWith('  →')) {
      tokens.push({ text: '  →', className: 'text-[#569cd6]' });
      tokens.push({ text: line.slice(3), className: 'text-[#ce9178]' });
    } else {
      tokens.push({ text: line, className: 'text-[#d4d4d4]' });
    }
    
    return tokens;
  });
}

function CodeHighlighter({ code, language }: CodeHighlighterProps) {
  const tokenizedLines = useMemo(() => {
    switch (language) {
      case 'python': return tokenizePython(code);
      case 'env': return tokenizeEnv(code);
      default: return tokenizePlaintext(code);
    }
  }, [code, language]);

  return (
    <pre className="leading-relaxed">
      {tokenizedLines.map((tokens, lineIndex) => (
        <div key={lineIndex} className="min-h-[1.5em]">
          {tokens.map((token, tokenIndex) => (
            <span key={tokenIndex} className={token.className}>
              {token.text}
            </span>
          ))}
        </div>
      ))}
    </pre>
  );
}

// ============================================================================
// IDE Component
// ============================================================================

function IDEComponent() {
  const [activeFile, setActiveFile] = useState<string>('main.py');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState<SidebarItemId>('explorer');
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [runPhase, setRunPhase] = useState<RunPhase>('idle');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Simulated Mémoire flow when clicking "Run Agent"
  const handleRun = useCallback(async () => {
    if (runPhase !== 'idle' && runPhase !== 'done') return;

    setTerminalLines(['$ python main.py']);
    setRunPhase('starting');

    for (const step of TERMINAL_STEPS) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setRunPhase(step.phase);
      setTerminalLines(prev => [...prev, ...step.lines]);
    }
  }, [runPhase]);

  const currentFile = FILES[activeFile];

  return (
    <div className="w-full max-w-6xl mx-auto font-sans relative">
      <motion.div
        initial={{ rotateX: 5, opacity: 0, y: 50 }}
        whileInView={{ rotateX: 0, opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: "spring" }}
        className="bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[600px] group"
      >
        {/* Window Chrome */}
        <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black/20 select-none flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-2 group-hover:gap-3 transition-all">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <Brain className="w-3 h-3 text-accent" />
            <span>Mémoire Studio</span>
            <span className="text-gray-600">—</span>
            <span>{activeFile}</span>
          </div>
          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Settings className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-pointer" />
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Activity Bar */}
          <div className="w-12 bg-[#252526] flex flex-col items-center py-4 gap-6 border-r border-black/20 z-10 flex-shrink-0">
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSidebarItem(item.id);
                  setSidebarOpen(true);
                }}
                className={cn(
                  "p-2 rounded-md transition-all relative",
                  activeSidebarItem === item.id ? "text-white bg-white/10" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                {activeSidebarItem === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Sidebar Panel */}
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 220, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-[#252526] border-r border-black/20 flex flex-col overflow-hidden flex-shrink-0"
              >
                <div className="h-9 flex items-center px-4 text-xs font-bold text-gray-400 tracking-wider uppercase flex-shrink-0">
                  {SIDEBAR_ITEMS.find(i => i.id === activeSidebarItem)?.label}
                </div>

                {activeSidebarItem === 'explorer' && (
                  <div className="flex-1 py-2 overflow-auto">
                    <div className="px-2 mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-bold px-2 py-1">
                        <ChevronRight className="w-3 h-3 rotate-90" />
                        MEMOIRE-APP
                      </div>
                      <div className="pl-2 space-y-0.5">
                        {Object.values(FILES).map((file) => (
                          <button
                            key={file.name}
                            onClick={() => setActiveFile(file.name)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-white/5 transition-colors",
                              activeFile === file.name ? "bg-[#37373d] text-white" : "text-gray-400"
                            )}
                          >
                            {file.language === 'python' && <span className="w-4 text-blue-400 text-[10px]">PY</span>}
                            {file.language === 'env' && <span className="w-4 text-yellow-400 text-[10px]">ENV</span>}
                            {file.language === 'plaintext' && <FileCode className="w-3 h-3 text-gray-400" />}
                            {file.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSidebarItem === 'database' && (
                  <div className="p-4 space-y-4 overflow-auto">
                    <div className="bg-black/20 rounded p-3 border border-white/5">
                      <div className="text-xs text-gray-400 mb-2">Stored Facts</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">biographical</span>
                          <span className="text-gray-300 font-mono">23</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">work_context</span>
                          <span className="text-gray-300 font-mono">12</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">user_preference</span>
                          <span className="text-gray-300 font-mono">45</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">relationship</span>
                          <span className="text-gray-300 font-mono">8</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded p-3 border border-white/5">
                      <div className="text-xs text-gray-400 mb-2">Vector Index</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">Embeddings</span>
                          <span className="text-gray-300 font-mono">1536d</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-500">Index</span>
                          <span className="text-gray-300 font-mono">pgvector</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
            {/* Editor Tabs */}
            <div className="h-9 bg-[#252526] flex items-center overflow-x-auto flex-shrink-0">
              {Object.values(FILES).map(file => (
                <button
                  key={file.name}
                  onClick={() => setActiveFile(file.name)}
                  className={cn(
                    "h-full flex items-center gap-2 px-3 text-xs border-r border-black/20 min-w-[100px] group/tab",
                    activeFile === file.name ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-gray-500 hover:bg-[#2d2d2d]/80"
                  )}
                >
                  <span className="truncate">{file.name}</span>
                  <X className="w-3 h-3 opacity-0 group-hover/tab:opacity-100 ml-auto hover:text-white flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 p-4 font-mono text-sm overflow-auto relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFile}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CodeHighlighter code={currentFile.content} language={currentFile.language} />
                </motion.div>
              </AnimatePresence>

              {/* Run Button */}
              {activeFile === 'main.py' && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={handleRun}
                    disabled={runPhase !== 'idle' && runPhase !== 'done'}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium shadow-lg transition-all",
                      runPhase !== 'idle' && runPhase !== 'done'
                        ? "bg-accent/50 text-white/70 cursor-wait"
                        : "bg-accent hover:bg-accent/90 text-white hover:scale-105 active:scale-95"
                    )}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    {runPhase === 'idle' || runPhase === 'done' ? 'Run Agent' : 'Running...'}
                  </button>
                </div>
              )}
            </div>

            {/* Terminal Panel */}
            <AnimatePresence>
              {terminalOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 180 }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/10 bg-[#1e1e1e] flex flex-col flex-shrink-0"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="text-white border-b border-accent pb-2 -mb-2.5">TERMINAL</span>
                      <span className="hover:text-white cursor-pointer">OUTPUT</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Maximize2 className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer" />
                      <X
                        className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer"
                        onClick={() => setTerminalOpen(false)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 p-4 font-mono text-xs text-gray-300 overflow-auto">
                    {terminalLines.length === 0 ? (
                      <div className="text-gray-500">Ready. Click "Run Agent" to see Mémoire in action.</div>
                    ) : (
                      <div className="space-y-1">
                        {terminalLines.map((line, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                              line.includes('[SUCCESS]') && 'text-green-400',
                              line.includes('[RECALL]') && 'text-yellow-400',
                              line.includes('[INJECT]') && 'text-purple-400',
                              line.includes('[EXTRACT]') && 'text-blue-400',
                              line.includes('[INGEST]') && 'text-blue-400',
                              line.startsWith('$') && 'text-gray-500',
                              line.startsWith('  →') && 'text-accent pl-2',
                            )}
                          >
                            {line}
                          </motion.div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-green-500">➜</span>
                      <span className={cn(
                        "w-2 h-4 bg-gray-500/50",
                        (runPhase === 'idle' || runPhase === 'done') && "animate-pulse"
                      )} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-accent flex items-center px-3 justify-between text-[10px] text-white select-none flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>main</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>0 errors</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>Python 3.11</span>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              <span>Mémoire: Connected</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl -z-10 pointer-events-none" />
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default function InteractiveIDE() {
  return (
    <section className="py-24 md:py-32 container mx-auto px-6 max-w-7xl">
      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-display font-medium mb-4">
          Developer Experience First
        </h2>
        <p className="text-lg md:text-xl text-text/70 font-body">
          Wrap your OpenAI client in one line. Memory recall, injection, and storage happen automatically.
        </p>
      </div>

      <IDEComponent />
    </section>
  );
}

