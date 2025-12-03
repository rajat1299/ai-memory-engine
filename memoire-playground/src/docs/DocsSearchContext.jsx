import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const DocsSearchContext = createContext();

export const useDocsSearch = () => {
    const context = useContext(DocsSearchContext);
    if (!context) {
        throw new Error('useDocsSearch must be used within DocsSearchProvider');
    }
    return context;
};

export const DocsSearchProvider = ({ children }) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Keyboard shortcut to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Forward slash (but not when already in an input)
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            // Escape to clear and blur
            if (e.key === 'Escape' && document.activeElement === inputRef.current) {
                inputRef.current?.blur();
                setQuery('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const value = {
        query,
        setQuery,
        inputRef,
    };

    return (
        <DocsSearchContext.Provider value={value}>
            {children}
        </DocsSearchContext.Provider>
    );
};
