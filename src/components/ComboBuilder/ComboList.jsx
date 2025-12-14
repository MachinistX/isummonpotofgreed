
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Copy, Download, Upload, AlertTriangle, Shield, Ban, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

export const ComboList = ({ combos, onCreate, onEdit, onDelete, onCopy, onExport, onExportAll, onImport, onVulnerability, onBricks, deck }) => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const validateCombo = (combo) => {
        if (!deck) return [];
        const missing = new Set();
        const allDeckCards = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];
        const deckIds = new Set(allDeckCards.map(c => c.id));
        const deckNames = new Set(allDeckCards.map(c => c.name));

        const checkCard = (card) => {
            if (!card.id && !card.name) return;
            if (card.id && deckIds.has(card.id)) return;
            if (card.name && deckNames.has(card.name)) return;
            missing.add(card.name);
        };

        if (combo.inputs && combo.inputs.length > 0) {
            const isGroup = combo.inputs[0].cards;
            if (isGroup) {
                combo.inputs.forEach(group => group.cards.forEach(checkCard));
            } else {
                combo.inputs.forEach(checkCard);
            }
        }
        if (combo.outputs) combo.outputs.forEach(checkCard);
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
                    <Button variant="secondary" onClick={onExportAll} className="text-xs hidden md:flex">
                        <Download className="w-3 h-3 mr-1" /> Export All
                    </Button>
                    <Button variant="secondary" onClick={onImport} className="text-xs hidden md:flex">
                        <Upload className="w-3 h-3 mr-1" /> Import
                    </Button>
                    <Button onClick={onCreate} className="bg-purple-600 hover:bg-purple-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-20">
                {combos.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        <p>No combos defined yet.</p>
                        <p className="text-sm">Click "Create" to get started.</p>
                    </div>
                ) : (
                    combos.map(combo => {
                        const missingCards = validateCombo(combo);
                        const hasIssues = missingCards.length > 0;
                        const isMenuOpen = openMenuId === combo.id;

                        return (
                            <div key={combo.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex justify-between items-center group relative">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="flex -space-x-4 overflow-hidden py-1 pl-1">
                                        {combo.outputs && combo.outputs.slice(0, 3).map((card, i) => (
                                            <div key={i} className="relative w-10 md:w-12 flex-shrink-0">
                                                <YgoCard card={card} className="w-full shadow-lg rounded" showDetails={false} />
                                            </div>
                                        ))}
                                        {(!combo.outputs || combo.outputs.length === 0) && (
                                            <div className="w-10 h-14 bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-xs text-slate-600">
                                                ?
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-bold text-white flex items-center gap-2 truncate text-sm md:text-base">
                                            {combo.name}
                                            {hasIssues && (
                                                <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                            )}
                                        </h3>
                                        <div className="text-xs text-slate-400 flex gap-3">
                                            <span className="whitespace-nowrap">
                                                <strong className="text-purple-400">{combo.inputs?.length || 0}</strong> Req
                                            </span>
                                            <span className="whitespace-nowrap">
                                                <strong className="text-green-400">{combo.outputs?.length || 0}</strong> Out
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile/Desktop Menu */}
                                <div className="relative ml-2" ref={isMenuOpen ? menuRef : null}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(isMenuOpen ? null : combo.id);
                                        }}
                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-10 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-50 flex flex-col py-1 animate-in fade-in zoom-in-95 duration-100">
                                            <button
                                                onClick={() => { onVulnerability(combo); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-blue-400 text-left"
                                            >
                                                <Shield className="w-4 h-4" /> Analyze
                                            </button>
                                            <button
                                                onClick={() => { onBricks(combo); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-orange-400 text-left"
                                            >
                                                <Ban className="w-4 h-4" /> Bricks
                                            </button>
                                            <button
                                                onClick={() => { onEdit(combo); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white text-left"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit
                                            </button>
                                            <button
                                                onClick={() => { onCopy(combo); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white text-left"
                                            >
                                                <Copy className="w-4 h-4" /> Duplicate
                                            </button>
                                            <div className="h-px bg-slate-700 my-1" />
                                            <button
                                                onClick={() => { onExport(combo.id); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white text-left"
                                            >
                                                <Download className="w-4 h-4" /> Export
                                            </button>
                                            <div className="h-px bg-slate-700 my-1" />
                                            <button
                                                onClick={() => { onDelete(combo.id); setOpenMenuId(null); }}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 text-left"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
