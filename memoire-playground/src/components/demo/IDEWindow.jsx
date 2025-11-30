import React, { useState } from 'react';
import { FileCode, FileJson, Folder, ChevronRight, ChevronDown, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

const files = {
    'memory_config.py': {
        icon: FileCode,
        language: 'python',
        content: `from memoire import MemoryClient, Config

# Initialize the Sidecar Brain
config = Config(
    project_id="memoire-demo-v1",
    api_key="mem_live_...",
    storage_mode="hybrid" # Vector + SQL
)

client = MemoryClient(config)

# Configure Conscious Memory
client.conscious.set_identity({
    "role": "Senior Engineer",
    "preferences": ["Python", "AsyncIO", "Dark Mode"]
})`
    },
    'agent.py': {
        icon: FileCode,
        language: 'python',
        content: `async def process_user_input(user_id, text):
    # 1. Retrieve context from Sidecar
    context = await client.recall(
        user_id=user_id,
        query=text,
        filters={"time_range": "last_30_days"}
    )
    
    # 2. Inject into LLM prompt
    prompt = f"""
    Context: {context.summary}
    User: {text}
    """
    
    return await llm.generate(prompt)`
    },
    'docker-compose.yml': {
        icon: FileJson,
        language: 'yaml',
        content: `version: '3.8'
services:
  app:
    build: .
    
  memoire-sidecar:
    image: memoire/sidecar:latest
    environment:
      - POSTGRES_URL=postgresql://...
      - REDIS_URL=redis://...
    ports:
      - "8000:8000"`
    }
};

const IDEWindow = () => {
    const [activeFile, setActiveFile] = useState('memory_config.py');
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="w-full h-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col font-mono text-sm">
            {/* Title Bar */}
            <div className="h-10 bg-[#252525] flex items-center px-4 border-b border-white/5 justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                </div>
                <div className="text-white/30 text-xs">memoire-demo — {activeFile}</div>
                <div className="w-10"></div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-[#252525] border-r border-white/5 transition-all duration-300 flex flex-col`}>
                    <div className="p-2 text-xs font-bold text-white/50 uppercase tracking-wider flex items-center justify-between">
                        <span>Explorer</span>
                        <Menu size={14} className="cursor-pointer hover:text-white" onClick={() => setSidebarOpen(false)} />
                    </div>
                    <div className="px-2 py-1">
                        <div className="flex items-center gap-1 text-white/70 mb-1">
                            <ChevronDown size={14} />
                            <Folder size={14} className="text-blue-400" />
                            <span className="font-bold">MEMOIRE-DEMO</span>
                        </div>
                        <div className="pl-4 space-y-1">
                            {Object.keys(files).map((fileName) => {
                                const FileIcon = files[fileName].icon;
                                return (
                                    <div
                                        key={fileName}
                                        onClick={() => setActiveFile(fileName)}
                                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${activeFile === fileName ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <FileIcon size={14} className={fileName.endsWith('yml') ? 'text-yellow-400' : 'text-blue-300'} />
                                        <span>{fileName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                    {/* Tabs */}
                    <div className="flex bg-[#252525] overflow-x-auto no-scrollbar">
                        {Object.keys(files).map((fileName) => (
                            <div
                                key={fileName}
                                onClick={() => setActiveFile(fileName)}
                                className={`px-4 py-2 flex items-center gap-2 text-xs border-r border-white/5 cursor-pointer min-w-fit ${activeFile === fileName ? 'bg-[#1e1e1e] text-white border-t-2 border-t-accent' : 'text-white/50 hover:bg-[#2a2a2a]'
                                    }`}
                            >
                                {(() => {
                                    const TabIcon = files[fileName].icon;
                                    return <TabIcon size={14} className={fileName.endsWith('yml') ? 'text-yellow-400' : 'text-blue-300'} />;
                                })()}
                                <span>{fileName}</span>
                                {activeFile === fileName && <X size={12} className="ml-2 hover:text-red-400" />}
                            </div>
                        ))}
                    </div>

                    {/* Code Content */}
                    <div className="flex-1 p-6 overflow-auto">
                        <pre className="font-mono text-sm leading-relaxed">
                            <code className="language-python">
                                {files[activeFile].content.split('\n').map((line, i) => (
                                    <div key={i} className="table-row">
                                        <span className="table-cell text-right pr-4 text-white/20 select-none w-8">{i + 1}</span>
                                        <div dangerouslySetInnerHTML={{
                                            __html: line
                                                .replace(/</g, '&lt;')
                                                .replace(/>/g, '&gt;')
                                                .replace(/import|from|def|class|return|async|await/g, '<span class="text-purple-400">$&</span>')
                                                .replace(/"[^"]*"/g, '<span class="text-green-400">$&</span>')
                                                .replace(/#.*/g, '<span class="text-white/40">$&</span>')
                                                .replace(/self|config|client/g, '<span class="text-red-300">$&</span>')
                                        }} />
                                    </div>
                                ))}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IDEWindow;
