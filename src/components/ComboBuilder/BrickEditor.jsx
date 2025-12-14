import React, { useState } from 'react';
import { ArrowLeft, Ban, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const BrickEditor = ({
    combo,
    setCombo,
    onBack,
    onAddCard: propAddCard,
    activeZone,
    setActiveZone,
    deck,
    onView
}) => {
    const [selectedCardUid, setSelectedCardUid] = useState(null);

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

    const handleCardClick = (cardUid) => {
        setActiveZone('bricks');
        if (selectedCardUid === cardUid) {
            setSelectedCardUid(null);
        } else {
            setSelectedCardUid(cardUid);
        }
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
                            Define cards that make this combo impossible if drawn.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">

                {/* Active Selection Zone */}
                <div
                    onClick={() => setActiveZone('bricks')}
                    className={`
                        p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all shrink-0
                        ${isActive
                            ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}
                    `}
                >
                    <Ban className={`w-8 h-8 mb-2 ${isActive ? 'text-red-400' : 'text-slate-600'}`} />
                    <p className={`font-bold ${isActive ? 'text-red-300' : 'text-slate-400'}`}>
                        {isActive ? "Search & Tap cards to Add Bricks..." : "Tap here to Add Bricks"}
                    </p>
                </div>

                {/* Bricks Grid */}
                {bricks.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Defined Bricks ({bricks.length})</h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {bricks.map((card) => {
                                const isMissing = !checkInDeck(card);
                                return (
                                    <div key={card.uid} className="relative group">
                                        <YgoCard
                                            card={card}
                                            className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`}
                                            onView={onView}
                                            isSelected={selectedCardUid === card.uid}
                                            onClick={() => handleCardClick(card.uid)}
                                            onRemove={() => removeBrick(card.uid)}
                                        />
                                        {/* Fallback missing indicator if needed, though mostly visual */}
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
