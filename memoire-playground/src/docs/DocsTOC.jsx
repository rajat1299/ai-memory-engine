import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const DocsTOC = () => {
    const [activeId, setActiveId] = useState('');
    const [headings, setHeadings] = useState([]);
    const location = useLocation();
    const observerRef = useRef(null);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    // Update headings when content changes
    useEffect(() => {
        const updateHeadings = () => {
            const elements = Array.from(document.querySelectorAll('main h2, main h3'));
            const items = elements.map((el) => ({
                id: el.id,
                text: el.innerText,
                level: el.tagName === 'H2' ? 2 : 3,
            }));
            setHeadings(items);
        };

        // Initial update with a small delay to ensure DOM is ready
        const timer = setTimeout(updateHeadings, 100);

        // Watch for DOM changes (ReactMarkdown renders asynchronously)
        const mainElement = document.querySelector('main');
        if (mainElement) {
            const mutationObserver = new MutationObserver(() => {
                updateHeadings();
            });
            mutationObserver.observe(mainElement, { childList: true, subtree: true });

            return () => {
                clearTimeout(timer);
                mutationObserver.disconnect();
            };
        }

        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Scroll spy: Track active section based on scroll position
    useEffect(() => {
        if (headings.length === 0) return;

        const headingElements = headings
            .map(({ id }) => document.getElementById(id))
            .filter(Boolean);

        if (headingElements.length === 0) return;

        // Track which headings are currently visible
        const visibleHeadingsMap = new Map();

        const observer = new IntersectionObserver(
            (entries) => {
                // Skip updates if we're programmatically scrolling
                if (isScrollingRef.current) return;

                entries.forEach((entry) => {
                    const id = entry.target.id;
                    if (entry.isIntersecting) {
                        // Store the heading's position for later comparison
                        visibleHeadingsMap.set(id, entry.boundingClientRect.top);
                    } else {
                        visibleHeadingsMap.delete(id);
                    }
                });

                // Find the topmost visible heading (closest to top of viewport)
                if (visibleHeadingsMap.size > 0) {
                    const sortedHeadings = Array.from(visibleHeadingsMap.entries())
                        .sort((a, b) => a[1] - b[1]);

                    // The heading with the smallest (most negative or least positive) top value
                    // is the one that's currently "active"
                    const [activeHeadingId] = sortedHeadings[0];
                    setActiveId(activeHeadingId);
                } else {
                    // No headings visible - check if we're at the top or bottom
                    const firstHeading = headingElements[0];
                    const lastHeading = headingElements[headingElements.length - 1];

                    const firstRect = firstHeading.getBoundingClientRect();
                    const lastRect = lastHeading.getBoundingClientRect();

                    // If first heading is below viewport, we're at top of page
                    if (firstRect.top > window.innerHeight / 2) {
                        setActiveId(headings[0].id);
                    }
                    // If last heading is above viewport, we're at bottom
                    else if (lastRect.bottom < window.innerHeight / 2) {
                        setActiveId(headings[headings.length - 1].id);
                    }
                }
            },
            {
                // Trigger when heading is in top 20% of viewport
                rootMargin: '-10% 0px -80% 0px',
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        headingElements.forEach((el) => observer.observe(el));
        observerRef.current = observer;

        // Handle initial hash on page load
        if (window.location.hash) {
            const id = window.location.hash.slice(1);
            if (headings.some(h => h.id === id)) {
                setActiveId(id);
            }
        }

        return () => {
            observer.disconnect();
            observerRef.current = null;
        };
    }, [headings]);

    // Handle TOC link clicks
    const handleClick = useCallback((e, headingId) => {
        e.preventDefault();

        const element = document.getElementById(headingId);
        if (!element) return;

        // Set flag to ignore observer during programmatic scroll
        isScrollingRef.current = true;

        // Update active ID immediately for instant feedback
        setActiveId(headingId);

        // Update URL hash for deep linking
        window.history.pushState(null, '', `#${headingId}`);

        // Scroll to element
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Clear the scrolling flag after animation completes
        // Smooth scroll typically takes 300-500ms, we use 800ms to be safe
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 800);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    if (headings.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-text uppercase tracking-wider">
                On this page
            </h4>
            <ul className="space-y-2 text-sm border-l border-border pl-4">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className={`transition-all duration-200 ${heading.level === 3 ? 'pl-4' : ''
                            }`}
                    >
                        <a
                            href={`#${heading.id}`}
                            className={`block transition-colors ${activeId === heading.id
                                    ? 'text-accent font-medium -ml-[17px] border-l-2 border-accent pl-4'
                                    : 'text-muted-foreground hover:text-text'
                                }`}
                            onClick={(e) => handleClick(e, heading.id)}
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
