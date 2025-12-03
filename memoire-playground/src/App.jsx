import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UseCases from './components/UseCases';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import InteractiveIDE from './components/InteractiveIDE';
import Integrations from './components/Integrations';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { DemoPage } from './demo';
import DocsPage from './docs/DocsPage';
import PrivacyPage from './pages/PrivacyPage';

// Landing page component
const LandingPage = () => (
  <div className="min-h-screen bg-bg text-text selection:bg-accent selection:text-bg overflow-x-hidden">
    <Navbar />
    <main>
      <Hero />
      <UseCases />
      <ArchitectureDiagram />
      <InteractiveIDE />
      <Integrations />
      <CTASection />
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/docs/*" element={<DocsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
