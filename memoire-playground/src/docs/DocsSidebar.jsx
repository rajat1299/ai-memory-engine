import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useDocsSearch } from './DocsSearchContext';
import { Search } from 'lucide-react';

export const sections = [
    {
        title: 'Introduction',
        items: [
            { title: 'Introduction', slug: 'introduction' },
        ],
    },
    {
        title: 'Getting Started',
        items: [
            { title: 'Quick Start', slug: 'quick-start' },
            { title: 'Installation', slug: 'installation' },
            { title: 'Basic Usage', slug: 'basic-usage' },
        ],
    },
    {
        title: 'Core Concepts',
        items: [
            { title: 'Architecture', slug: 'architecture' },
            { title: 'Memory Types', slug: 'memory-types' },
            { title: 'Supersession', slug: 'supersession' },
            { title: 'Extraction Pipeline', slug: 'extraction-pipeline' },
        ],
    },
    {
        title: 'Python SDK',
        items: [
            { title: 'Installation', slug: 'sdk-installation' },
            { title: 'Auto-Memory', slug: 'auto-memory' },
            { title: 'Power User API', slug: 'power-user-api' },
            { title: 'Async Usage', slug: 'async-usage' },
        ],
    },
    {
        title: 'REST API',
        items: [
            { title: 'Authentication', slug: 'authentication' },
            { title: 'Endpoints', slug: 'endpoints' },
            { title: 'Error Handling', slug: 'error-handling' },
        ],
    },
    {
        title: 'Configuration',
        items: [
            { title: 'Environment Variables', slug: 'environment-variables' },
            { title: 'LLM Providers', slug: 'llm-providers' },
            { title: 'Database Setup', slug: 'database-setup' },
        ],
    },
    {
        title: 'Self-Hosting',
        items: [
            { title: 'Docker Deployment', slug: 'docker-deployment' },
            { title: 'Production Checklist', slug: 'production-checklist' },
        ],
    },
    {
        title: 'Contributing',
        items: [
            { title: 'Contributing', slug: 'contributing' },
        ],
    },
];

// Helper component to highlight search matches
const HighlightMatch = ({ text, query }) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span key={i} className="bg-accent/20 text-text rounded-[2px] px-0.5">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const DocsSidebar = () => {
    const { query, setQuery } = useDocsSearch();

    // Filter sections based on search query
    const filteredSections = useMemo(() => {
        if (!query) return sections;

        const lowerQuery = query.toLowerCase();

        return sections.map(section => {
            // Check if section title matches
            const sectionMatches = section.title.toLowerCase().includes(lowerQuery);

            // Filter items that match
            const filteredItems = section.items.filter(item =>
                item.title.toLowerCase().includes(lowerQuery)
            );

            // If section matches, show all items (context is helpful)
            // If section doesn't match but items do, show only matching items
            if (sectionMatches) {
                return section;
            } else if (filteredItems.length > 0) {
                return { ...section, items: filteredItems };
            }

            return null;
        }).filter(Boolean); // Remove null sections
    }, [query]);

    return (
        <nav className="space-y-8">
            {filteredSections.length > 0 ? (
                filteredSections.map((section) => (
                    <div key={section.title}>
                        <h3 className="font-display font-bold text-text mb-4 text-xs uppercase tracking-widest opacity-50">
                            {section.title}
                        </h3>
                        <ul className="space-y-2 border-l border-border pl-4">
                            {section.items.map((item) => (
                                <li key={item.slug}>
                                    <NavLink
                                        to={`/docs/${item.slug}`}
                                        className={({ isActive }) =>
                                            `block text-sm transition-colors duration-200 ${isActive
                                                ? 'text-accent font-bold translate-x-1'
                                                : 'text-muted-foreground hover:text-text'
                                            }`
                                        }
                                    >
                                        {query ? (
                                            <HighlightMatch text={item.title} query={query} />
                                        ) : (
                                            item.title
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                    <Search className="w-8 h-8 mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No results found for</p>
                    <p className="text-sm font-medium text-text">"{query}"</p>
                    <button
                        onClick={() => setQuery('')}
                        className="mt-4 text-xs text-accent hover:underline"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </nav>
    );
};

export default DocsSidebar;
