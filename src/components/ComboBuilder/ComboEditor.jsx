import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
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
    const [selectedCardUid, setSelectedCardUid] = useState(null);

    // Helper to check card existence in deck
    const checkInDeck = (card) => {
        if (!deck) return true;
        const allDeckCards = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const deckIds = new Set(allDeckCards.map(c => c.id));
        const deckNames = new Set(allDeckCards.map(c => c.name));

        if (card.id && deckIds.has(card.id)) return true;
        if (card.name && deckNames.has(card.name)) return true;
        return false;
    };

    // --- Handlers ---
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

    const handleCardClick = (cardUid, zoneId) => {
        setActiveZone(zoneId); // Ensure zone is active when clicking card
        if (selectedCardUid === cardUid) {
            setSelectedCardUid(null);
        } else {
            setSelectedCardUid(cardUid);
        }
    };

    const isInputsActive = activeZone !== 'outputs'; // Default/Group IDs are inputs

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-slate-900/95 backdrop-blur shadow-md p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 lg:gap-4 flex-1 mr-2">
                    <Button variant="secondary" onClick={onCancel} className="!p-2 flex-shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <input
                        type="text"
                        value={combo.name}
                        onChange={e => setCombo(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-transparent text-lg lg:text-2xl font-bold text-white border-none focus:ring-0 focus:outline-none placeholder-slate-600 w-full min-w-0"
                        placeholder="Combo Name..."
                    />
                </div>
                <Button onClick={onSave} className="bg-green-600 hover:bg-green-500 flex-shrink-0 whitespace-nowrap">
                    <Save className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Save</span>
                </Button>
            </div>

            {/* Content Container - Flex Col on Mobile, Row on Desktop */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-6 pb-20 lg:pb-0">

                {/* Inputs Section */}
                <div className={`
                    flex-col rounded-xl border transition-all duration-300
                    ${activeZone !== 'outputs' ? 'flex flex-1' : 'hidden lg:flex lg:w-1/3 opacity-50 hover:opacity-100'}
                    ${activeZone !== 'outputs' ? 'bg-slate-800/50 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-slate-900/30 border-slate-800'}
                `}>
                    {/* Header (Accordion Toggle on Mobile) */}
                    <div
                        className="p-4 flex justify-between items-center cursor-pointer lg:cursor-default"
                        onClick={() => setActiveZone('inputs')}
                    >
                        <h3 className="font-bold text-lg text-purple-400 flex items-center gap-2">
                            Requirements
                            <span className="lg:hidden text-xs text-slate-500 font-normal">(Tap to Expand)</span>
                        </h3>
                        {activeZone !== 'outputs' ? <ChevronUp className="lg:hidden w-4 h-4" /> : <ChevronDown className="lg:hidden w-4 h-4" />}

                        <Button className="text-xs" variant="secondary" onClick={(e) => { e.stopPropagation(); addGroup(); }}>
                            <Plus className="w-3 h-3 mr-1" /> Group
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-0 space-y-4">
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
                                                Group {groupIdx + 1}
                                            </span>
                                            {isGroupActive && (
                                                <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">
                                                    SELECTED (OR)
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); removeGroup(group.id); }} className="text-slate-600 hover:text-red-400 p-1">
                                            <span className="sr-only">Delete Group</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                        </button>
                                    </div>

                                    <div className={`flex flex-wrap gap-2 min-h-[60px] rounded p-2 border border-dashed transition-colors ${isGroupActive ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-950/30 border-slate-800'}`}>
                                        {group.cards.length === 0 && (
                                            <div className="w-full text-center text-xs text-slate-600 italic py-2">
                                                {isGroupActive
                                                    ? "Add cards (Alternatives)"
                                                    : "Click group to select"}
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
                                                        <YgoCard
                                                            card={card}
                                                            className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`}
                                                            onView={onView}
                                                            isSelected={selectedCardUid === card.uid}
                                                            onClick={() => handleCardClick(card.uid, group.id)}
                                                            onRemove={() => removeCardFromGroup(group.id, card.uid)}
                                                        />
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
                                No requirements. Click "+ Group".
                            </div>
                        )}
                    </div>
                </div>

                {/* Outputs Section */}
                <div className={`
                    flex-col rounded-xl border transition-all duration-300
                    ${activeZone === 'outputs' ? 'flex flex-1' : 'hidden lg:flex lg:w-1/3 opacity-50 hover:opacity-100'}
                    ${activeZone === 'outputs' ? 'bg-slate-800/50 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-slate-900/30 border-slate-800'}
                `}>
                    <div
                        className="p-4 cursor-pointer lg:cursor-default flex justify-between items-center"
                        onClick={() => setActiveZone('outputs')}
                    >
                        <h3 className="font-bold text-lg text-green-400 flex items-center gap-2">
                            Outcomes
                            <span className="lg:hidden text-xs text-slate-500 font-normal">(Tap to Expand)</span>
                        </h3>
                        {activeZone === 'outputs' ? <ChevronUp className="lg:hidden w-4 h-4" /> : <ChevronDown className="lg:hidden w-4 h-4" />}
                    </div>

                    <div className="p-4 pt-0">
                        <div className="flex flex-wrap gap-3">
                            {combo.outputs.map(card => {
                                const isMissing = !checkInDeck(card);
                                return (
                                    <div key={card.uid} className="relative group/card w-24">
                                        <YgoCard
                                            card={card}
                                            className={`w-full ${isMissing ? 'grayscale opacity-75' : ''}`}
                                            onView={onView}
                                            isSelected={selectedCardUid === card.uid}
                                            onClick={() => handleCardClick(card.uid, 'outputs')}
                                            onRemove={() => removeOutput(card.uid)}
                                        />
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
        </div>
    );
};
