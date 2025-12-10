import React, { useState } from 'react';
import { Hammer, BarChart, Settings, Calculator, Network } from 'lucide-react';

export const Layout = ({ children }) => {
    const [activeTab, setActiveTab] = useState('builder'); // builder, simulator, settings, combos

    // This state management generally should be lifted up or using Context/Router, 
    // but for this MVP structure we can handle it here or pass callbacks.
    // Actually, let's just make this a wrapper and handle navigation in App.jsx.
    // But to make it reusable, I'll pass activeTab and onTabChange.

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg">
                            <Hammer className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            DeckMaster
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        <NavButton
                            active={window.location.hash === '#builder' || window.location.hash === ''}
                            icon={<Hammer className="w-4 h-4" />}
                            label="Deck Builder"
                            onClick={() => window.location.hash = 'builder'}
                        />
                        <NavButton
                            active={window.location.hash === '#combos'}
                            icon={<Network className="w-4 h-4" />}
                            label="Combo Builder"
                            onClick={() => window.location.hash = 'combos'}
                        />
                        <NavButton
                            active={window.location.hash === '#simulator'}
                            icon={<Calculator className="w-4 h-4" />}
                            label="Test Hands"
                            onClick={() => window.location.hash = 'simulator'}
                        />
                        <NavButton
                            active={window.location.hash === '#analysis'}
                            icon={<BarChart className="w-4 h-4" />}
                            label="Analysis"
                            onClick={() => window.location.hash = 'analysis'}
                        />
                    </div>


                    <div className="w-10">
                        {/* Placeholder for user/settings */}
                        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                            <Settings className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {children}
            </main>
        </div>
    );
};

const NavButton = ({ active, icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`
      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
      ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}
    `}
    >
        {icon}
        {label}
    </button>
);
