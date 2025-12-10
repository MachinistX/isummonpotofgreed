import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const ComboEditor = ({
    combo,
    setCombo,
    onSave,
    onCancel,
    activeZone,
    setActiveZone,
    onAddCard,
    deck,
    onView
}) => {
    // Helper to check card existence in deck
    const checkInDeck = (card) => {
        if (!deck) return true; // Assume present if deck not loaded? Or safe default.
        const allDeckCards = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const deckIds = new Set(allDeckCards.map(c => c.id));
        const deckNames = new Set(allDeckCards.map(c => c.name));

        if (card.id && deckIds.has(card.id)) return true;
        if (card.name && deckNames.has(card.name)) return true;
        return false;
    };

    // ... Handlers (Add/Remove Group/Card) ...
    const addGroup = () => {
        setCombo(prev => ({
            ...prev,
            inputs: [...prev.inputs, { id: crypto.randomUUID(), cards: [] }]
        }));
    };

    const removeGroup = (groupId) => {
        setCombo(prev => ({
            ...prev,
            inputs: prev.inputs.filter(g => g.id !== groupId)
        }));
    };

    const removeCardFromGroup = (groupId, cardUid) => {
        setCombo(prev => ({
            ...prev,
            inputs: prev.inputs.map(g => {
                if (g.id !== groupId) return g;
                return { ...g, cards: g.cards.filter(c => c.uid !== cardUid) };
            })
        }));
    };

    const removeOutput = (cardUid) => {
        setCombo(prev => ({
            ...prev,
            outputs: prev.outputs.filter(c => c.uid !== cardUid)
        }));
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={onCancel} className="!p-2">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <input
                        type="text"
                        value={combo.name}
                        onChange={e => setCombo(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-transparent text-2xl font-bold text-white border-none focus:ring-0 focus:outline-none placeholder-slate-600 w-full"
                        placeholder="Combo Name..."
                    />
                </div>
                <Button onClick={onSave} className="bg-green-600 hover:bg-green-500">
                    <Save className="w-4 h-4 mr-2" />
                    Save Combo
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex gap-6">
                {/* Inputs Column */}
                <div className={`flex-1 rounded-xl border p-4 transition-colors ${activeZone === 'inputs' ? 'bg-slate-800/50 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-slate-900/30 border-slate-800'
                    }`} onClick={() => setActiveZone('inputs')}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-purple-400">Requirements (Hand)</h3>
                        <Button className="text-xs" variant="secondary" onClick={(e) => { e.stopPropagation(); addGroup(); }}>
                            <Plus className="w-3 h-3 mr-1" /> Group
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {combo.inputs.map((group, groupIdx) => {
                            const isGroupActive = activeZone === group.id;
                            return (
                                <div
                                    key={group.id}
                                    onClick={(e) => { e.stopPropagation(); setActiveZone(group.id); }}
                                    className={`
                                        rounded-lg p-3 border relative group/box transition-all cursor-pointer
                                        ${isGroupActive
                                            ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-1 ring-blue-500'
                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}
                                    `}
                                >
                                    <div className={`absolute -left-3 top-1/2 -mt-3 text-xs py-1 px-2 rounded-full border font-bold z-10 ${isGroupActive ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                        {groupIdx === 0 ? 'START' : 'AND'}
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${isGroupActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                                Requirement Group {groupIdx + 1}
                                            </span>
                                            {isGroupActive && (
                                                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                                                    SELECTED (OR)
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} className="text-slate-600 hover:text-red-400">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className={`flex flex-wrap gap-2 min-h-[60px] rounded p-2 border border-dashed transition-colors ${isGroupActive ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-950/30 border-slate-800'}`}>
                                        {group.cards.length === 0 && (
                                            <div className="w-full text-center text-xs text-slate-600 italic py-2">
                                                {isGroupActive
                                                    ? "Add cards to this group (Alternatives)"
                                                    : "Click group to select it"}
                                            </div>
                                        )}
                                        {group.cards.map((card, cardIdx) => {
                                            const isMissing = !checkInDeck(card);
                                            return (
                                                <div key={card.uid} className="relative group/card flex items-center">
                                                    {cardIdx > 0 && (
                                                        <div className="absolute -left-3 text-[10px] font-bold text-slate-500 bg-slate-900 px-0.5 rounded z-10">OR</div>
                                                    )}
                                                    <div className="w-20 relative">
                                                        <YgoCard card={card} className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`} onView={onView} />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeCardFromGroup(group.id, card.uid); }}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        {isMissing && (
                                                            <div className="absolute inset-0 border-2 border-orange-500 rounded pointer-events-none flex items-center justify-center">
                                                                <AlertCircle className="w-6 h-6 text-orange-500 bg-black/50 rounded-full" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                        {combo.inputs.length === 0 && (
                            <div className="text-center py-8 text-slate-600 italic">
                                No requirements. Click "+ Group" to start.
                            </div>
                        )}
                    </div>
                </div>

                {/* Outputs Column */}
                <div className={`flex-1 rounded-xl border p-4 transition-colors ${activeZone === 'outputs' ? 'bg-slate-800/50 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-slate-900/30 border-slate-800'
                    }`} onClick={() => setActiveZone('outputs')}>
                    <h3 className="font-bold text-lg text-green-400 mb-4">Outcomes (Board)</h3>

                    <div className="flex flex-wrap gap-3">
                        {combo.outputs.map(card => {
                            const isMissing = !checkInDeck(card);
                            return (
                                <div key={card.uid} className="relative group/card w-24">
                                    <YgoCard card={card} className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`} onView={onView} />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeOutput(card.uid); }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {isMissing && (
                                        <div className="absolute inset-0 border-2 border-orange-500 rounded pointer-events-none flex items-center justify-center">
                                            <AlertCircle className="w-8 h-8 text-orange-500 bg-black/50 rounded-full" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {combo.outputs.length === 0 && (
                            <div className="w-full text-center py-8 text-slate-600 italic">
                                Select this zone and click cards to add Endboard results.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
