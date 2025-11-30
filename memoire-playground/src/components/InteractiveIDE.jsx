import React, { useState } from "react";
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
    Command
} from "lucide-react";

// Utility for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Mock Data for the IDE
const FILES = {
    'main.py': {
        name: 'main.py',
        language: 'python',
        content: `import memory_client
import os

client = memory_client.Client(
    os.getenv("MEMORY_URL")
)

def process_query(user_input: str):
    # 1. Retrieve relevant context
    context = client.search(
        query=user_input,
        limit=3,
        agent_id="agent_007"
    )
    
    print(f"Found {len(context)} memories")
    return context

if __name__ == "__main__":
    process_query("How do I reset?")`
    },
    'memory_config.json': {
        name: 'memory_config.json',
        language: 'json',
        content: `{
  "storage": {
    "type": "postgres",
    "connection_string": "..."
  },
  "vector_index": {
    "dimensions": 1536,
    "metric": "cosine"
  },
  "retention": "30d"
}`
    },
    'agent_logs.txt': {
        name: 'agent_logs.txt',
        language: 'plaintext',
        content: `[INFO] Agent initialized
[INFO] Connected to Memory Sidecar at :9000
[INFO] Ingesting context from /docs
[SUCCESS] Indexed 452 chunks in 1.2s
[QUERY] "How do I reset?"
[MATCH] Found relevant memory (score: 0.92)
[RESPONSE] Generated answer based on context`
    }
};

const SIDEBAR_ITEMS = [
    { id: 'explorer', icon: FileCode, label: 'Explorer' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'database', icon: Database, label: 'Memory View' },
    { id: 'debug', icon: Activity, label: 'Debug' },
];

