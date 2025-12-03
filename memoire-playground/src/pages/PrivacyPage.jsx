import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-bg text-text selection:bg-accent selection:text-bg">
            <Navbar />
            <main className="pt-32 pb-24 container mx-auto px-6 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">Privacy Policy</h1>
                <p className="text-muted-foreground mb-12 text-lg">Last Updated: 12/01/2025</p>

                <div className="prose prose-lg prose-invert max-w-none prose-headings:font-display prose-headings:text-text prose-p:text-text/80 prose-strong:text-text prose-li:text-text/80">
                    <p>
                        This Privacy Policy explains how Mémoire ("we", "us", or "our") collects, uses, and discloses information. This policy applies to our public website and demonstration environment (the "Demo").
                    </p>

                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 my-8 not-prose">
                        <p className="text-accent font-medium m-0">
                            <strong>Important:</strong> Mémoire is primarily an open-source software project. If you are self-hosting Mémoire on your own infrastructure, we do not collect, process, or have access to any of your data. This policy only applies when you interact with our hosted services and website.
                        </p>
                    </div>

                    <h3>1. Information We Collect</h3>
                    <p>We believe in data minimization. We only collect what is necessary to operate our website and Demo.</p>

                    <h4>A. Information You Provide (The Demo)</h4>
                    <p>When you use our interactive Demo:</p>
                    <ul>
                        <li><strong>Chat Inputs:</strong> We process the text queries and messages you send to the AI agent to generate responses and demonstrate memory features.</li>
                        <li><strong>Session Data:</strong> We store the facts extracted from your conversation (the "memories") in a temporary database to allow the Demo to function.</li>
                        <li><strong>API Credentials:</strong> If you input your own API keys (e.g., OpenAI API Key) into the Demo, they are stored locally in your browser via LocalStorage. We do not save your API keys to our servers.</li>
                    </ul>

                    <h4>B. Technical Information (Server Logs)</h4>
                    <p>Like most websites, our servers automatically record certain information when you visit:</p>
                    <ul>
                        <li><strong>Log Data:</strong> Internet Protocol (IP) address, browser type, and operating system.</li>
                        <li><strong>Usage Data:</strong> Pages visited, time spent, and other standard usage statistics.</li>
                    </ul>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use the information we collect strictly for:</p>
                    <ul>
                        <li><strong>Providing the Service:</strong> To operate the interactive Demo and display the capabilities of the Mémoire engine.</li>
                        <li><strong>AI Processing:</strong> Your chat inputs are sent to third-party LLM providers (such as OpenAI or Anthropic) to generate responses and extract memory facts.</li>
                        <li><strong>Security & Debugging:</strong> To detect potential attacks (e.g., DDoS) and fix bugs in the Demo.</li>
                    </ul>
                    <p>We do not sell your personal data.</p>

                    <h3>3. Self-Hosted Instances</h3>
                    <p>If you download the Mémoire source code (e.g., from GitHub) and run it on your own servers ("Self-Hosted"):</p>
                    <ul>
                        <li>You are the data controller.</li>
                        <li>We have no access to your database, logs, or user interactions.</li>
                        <li>You are responsible for your own compliance with privacy laws (GDPR, CCPA, etc.) regarding your users.</li>
                    </ul>

                    <h3>4. Third-Party Services</h3>
                    <p>Our Demo utilizes third-party AI models to function. When you send a message in the Demo, data is transmitted to:</p>
                    <ul>
                        <li><strong>LLM Providers:</strong> (e.g., OpenAI, Anthropic, or OpenRouter) for text generation and embedding.</li>
                    </ul>
                    <p>Please refer to their respective privacy policies for how they handle API data.</p>

                    <h3>5. Cookies and Local Storage</h3>
                    <ul>
                        <li><strong>Local Storage:</strong> We use browser Local Storage to save your session preferences and API keys client-side so you don't have to re-enter them on refresh.</li>
                        <li><strong>Cookies:</strong> We do not currently use tracking cookies for advertising.</li>
                    </ul>

                    <h3>6. Data Retention</h3>
                    <p>
                        <strong>Demo Data:</strong> Data entered into the public Demo is considered ephemeral. We may periodically wipe the Demo database to maintain performance and privacy. Do not enter sensitive personal or confidential information into the public Demo.
                    </p>

                    <h3>7. Contact Us</h3>
                    <p>
                        If you have questions about this policy or the Mémoire project, please contact us via GitHub Issues or at <a href="mailto:rajattiwari1099@gmail.com" className="text-accent hover:underline">rajattiwari1099@gmail.com</a>.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPage;
