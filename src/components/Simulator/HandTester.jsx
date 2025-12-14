import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, ArrowRight, Shield, Swords, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';
import { drawHand, analyzeHand, checkCombos, getComboOutcome } from '../../utils/analyzer';

export const HandTester = ({ deck, combos, onView }) => {
    const [hand, setHand] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [achievedCombos, setAchievedCombos] = useState([]);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [selectedCardKey, setSelectedCardKey] = useState(null);

    // Helper: Check if a combo is "Bricked" (Any copy of a brick card is in hand)
    const isComboBricked = (combo) => {
        if (!combo.bricks || combo.bricks.length === 0) return false;

        for (const brick of combo.bricks) {
            const drawnInHand = hand.filter(c => c.name === brick.name).length;

            // Strict Garnet Logic: If we draw ANY copy, it's widely considered a brick for that engine.
            // User feedback: "If a combo is achieved, but it's brick is also in the drawn hand, the combo is not achieved."
            if (drawnInHand > 0) {
                return true;
            }
        }
        return false;
    };

    // Helper: Identify which cards in hand are "Bricks" for the *Selected* combo
    const getHandBrickStatus = (card) => {
        if (!selectedCombo || !selectedCombo.bricks) return false;
        if (!isComboBricked(selectedCombo)) return false; // Only highlight if actually bricked? Or always warn? User said "highlight the combo brick"

        // Logic Re-read: "drawing one, while other one or two are in the deck means that the combo is not bricked"
        // So we only highlight if this specific card contributed to a TOTAL brick state.

        const fullDeck = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const brickDef = selectedCombo.bricks.find(b => b.name === card.name);

        if (brickDef) {
            const totalInDeck = fullDeck.filter(c => c.name === card.name).length;
            const drawnInHand = hand.filter(c => c.name === card.name).length;
            return drawnInHand >= totalInDeck; // Highlight only if we drew all of them
        }
        return false;
    };

    const handleDraw = () => {
        if (deck.length < 40) {
            alert("Main deck must have at least 40 cards!");
            return;
        }
        const newHand = drawHand(deck, 5);
        setHand(newHand);
        setAnalysis(analyzeHand(newHand));
        setSelectedCardKey(null);

        const matches = checkCombos(newHand, combos);
        setAchievedCombos(matches);
        setSelectedCombo(matches.length > 0 ? matches[0] : null);
    };

    const handleCardClick = (key) => {
        if (selectedCardKey === key) {
            setSelectedCardKey(null);
        } else {
            setSelectedCardKey(key);
        }
    };

    const outcome = selectedCombo ? getComboOutcome(hand, selectedCombo) : null;
    const isSelectedBricked = selectedCombo ? isComboBricked(selectedCombo) : false;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-300">
                    Hand Simulator
                </h2>
                <Button onClick={handleDraw} className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20">
                    <RefreshCw className="w-4 h-4" />
                    Draw 5 Cards
                </Button>
            </div>

            {hand.length > 0 ? (
                <div className="space-y-8">
                    {/* The Cards */}
                    <div className="flex justify-center gap-4 flex-wrap">
                        {hand.map((card, idx) => {
                            const isDead = analysis?.deadCards.some(d => d.card === card);
                            const isHandTrap = analysis?.handTraps.includes(card);

                            // Check if this card is a "Garnet" (defined as a brick in ANY known combo)
                            const isGarnet = combos.some(c => c.bricks?.some(b => b.name === card.name));

                            // Check if this specific card caused the currently SELECTED combo to brick
                            const isSelectedBrick = selectedCombo && isComboBricked(selectedCombo) && selectedCombo.bricks?.some(b => b.name === card.name);

                            const key = `hand-${idx}`;

                            return (
                                <div key={idx} className="relative group">
                                    <YgoCard
                                        card={card}
                                        onView={onView}
                                        isSelected={selectedCardKey === key}
                                        onClick={() => handleCardClick(key)}
                                        className={`
                                    w-32 
                                    ${isDead ? 'ring-4 ring-red-500/50 grayscale-[0.3]' : ''}
                                    ${isHandTrap ? 'ring-4 ring-yellow-500/50' : ''}
                                    ${isSelectedBrick ? 'ring-4 ring-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : ''}
                                `}
                                    />
                                    {isDead && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 pointer-events-none">
                                            DEAD
                                        </div>
                                    )}
                                    {isHandTrap && (
                                        <div className="absolute top-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 pointer-events-none">
                                            HT
                                        </div>
                                    )}
                                    {isGarnet && (
                                        <div className="absolute top-2 right-2 mt-6 bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 pointer-events-none">
                                            GAR
                                        </div>
                                    )}
                                    {isSelectedBrick && (
                                        <div className="absolute bottom-2 inset-x-0 mx-auto w-max bg-orange-600/90 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10 flex items-center gap-1 pointer-events-none">
                                            <Ban className="w-3 h-3" /> BRICKED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Analysis Box */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex flex-col gap-6">

                        {/* SECTION 1: Issues Found */}
                        <div>
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <AlertTriangle className="text-red-400" />
                                Issues Found
                            </h3>
                            {(() => {
                                const valid = achievedCombos.filter(c => !isComboBricked(c));
                                const bricked = achievedCombos.filter(c => isComboBricked(c));
                                const hasDeadCards = analysis?.deadCards.length > 0;
                                const hasBrickedCombos = bricked.length > 0;
                                const noCombos = achievedCombos.length === 0; // Truly 0 matches found

                                if (!hasDeadCards && !hasBrickedCombos && !noCombos) {
                                    return <p className="text-slate-400">No immediate issues identified.</p>;
                                }

                                return (
                                    <ul className="space-y-2">
                                        {/* Dead Cards */}
                                        {analysis?.deadCards.map((d, i) => (
                                            <li key={`dead-${i}`} className="text-red-300 flex items-center gap-2 text-sm bg-red-950/30 p-2 rounded">
                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                {d.reason}: {d.card.name}
                                            </li>
                                        ))}

                                        {/* Bricked Combos (Summary) */}
                                        {hasBrickedCombos && (
                                            <li className="text-orange-300 flex items-center gap-2 text-sm bg-orange-950/30 p-2 rounded">
                                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                                Bricked combos: {bricked.length}
                                            </li>
                                        )}

                                        {/* No Combos Warning */}
                                        {noCombos && (
                                            <li className="text-slate-400 flex items-center gap-2 text-sm bg-slate-800/50 p-2 rounded italic">
                                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                                                No known combos achieved.
                                            </li>
                                        )}
                                    </ul>
                                );
                            })()}
                        </div>

                        {/* SECTION 2: Hand Composition */}
                        <div className="border-t border-slate-800 pt-6">
                            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                <CheckCircle className="text-green-400" />
                                Hand Composition
                            </h3>
                            <div className="space-y-2 text-sm text-slate-300">
                                <div className="flex justify-between p-2 bg-slate-900 rounded">
                                    <span>Hand Traps</span>
                                    <span className="font-bold text-yellow-500">{analysis?.handTraps.length}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-slate-900 rounded">
                                    <span>Combo Pieces</span>
                                    {/* Use outcome.used.length if available (from selected combo), otherwise 0 */}
                                    <span className="font-bold text-blue-400">{outcome ? outcome.used.length : 0}</span>
                                </div>
                                <div className="flex justify-between p-2 bg-slate-900 rounded">
                                    <span>Dead Cards</span>
                                    <span className="font-bold text-red-500">{analysis?.deadCards.length}</span>
                                </div>
                            </div>

                            {/* Achieved Combos List */}
                            {achievedCombos.length > 0 && (
                                <>
                                    {(() => {
                                        const valid = achievedCombos.filter(c => !isComboBricked(c));
                                        const bricked = achievedCombos.filter(c => isComboBricked(c));

                                        return (
                                            <>
                                                {/* Valid Combos */}
                                                {valid.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                                        <h4 className="font-bold text-slate-300 mb-2">Achieved Combos:</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {valid.map(combo => (
                                                                <button
                                                                    key={combo.id}
                                                                    onClick={() => setSelectedCombo(combo)}
                                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border
                                                                        ${selectedCombo?.id === combo.id
                                                                            ? 'bg-green-600 text-white border-green-500'
                                                                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}
                                                                    `}
                                                                >
                                                                    {combo.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bricked Combos (Restored List) */}
                                                {bricked.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-800">
                                                        <h4 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                                                            <Ban className="w-4 h-4" /> Bricked Combos:
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {bricked.map(combo => (
                                                                <button
                                                                    key={combo.id}
                                                                    onClick={() => setSelectedCombo(combo)}
                                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1
                                                                        ${selectedCombo?.id === combo.id
                                                                            ? 'bg-orange-600 text-white border-orange-500'
                                                                            : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}
                                                                        decoration-slice
                                                                    `}
                                                                >
                                                                    <span className="line-through">{combo.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            )}

                            {/* Vulnerability Report (Sidebar) */}
                            {!isSelectedBricked && selectedCombo && selectedCombo.vulnerabilities && selectedCombo.vulnerabilities.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-800">
                                    <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Vulnerability Analysis
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedCombo.vulnerabilities.map((vuln, idx) => {
                                            // Check DRAWN HAND (initial) for answers
                                            const poolNames = new Set(hand.map(c => c.name));

                                            // Find first answer we possess
                                            const answer = vuln.responses.find(r => poolNames.has(r.name));
                                            const isProtected = !!answer;

                                            return (
                                                <div key={idx} className={`p-2 rounded border flex flex-col gap-1 ${isProtected
                                                    ? 'bg-green-500/5 border-green-500/20'
                                                    : 'bg-red-500/5 border-red-500/20'
                                                    }`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-400">Threat: {vuln.threat.name}</span>
                                                        {isProtected ? (
                                                            <span className="text-[10px] bg-green-900 text-green-300 px-1.5 rounded border border-green-700">Protected</span>
                                                        ) : (
                                                            <span className="text-[10px] bg-red-900 text-red-300 px-1.5 rounded border border-red-700">Vulnerable</span>
                                                        )}
                                                    </div>
                                                    {isProtected && <div className="text-[10px] text-green-400/80">Answer: {answer.name}</div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Outcome Visualization */}
                    {selectedCombo && (
                        <div className={`border rounded-xl p-6 ${isSelectedBricked ? 'bg-orange-950/20 border-orange-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                            {isSelectedBricked ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Ban className="w-16 h-16 text-orange-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-orange-400 mb-2">Combo Bricked</h3>
                                    <p className="text-slate-400 max-w-md">
                                        Strict conditions met: All copies of a brick card are in your hand, making this combo impossible according to your definition.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-300">
                                        Outcome Analysis: {selectedCombo.name}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative mb-8">
                                        <div className="absolute left-1/2 top-1/2 -ml-4 -mt-4 hidden md:block z-10 bg-slate-800 rounded-full p-1 border border-slate-700">
                                            <ArrowRight className="w-6 h-6 text-slate-500" />
                                        </div>

                                        {/* Field Outcome */}
                                        <div className="bg-slate-950/30 rounded-lg p-4 border border-green-500/20">
                                            <h4 className="font-bold text-green-400 mb-3 text-center">Resulting Field</h4>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {selectedCombo.outputs.length > 0 ? selectedCombo.outputs.map((card, i) => {
                                                    const key = `field-${i}`;
                                                    return (
                                                        <YgoCard
                                                            key={i}
                                                            card={card}
                                                            onView={onView}
                                                            className="w-20"
                                                            isSelected={selectedCardKey === key}
                                                            onClick={() => handleCardClick(key)}
                                                        />
                                                    );
                                                }) : (
                                                    <span className="text-slate-600 italic text-sm">No board defined</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remaining Hand */}
                                        <div className="bg-slate-950/30 rounded-lg p-4 border border-blue-500/20">
                                            <h4 className="font-bold text-blue-400 mb-3 text-center">Remaining in Hand</h4>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {outcome && outcome.remaining.length > 0 ? outcome.remaining.map((card, i) => {
                                                    const key = `rem-${i}`;
                                                    return (
                                                        <YgoCard
                                                            key={i}
                                                            card={card}
                                                            onView={onView}
                                                            className="w-20"
                                                            isSelected={selectedCardKey === key}
                                                            onClick={() => handleCardClick(key)}
                                                        />
                                                    );
                                                }) : (
                                                    <span className="text-slate-600 italic text-sm py-4">Hand empty</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                    <p className="text-slate-500">Draw a hand to test consistency</p>
                </div>
            )}
        </div>
    );
};
