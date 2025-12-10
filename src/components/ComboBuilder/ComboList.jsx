
import React from 'react';
import { Plus, Edit2, Trash2, Copy, Download, Upload, AlertTriangle, Shield, Ban } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const ComboList = ({ combos, onCreate, onEdit, onDelete, onCopy, onExport, onImport, onVulnerability, onBricks, deck }) => {

    const validateCombo = (combo) => {
        if (!deck) return [];
        const missing = new Set();

        // Combine all deck cards for easier lookup
        // Ideally we should care about Side vs Main but generally "In Possession" is what matters
        const allDeckCards = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const deckIds = new Set(allDeckCards.map(c => c.id));
        const deckNames = new Set(allDeckCards.map(c => c.name));

        const checkCard = (card) => {
            // Check ID first, then Name
            if (!card.id && !card.name) return;
            if (card.id && deckIds.has(card.id)) return;
            if (card.name && deckNames.has(card.name)) return;

            missing.add(card.name);
        };

        // Check Inputs
        if (combo.inputs && combo.inputs.length > 0) {
            // Handle both legacy (array of cards) and new (array of groups)
            const isGroup = combo.inputs[0].cards;
            if (isGroup) {
                combo.inputs.forEach(group => group.cards.forEach(checkCard));
            } else {
                combo.inputs.forEach(checkCard);
            }
        }

        // Check Outputs
        if (combo.outputs) {
            combo.outputs.forEach(checkCard);
        }

        return Array.from(missing);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-white/10">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-300">
                        Your Combos
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {combos.length} Combos Created
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onImport} className="text-xs">
                        <Upload className="w-3 h-3 mr-1" /> Import
                    </Button>
                    <Button variant="secondary" onClick={onExport} className="text-xs">
                        <Download className="w-3 h-3 mr-1" /> Export
                    </Button>
                    <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Combo
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                {combos.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <p>No combos defined yet.</p>
                        <p className="text-sm">Click "Create Combo" to get started.</p>
                    </div>
                ) : (
                    combos.map(combo => {
                        const missingCards = validateCombo(combo);
                        const hasIssues = missingCards.length > 0;

                        return (
                            <div key={combo.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center group hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-4 overflow-hidden py-1">
                                        {combo.outputs && combo.outputs.slice(0, 3).map((card, i) => (
                                            <div key={i} className="relative w-12 hover:z-10 transition-transform hover:scale-110">
                                                <YgoCard card={card} className="w-full shadow-lg" showDetails={false} />
                                            </div>
                                        ))}
                                        {(!combo.outputs || combo.outputs.length === 0) && (
                                            <div className="w-12 h-16 bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-xs text-slate-600">
                                                ?
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            {combo.name}
                                            {hasIssues && (
                                                <div className="group/warn relative">
                                                    <AlertTriangle className="w-4 h-4 text-orange-500 cursor-help" />
                                                    <div className="absolute left-6 top-0 bg-slate-900 border border-orange-500/30 text-orange-200 text-xs p-2 rounded w-48 hidden group-hover/warn:block z-50 shadow-xl">
                                                        <strong>Missing from Deck:</strong>
                                                        <ul className="list-disc pl-4 mt-1">
                                                            {missingCards.slice(0, 5).map(m => <li key={m}>{m}</li>)}
                                                            {missingCards.length > 5 && <li>...and {missingCards.length - 5} more</li>}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </h3>
                                        <div className="text-xs text-slate-400 flex gap-3">
                                            <span>
                                                <strong className="text-purple-400">{combo.inputs?.length || 0}</strong> Requirements
                                            </span>
                                            <span>
                                                <strong className="text-green-400">{combo.outputs?.length || 0}</strong> Outcomes
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" onClick={() => onBricks(combo)} className="!p-2" title="Define Bricks">
                                        <Ban className="w-4 h-4 text-red-400" />
                                    </Button>
                                    <Button variant="secondary" onClick={() => onVulnerability(combo)} className="!p-2" title="Analysis & Vulnerabilities">
                                        <Shield className="w-4 h-4 text-blue-400" />
                                    </Button>
                                    <Button variant="secondary" onClick={() => onCopy(combo)} className="!p-2" title="Duplicate">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="secondary" onClick={() => onEdit(combo)} className="!p-2">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="danger" onClick={() => onDelete(combo.id)} className="!p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
