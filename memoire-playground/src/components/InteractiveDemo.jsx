import React from 'react';
import IDEWindow from './demo/IDEWindow';
import AgentWindow from './demo/AgentWindow';

const InteractiveDemo = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="mb-12 text-center">
                <h2 className="text-3xl md:text-5xl font-display font-light mb-4">
                    Experience the <span className="text-accent italic">Sidecar</span>.
                </h2>
                <p className="text-text/70 font-body max-w-xl mx-auto">
                    Interact with the demo below. Drag the agent window, explore the code, and see how Mémoire integrates into your workflow.
                </p>
            </div>

            <div className="relative w-full h-[600px] md:h-[700px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#121212]">
                {/* Background Wallpaper */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1c] to-[#0f0f0f]">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                </div>

                {/* Demo Container */}
                <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center">
                    <div className="w-full h-full max-w-5xl relative">
                        <IDEWindow />
                        <AgentWindow />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InteractiveDemo;
