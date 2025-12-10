import React from 'react';
import { ArrowLeft, Ban, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const BrickEditor = ({
    combo,
    setCombo,
    onBack,
    onAddCard: propAddCard, // Passed from parent if needed, but managing via activeZone in parent
    activeZone,
    setActiveZone,
    deck,
    onView
}) => {

    const checkInDeck = (card) => {
        if (!deck) return true;
        const allDeckCards = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const deckIds = new Set(allDeckCards.map(c => c.id));
        const deckNames = new Set(allDeckCards.map(c => c.name));

        if (card.id && deckIds.has(card.id)) return true;
        if (card.name && deckNames.has(card.name)) return true;
        return false;
    };

    const removeBrick = (brickUid) => {
        setCombo(prev => ({
            ...prev,
            bricks: prev.bricks?.filter(b => b.uid !== brickUid) || []
        }));
    };

    const bricks = combo.bricks || [];
    const isActive = activeZone === 'bricks';

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={onBack} className="!p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Ban className="w-5 h-5 text-red-400" />
                            Combo Bricks
                        </h2>
                        <p className="text-slate-400 text-xs">
                            Define cards that make this combo impossible if drawn (e.g. Garnets).
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">

                {/* Active Selection Zone */}
                <div
                    onClick={() => setActiveZone('bricks')}
                    className={`
                        p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                        ${isActive
                            ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}
                    `}
                >
                    <Ban className={`w-8 h-8 mb-2 ${isActive ? 'text-red-400' : 'text-slate-600'}`} />
                    <p className={`font-bold ${isActive ? 'text-red-300' : 'text-slate-400'}`}>
                        {isActive ? "Search & Click cards to Adding Bricks..." : "Click to Add Bricks"}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 text-center max-w-md">
                        A combo is considered "Bricked" only if you draw ALL copies of a brick card from your deck.
                    </p>
                </div>

                {/* Bricks List */}
                {bricks.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Defined Bricks</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {bricks.map((card) => {
                                const isMissing = !checkInDeck(card);
                                return (
                                    <div key={card.uid} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 relative">
                                                <YgoCard card={card} className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`} onView={onView} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-300 text-sm">{card.name}</div>
                                                <div className="text-[10px] text-slate-500">Stops combo if 0 left in deck</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeBrick(card.uid)}
                                            className="text-slate-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
