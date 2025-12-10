import React, { useState } from 'react';
import { Trash2, TrendingUp, Download, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const DeckEditor = ({ deck, setDeck, onRemoveCard, onView }) => {
    const [activeSection, setActiveSection] = useState('main'); // main, extra, side

    const handleDragOver = (e) => {
        e.preventDefault();
        // DnD logic placeholder
    };

    // Sort helper
    const getCardRank = (card) => {
        if (card.type.includes('Monster')) return 1;
        if (card.type === 'Spell Card') return 2;
        if (card.type === 'Trap Card') return 3;
        return 4;
    };

    const rawCards = deck[activeSection] || [];

    // Create a sorted copy
    const currentCards = [...rawCards].sort((a, b) => {
        const rankA = getCardRank(a);
        const rankB = getCardRank(b);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/80">
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {['main', 'extra', 'side'].map(section => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`
                px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all
                ${activeSection === section
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'}
              `}
                        >
                            {section} ({deck[section]?.length || 0})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">
                        {deck.main.length} Main | {deck.extra.length} Extra | {deck.side.length} Side
                    </span>
                </div>
            </div>

            {/* Deck Grid */}
            <div
                className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-950/30"
                onDragOver={handleDragOver}
            >
                {currentCards.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
                        <p>Your {activeSection} deck is empty</p>
                        <p className="text-sm">Click cards in the search panel to add them</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {currentCards.map((card, index) => (
                            <div key={`${card.id}-${index}`} className="relative group">
                                <YgoCard
                                    card={card}
                                    className="hover:scale-105 transition-transform"
                                    onView={onView}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        onRemoveCard(activeSection, index);
                                    }}
                                />
                                <button
                                    onClick={() => onRemoveCard(activeSection, index)}
                                    className="absolute -top-2 -right-2 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
