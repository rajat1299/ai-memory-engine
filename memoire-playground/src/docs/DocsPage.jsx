import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DocsLayout from './DocsLayout';
import DocsContent from './DocsContent';

const DocsPage = () => {
    return (
        <DocsLayout>
            <Routes>
                <Route path="/" element={<Navigate to="introduction" replace />} />
                <Route path=":slug" element={<DocsContent />} />
            </Routes>
        </DocsLayout>
    );
};

export default DocsPage;
