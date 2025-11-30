import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const DocsTOC = () => {
    const [activeId, setActiveId] = useState('');
    const [headings, setHeadings] = useState([]);
    const location = useLocation();

    useEffect(() => {
        const updateHeadings = () => {
            const elements = Array.from(document.querySelectorAll('main h2, main h3'));
            const items = elements.map((el) => ({
                id: el.id,
                text: el.innerText,
                level: el.tagName === 'H2' ? 2 : 3,
            }));
            setHeadings(items);

            // Re-observe for intersection
            if (items.length > 0) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                setActiveId(entry.target.id);
                            }
                        });
                    },
                    { rootMargin: '-100px 0px -80% 0px' }
                );
                elements.forEach((el) => observer.observe(el));
                return () => observer.disconnect();
            }
        };

        // Initial update
        updateHeadings();

        // Watch for DOM changes in main content (since ReactMarkdown renders async)
        const mainElement = document.querySelector('main');
        if (mainElement) {
            const mutationObserver = new MutationObserver(updateHeadings);
            mutationObserver.observe(mainElement, { childList: true, subtree: true });
            return () => mutationObserver.disconnect();
        }
    }, [location.pathname]);

    if (headings.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider">On this page</h4>
            <ul className="space-y-2 text-sm border-l border-border pl-4">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={`transition-all duration-200 ${heading.level === 3 ? 'pl-4' : ''}`}
                    >
                        <a
                            href={`#${heading.id}`}
                            className={`block transition-colors ${activeId === heading.id
                                ? 'text-accent font-medium -ml-[17px] border-l-2 border-accent pl-4'
                                : 'text-muted-foreground hover:text-text'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(heading.id);
                                if (element) {
                                    // Use scrollIntoView with block: 'start' which respects scroll-margin-top
                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    // Manually set active ID to avoid flicker
                                    setActiveId(heading.id);
                                    // Update URL hash without scrolling
                                    window.history.pushState(null, '', `#${heading.id}`);
                                }
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DocsTOC;
