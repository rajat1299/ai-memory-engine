import React from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Import all markdown files
import introduction from './content/introduction.md?raw';
import quickStart from './content/quick-start.md?raw';
import installation from './content/installation.md?raw';
import basicUsage from './content/basic-usage.md?raw';
import architecture from './content/architecture.md?raw';
import memoryTypes from './content/memory-types.md?raw';
import supersession from './content/supersession.md?raw';
import extractionPipeline from './content/extraction-pipeline.md?raw';
import sdkInstallation from './content/sdk-installation.md?raw';
import autoMemory from './content/auto-memory.md?raw';
import powerUserApi from './content/power-user-api.md?raw';
import asyncUsage from './content/async-usage.md?raw';
import authentication from './content/authentication.md?raw';
import endpoints from './content/endpoints.md?raw';
import errorHandling from './content/error-handling.md?raw';
import environmentVariables from './content/environment-variables.md?raw';
import llmProviders from './content/llm-providers.md?raw';
import databaseSetup from './content/database-setup.md?raw';
import dockerDeployment from './content/docker-deployment.md?raw';
import productionChecklist from './content/production-checklist.md?raw';
import contributing from './content/contributing.md?raw';

const contentMap = {
    'introduction': introduction,
    'quick-start': quickStart,
    'installation': installation,
    'basic-usage': basicUsage,
    'architecture': architecture,
    'memory-types': memoryTypes,
    'supersession': supersession,
    'extraction-pipeline': extractionPipeline,
    'sdk-installation': sdkInstallation,
    'auto-memory': autoMemory,
    'power-user-api': powerUserApi,
    'async-usage': asyncUsage,
    'authentication': authentication,
    'endpoints': endpoints,
    'error-handling': errorHandling,
    'environment-variables': environmentVariables,
    'llm-providers': llmProviders,
    'database-setup': databaseSetup,
    'docker-deployment': dockerDeployment,
    'production-checklist': productionChecklist,
    'contributing': contributing,
};

const DocsContent = () => {
    const { slug } = useParams();
    const content = contentMap[slug];

    if (!content) {
        return (
            <div className="text-center py-20">
                <h1 className="text-4xl font-display font-bold mb-4">404</h1>
                <p className="text-text/60">Page not found</p>
            </div>
        );
    }

    return (
        <div className="prose prose-lg prose-headings:font-display prose-headings:text-text prose-p:text-text/80 prose-strong:text-text prose-code:text-accent prose-pre:bg-transparent prose-pre:p-0 max-w-none 
      prose-h1:mb-16 prose-h1:text-5xl prose-h1:leading-tight
      prose-h2:mt-32 prose-h2:mb-10 prose-h2:text-3xl prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-6 prose-h2:scroll-mt-32
      prose-h3:mt-24 prose-h3:mb-8 prose-h3:text-2xl prose-h3:scroll-mt-32
      prose-p:leading-loose prose-p:mb-12 prose-p:text-lg
      prose-li:my-4 prose-ul:my-10 prose-ul:list-disc prose-ul:pl-6
      prose-table:my-16
      prose-img:rounded-xl prose-img:shadow-lg prose-img:my-16">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <div className="rounded-lg overflow-hidden my-10 border border-white/10 shadow-2xl bg-[#1e1e1e]">
                                <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-white/5">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                    </div>
                                    <span className="text-xs text-white/40 font-mono uppercase tracking-wider">{match[1]}</span>
                                </div>
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: 0, background: 'transparent', padding: '1.5rem' }}
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code className="bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono text-sm" {...props}>
                                {children}
                            </code>
                        );
                    },
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-12 border border-border rounded-xl shadow-sm">
                                <table className="min-w-full divide-y divide-border">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead({ children }) {
                        return <thead className="bg-secondary/30">{children}</thead>;
                    },
                    th({ children }) {
                        return (
                            <th className="px-8 py-4 text-left text-xs font-bold text-text uppercase tracking-wider">
                                {children}
                            </th>
                        );
                    },
                    td({ children }) {
                        return <td className="px-8 py-4 whitespace-nowrap text-sm text-text/80 border-t border-border">{children}</td>;
                    },
                    a({ href, children }) {
                        return (
                            <a href={href} className="text-accent hover:text-accent/80 hover:underline decoration-accent/30 underline-offset-4 transition-all font-medium">
                                {children}
                            </a>
                        );
                    },
                    blockquote({ children }) {
                        return (
                            <blockquote className="border-l-4 border-accent/50 pl-6 my-10 italic text-text/70 bg-secondary/20 py-4 pr-4 rounded-r-lg">
                                {children}
                            </blockquote>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default DocsContent;
