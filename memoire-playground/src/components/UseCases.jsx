import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Database,
    Search,
    GitBranch,
    FileText,
    Slack,
    Mail,
    CheckCircle2,
    ArrowRight,
    Clock,
    Tag,
    Link as LinkIcon,
    Brain,
    Sparkles
} from "lucide-react";

// Utility for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// UI Components
const Card = ({ className, children, ...props }) => (
    <div className={cn("rounded-xl border border-border bg-card text-text shadow", className)} {...props}>
        {children}
    </div>
);

const Badge = ({ className, variant = "default", children, ...props }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-text",
    };
    return (
        <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant], className)} {...props}>
            {children}
        </div>
    );
};

const USE_CASES = [
    {
        id: "remember",
        title: "Automatically Remember",
        description: "Memori captures chat turns and classifies them into facts, preferences, and rules.",
        icon: MessageSquare
    },
    {
        id: "recall",
        title: "Targeted Recall",
        description: "Pulls only relevant context across conversations and documents.",
        icon: Database
    },
    {
        id: "semantic",
        title: "Selective Semantic Search",
        description: "Enriches searches with semantic context for better accuracy and lower costs.",
        icon: Search
    },
    {
        id: "lineage",
        title: "Explainable Results",
        description: "Trace relevance by entity, time, and source for every result.",
        icon: GitBranch
    }
];

export function UseCases() {
    const [activeTab, setActiveTab] = useState("remember");

    return (
        <section id="use-cases" className="py-32 bg-secondary/30">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl font-display font-medium mb-4">Built for the Agentic Future</h2>
                    <p className="text-xl text-muted-foreground">
                        A complete memory lifecycle management system, not just a vector store.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Navigation Tabs */}
                    <div className="lg:w-1/3 space-y-2">
                        {USE_CASES.map((useCase) => (
                            <button
                                key={useCase.id}
                                onClick={() => setActiveTab(useCase.id)}
                                className={cn(
                                    "w-full text-left p-6 rounded-xl transition-all duration-300 border border-transparent flex items-start gap-4 group",
                                    activeTab === useCase.id
                                        ? "bg-bg border-border shadow-sm"
                                        : "hover:bg-bg/50 hover:border-border/50"
                                )}
                            >
                                <div className={cn(
                                    "p-3 rounded-lg transition-colors",
                                    activeTab === useCase.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground group-hover:text-text"
                                )}>
                                    <useCase.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className={cn(
                                        "font-medium text-lg mb-1 transition-colors font-display",
                                        activeTab === useCase.id ? "text-text" : "text-muted-foreground group-hover:text-text"
                                    )}>
                                        {useCase.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-body">
                                        {useCase.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Demo Stage */}
                    <div className="lg:w-2/3 bg-bg border border-border rounded-2xl shadow-xl overflow-hidden min-h-[500px] relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none" />

                        <div className="p-8 h-full flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {activeTab === "remember" && <AutoRememberDemo key="remember" />}
                                {activeTab === "recall" && <TargetedRecallDemo key="recall" />}
                                {activeTab === "semantic" && <SemanticSearchDemo key="semantic" />}
                                {activeTab === "lineage" && <LineageDemo key="lineage" />}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Demo Components ---

function AutoRememberDemo() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 2500);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-6 h-[400px]">
            {/* Chat Side */}
            <div className="flex flex-col gap-4 border-r border-border pr-6">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Live Conversation</div>
                <div className="flex flex-col gap-4">
                    <ChatBubble
                        role="user"
                        text="I need to deploy the new auth service to prod."
                        visible={step >= 0}
                    />
                    <ChatBubble
                        role="agent"
                        text="I can help. Do you want to use the standard blue-green deployment?"
                        visible={step >= 1}
                    />
                    <ChatBubble
                        role="user"
                        text="No, let's do a canary release. And remember, I always prefer verbose logging."
                        visible={step >= 2}
                    />
                </div>
            </div>

            {/* Extraction Side */}
            <div className="flex flex-col gap-4">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">Memory Extraction</div>
                <div className="space-y-3">
                    <ExtractionCard
                        type="GOAL"
                        content="Deploy auth service to prod"
                        visible={step >= 0}
                        delay={0.5}
                    />
                    <ExtractionCard
                        type="PREFERENCE"
                        content="Prefers canary release over blue-green"
                        visible={step >= 2}
                        delay={0.5}
                        highlight
                    />
                    <ExtractionCard
                        type="RULE"
                        content="Always use verbose logging"
                        visible={step >= 2}
                        delay={1}
                        highlight
                    />
                </div>
            </div>
        </div>
    );
}

function ChatBubble({ role, text, visible }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0 }}
            className={cn(
                "p-3 rounded-2xl text-sm max-w-[90%] font-body",
                role === 'user'
                    ? "bg-text text-bg self-end rounded-br-none"
                    : "bg-secondary text-text self-start rounded-bl-none"
            )}
        >
            {text}
        </motion.div>
    );
}