function IDEComponent() {
    const [activeFile, setActiveFile] = useState('main.py');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSidebarItem, setActiveSidebarItem] = useState('explorer');
    const [terminalOpen, setTerminalOpen] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    // Mock running state
    const handleRun = () => {
        setIsRunning(true);
        setTimeout(() => setIsRunning(false), 2000);
    };

    return (
        <div className="w-full max-w-6xl mx-auto perspective-1000 font-sans">
            <motion.div
                initial={{ rotateX: 5, opacity: 0, y: 50 }}
                whileInView={{ rotateX: 0, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden flex flex-col h-[600px] relative group"
            >
                {/* Window Chrome */}
                <div className="h-10 bg-[#2d2d2d] flex items-center justify-between px-4 border-b border-black/20 select-none">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-2 group-hover:gap-3 transition-all">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                            <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Activity className="w-3 h-3" />
                        <span>Memory Studio</span>
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
                    <div className="w-12 bg-[#252526] flex flex-col items-center py-4 gap-6 border-r border-black/20 z-10">
                        {SIDEBAR_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveSidebarItem(item.id);
                                    setSidebarOpen(true);
                                }}
                                className={cn(
                                    "p-2 rounded-md transition-all relative group/tooltip",
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
                                animate={{ width: 240, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="bg-[#252526] border-r border-black/20 flex flex-col"
                            >
                                <div className="h-9 flex items-center px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">
                                    {SIDEBAR_ITEMS.find(i => i.id === activeSidebarItem)?.label}
                                </div>

                                {activeSidebarItem === 'explorer' && (
                                    <div className="flex-1 py-2">
                                        <div className="px-2 mb-2">
                                            <div className="flex items-center gap-1 text-xs text-gray-400 font-bold px-2 py-1">
                                                <ChevronRight className="w-3 h-3 rotate-90" />
                                                PROJECT
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
                                                        {file.language === 'python' && <div className="w-3 h-3 text-blue-400">Py</div>}
                                                        {file.language === 'json' && <div className="w-3 h-3 text-yellow-400">{'{ }'}</div>}
                                                        {file.language === 'plaintext' && <FileCode className="w-3 h-3 text-gray-400" />}
                                                        {file.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSidebarItem === 'database' && (
                                    <div className="p-4 space-y-4">
                                        <div className="bg-black/20 rounded p-3 border border-white/5">
                                            <div className="text-xs text-gray-400 mb-2">Memory Usage</div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-1">
                                                <div className="h-full w-[45%] bg-accent" />
                                            </div>
                                            <div className="flex justify-between text-[10px] text-gray-500">
                                                <span>2.4GB Used</span>
                                                <span>128GB Total</span>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 rounded p-3 border border-white/5">
                                            <div className="text-xs text-gray-400 mb-2">Vector Index</div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-gray-500">Dimensions</span>
                                                    <span className="text-gray-300 font-mono">1536</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-gray-500">Metric</span>
                                                    <span className="text-gray-300 font-mono">cosine</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-gray-500">Entities</span>
                                                    <span className="text-gray-300 font-mono">14,203</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-[#1e1e1e] relative">
                        {/* Editor Tabs */}
                        <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar">
                            {Object.values(FILES).map(file => (
                                <div
                                    key={file.name}
                                    onClick={() => setActiveFile(file.name)}
                                    className={cn(
                                        "h-full flex items-center gap-2 px-3 text-xs border-r border-black/20 cursor-pointer min-w-[120px] group",
                                        activeFile === file.name ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-gray-500 hover:bg-[#2d2d2d]/80"
                                    )}
                                >
                                    <span>{file.name}</span>
                                    <X className="w-3 h-3 opacity-0 group-hover:opacity-100 ml-auto hover:text-white" />
                                </div>
                            ))}
                        </div>

                        {/* Code Content */}
                        <div className="flex-1 p-4 font-mono text-sm overflow-auto relative">
                            {/* Syntax Highlighting Simulation */}
                            <pre className="text-[#d4d4d4] leading-relaxed">
                                <code dangerouslySetInnerHTML={{
                                    __html: highlightSyntax(FILES[activeFile].content, FILES[activeFile].language)
                                }} />
                            </pre>

                            {/* Floating Action Button */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={handleRun}
                                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded text-xs font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    <Play className="w-3 h-3 fill-current" />
                                    Run Agent
                                </button>
                            </div>
                        </div>

                        {/* Terminal Panel */}
                        <AnimatePresence>
                            {terminalOpen && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 200 }}
                                    exit={{ height: 0 }}
                                    className="border-t border-white/10 bg-[#1e1e1e]"
                                >
                                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="text-white border-b border-accent pb-2 -mb-2.5">TERMINAL</span>
                                            <span className="hover:text-white cursor-pointer">OUTPUT</span>
                                            <span className="hover:text-white cursor-pointer">DEBUG CONSOLE</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Maximize2 className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer" />
                                            <X
                                                className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer"
                                                onClick={() => setTerminalOpen(false)}
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 font-mono text-xs text-gray-300 h-full overflow-auto pb-10">
                                        <div className="flex items-center gap-2 text-gray-500 mb-2">
                                            <span>$</span>
                                            <span className="text-white">python main.py</span>
                                        </div>
                                        {isRunning && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-1"
                                            >
                                                <div className="text-blue-400">[INFO] Starting Memory Agent v1.0.2...</div>
                                                <div className="text-yellow-400">[WARN] No existing index found, creating new...</div>
                                                <div>[INFO] Connected to sidecar at localhost:9000</div>
                                                <div className="animate-pulse">Processing...</div>
                                            </motion.div>
                                        )}
                                        {!isRunning && (
                                            <div className="opacity-50">
                                                <div className="text-blue-400">[INFO] Starting Memory Agent v1.0.2...</div>
                                                <div>[INFO] Connected to sidecar at localhost:9000</div>
                                                <div className="text-green-400">[SUCCESS] Agent ready to accept queries.</div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 animate-pulse">
                                            <span className="text-green-500">➜</span>
                                            <span className="w-2 h-4 bg-gray-500/50 block" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="h-6 bg-[#007acc] flex items-center px-3 justify-between text-[10px] text-white select-none">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Command className="w-3 h-3" />
                            <span>master*</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            <span>0 errors</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span>Ln 12, Col 34</span>
                        <span>UTF-8</span>
                        <span>Python 3.10</span>
                        <div className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            <span>Memory: Connected</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Decorative Elements behind the IDE */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -z-10" />
        </div>
    );
}

// Helper to simulate syntax highlighting
function highlightSyntax(code, language) {
    if (language === 'json') {
        return code
            .replace(/"(.*?)":/g, '<span class="text-[#9cdcfe]">$1</span>:')
            .replace(/: "(.*?)"/g, ': <span class="text-[#ce9178]">"$1"</span>')
            .replace(/: (\d+)/g, ': <span class="text-[#b5cea8]">$1</span>');
    }

    // Basic Python Highlighting
    return code
        .replace(/(import|from|def|return|if|else)/g, '<span class="text-[#c586c0]">$1</span>')
        .replace(/(print|len)/g, '<span class="text-[#dcdcaa]">$1</span>')
        .replace(/(".*?")/g, '<span class="text-[#ce9178]">$1</span>')
        .replace(/(#.*)/g, '<span class="text-[#6a9955]">$1</span>')
        .replace(/(client|context)/g, '<span class="text-[#9cdcfe]">$1</span>')
        .replace(/([A-Z][a-zA-Z0-9_]*)\(/g, '<span class="text-[#4ec9b0]">$1</span>(');
}

export default function InteractiveIDE() {
    return (
        <section className="py-32 container mx-auto px-6 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-display font-medium mb-4">Developer Experience First</h2>
                <p className="text-xl text-text/70 font-body">
                    We obsessed over the API so you don't have to. It's clean, typed, and predictable.
                </p>
            </div>

            <IDEComponent />
        </section>
    );
}
