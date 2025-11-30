import React from 'react';
import { NavLink } from 'react-router-dom';

const sections = [
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

const DocsSidebar = () => {
    return (
        <nav className="space-y-8">
            {sections.map((section) => (
                <div key={section.title}>
                    <h3 className="font-display font-bold text-text mb-4">{section.title}</h3>
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
                                    {item.title}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};

export default DocsSidebar;