function ExtractionCard({ type, content, visible, delay, highlight }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={visible ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ delay }}
            className={cn(
                "p-3 rounded-lg border bg-card shadow-sm flex items-start gap-3",
                highlight ? "border-accent/50 bg-accent/5" : "border-border"
            )}
        >
            <Badge variant="outline" className={cn(
                "text-[10px] px-1.5 py-0.5 h-5 rounded-sm font-mono",
                type === 'GOAL' && "bg-blue-500/10 text-blue-600 border-blue-200",
                type === 'PREFERENCE' && "bg-purple-500/10 text-purple-600 border-purple-200",
                type === 'RULE' && "bg-red-500/10 text-red-600 border-red-200"
            )}>
                {type}
            </Badge>
            <span className="text-xs text-text font-medium font-body">{content}</span>
        </motion.div>
    );
}


function TargetedRecallDemo() {
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStage((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8 h-[400px]">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <div className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-bg flex items-center text-sm text-muted-foreground font-body">
                    How do I configure the <span className="text-text font-medium mx-1">production database</span>?
                </div>
                <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                />
            </div>

            {/* Context Stream */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { icon: Slack, src: "Slack", title: "#eng-core", type: "irrelevant" },
                    { icon: FileText, src: "Docs", title: "DB Setup Guide", type: "relevant" },
                    { icon: Mail, src: "Email", title: "Q3 Planning", type: "irrelevant" },
                    { icon: FileText, src: "Wiki", title: "Env Variables", type: "relevant" },
                    { icon: Slack, src: "Slack", title: "#random", type: "irrelevant" },
                    { icon: Database, src: "Schema", title: "prod_users", type: "relevant" },
                ].map((item, i) => (
                    <ContextCard
                        key={i}
                        item={item}
                        isRelevant={item.type === "relevant"}
                        stage={stage}
                        index={i}
                    />
                ))}
            </div>

            {/* Result Window */}
            <motion.div
                className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={stage >= 1 ? { opacity: 1, y: 0 } : { opacity: 0 }}
            >
                <Brain className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium text-text font-body">
                    Constructed Context: {stage === 2 ? "100% Relevant" : "Processing..."}
                </span>
            </motion.div>
        </div>
    );
}

function ContextCard({ item, isRelevant, stage, index }) {
    const shouldDim = stage >= 1 && !isRelevant;
    const shouldHighlight = stage >= 1 && isRelevant;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: shouldDim ? 0.3 : 1,
                scale: shouldHighlight ? 1.05 : (shouldDim ? 0.9 : 1),
                y: shouldHighlight ? -5 : 0,
                borderColor: shouldHighlight ? "var(--accent)" : "var(--border)"
            }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border p-4 rounded-lg flex flex-col gap-2 items-center justify-center text-center shadow-sm"
        >
            <item.icon className={cn("w-6 h-6", shouldHighlight ? "text-accent" : "text-muted-foreground")} />
            <div className="text-xs font-medium font-body">{item.src}</div>
            <div className="text-[10px] text-muted-foreground truncate w-full font-body">{item.title}</div>
            {stage >= 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                        "absolute top-2 right-2 w-2 h-2 rounded-full",
                        isRelevant ? "bg-green-500" : "bg-red-300"
                    )}
                />
            )}
        </motion.div>
    );
}

