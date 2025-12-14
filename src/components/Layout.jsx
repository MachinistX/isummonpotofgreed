import React, { useState } from 'react';
import { Coffee, BarChart, Calculator, Network, Menu, X } from 'lucide-react';

export const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 pb-20 lg:pb-0">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg">
                            <Coffee className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                            isummonpotofgreed
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        <NavButton
                            active={window.location.hash === '#builder' || window.location.hash === ''}
                            icon={<Coffee className="w-4 h-4" />}
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

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-white/10 p-4 space-y-2 shadow-2xl animate-in slide-in-from-top-2">
                        <MobileNavButton
                            active={window.location.hash === '#builder' || window.location.hash === ''}
                            icon={<Coffee className="w-4 h-4" />}
                            label="Deck Builder"
                            onClick={() => { window.location.hash = 'builder'; closeMenu(); }}
                        />
                        <MobileNavButton
                            active={window.location.hash === '#combos'}
                            icon={<Network className="w-4 h-4" />}
                            label="Combo Builder"
                            onClick={() => { window.location.hash = 'combos'; closeMenu(); }}
                        />
                        <MobileNavButton
                            active={window.location.hash === '#simulator'}
                            icon={<Calculator className="w-4 h-4" />}
                            label="Test Hands"
                            onClick={() => { window.location.hash = 'simulator'; closeMenu(); }}
                        />
                        <MobileNavButton
                            active={window.location.hash === '#analysis'}
                            icon={<BarChart className="w-4 h-4" />}
                            label="Analysis"
                            onClick={() => { window.location.hash = 'analysis'; closeMenu(); }}
                        />
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-6 h-[calc(100vh-4rem)]">
                {children}
            </main>
        </div>
    );
};

const MobileNavButton = ({ active, icon, label, onClick }) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all
      ${active
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800'}
    `}
    >
        {icon}
        {label}
    </button>
);

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