function SemanticSearchDemo() {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8 h-[400px] justify-center">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-2 font-mono">USER QUERY</div>
                    <Card className="p-4 flex items-center gap-3 border-muted-foreground/20 bg-muted/20">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm italic font-body">"That thing from last week"</span>
                    </Card>
                </div>

                <motion.div
                    animate={step >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0.5, scale: 0.8 }}
                    className="flex flex-col items-center gap-2"
                >
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    <div className="px-2 py-1 bg-accent/10 rounded text-[10px] font-mono text-accent font-bold">ENRICH</div>
                </motion.div>

                <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-2 font-mono">SEMANTIC CONTEXT</div>
                    <Card className={cn(
                        "p-4 border-accent/30 bg-accent/5 transition-all duration-500",
                        step >= 1 ? "opacity-100 translate-x-0" : "opacity-50 -translate-x-4"
                    )}>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-[10px]">Time: Last 7 Days</Badge>
                            <Badge variant="secondary" className="text-[10px]">Topic: Project Omega</Badge>
                            <Badge variant="secondary" className="text-[10px]">Type: Meeting Notes</Badge>
                        </div>
                    </Card>
                </div>
            </div>

            <div className="space-y-3">
                <div className="text-xs text-muted-foreground font-mono">RESULTS</div>
                {[
                    { title: "Project Omega Architecture Review", date: "Tuesday, 2:00 PM", score: 0.98 },
                    { title: "Weekly Sync Notes", date: "Monday, 10:00 AM", score: 0.45 },
                ].map((res, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={step >= 2 ? { opacity: i === 0 ? 1 : 0.4, y: 0 } : { opacity: 0 }}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-lg border",
                            i === 0 ? "bg-bg border-green-500/50 shadow-md" : "bg-muted/30 border-transparent"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-medium font-body">{res.title}</div>
                                <div className="text-xs text-muted-foreground font-body">{res.date}</div>
                            </div>
                        </div>
                        <Badge variant="outline" className={cn("font-mono", i === 0 ? "text-green-600 bg-green-50 border-green-200" : "text-muted-foreground")}>
                            {res.score}
                        </Badge>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function LineageDemo() {
    return (
        <div className="w-full max-w-xl h-[400px] flex items-center justify-center">
            <motion.div
                className="relative w-full"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
                }}
            >
                {/* Main Result Card */}
                <motion.div
                    variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
                    className="bg-card border border-border rounded-xl p-6 shadow-lg relative z-10"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Slack className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-medium font-display">API Key Rotation Policy</h4>
                                <p className="text-xs text-muted-foreground font-body">#security-announcements</p>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">95% Match</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-body">
                        "All service keys must be rotated every 90 days. Use the `vault-rotate` CLI tool..."
                    </p>

                    <div className="flex gap-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                            <Clock className="w-3 h-3" />
                            <span>Ingested 2h ago</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                            <Tag className="w-3 h-3" />
                            <span>Entity: Security</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                            <LinkIcon className="w-3 h-3" />
                            <span>Source: Slack API</span>
                        </div>
                    </div>
                </motion.div>

                {/* Lineage Connectors (Decorations) */}
                <motion.div
                    variants={{ hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                    className="absolute -top-12 -right-12 bg-accent/10 backdrop-blur-sm border border-accent/20 p-4 rounded-lg w-48 shadow-sm z-0"
                >
                    <div className="text-[10px] font-mono text-accent font-bold mb-1">WHY THIS RESULT?</div>
                    <div className="text-xs text-muted-foreground font-body">Matched "key rotation" entity with high temporal relevance (today).</div>
                    <div className="absolute bottom-0 left-0 w-0.5 h-8 bg-accent translate-y-full -translate-x-[2px]" />
                </motion.div>

                <motion.div
                    variants={{ hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
                    className="absolute -bottom-8 -left-4 bg-muted/50 backdrop-blur-sm border border-border p-3 rounded-lg flex items-center gap-2 z-20"
                >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium font-body">Verified Source</span>
                </motion.div>

            </motion.div>
        </div>
    );
}

export default UseCases;
