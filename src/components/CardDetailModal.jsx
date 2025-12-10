import React from 'react';
import { X } from 'lucide-react';

export const CardDetailModal = ({ card, onClose }) => {
    if (!card) return null;

    const imageUrl = card.card_images?.[0]?.image_url;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left: Image */}
                <div className="md:w-1/2 bg-black/50 p-6 flex items-center justify-center">
                    <img
                        src={imageUrl}
                        alt={card.name}
                        className="max-h-[60vh] md:max-h-[80vh] w-auto rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* Right: Info */}
                <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-800/50">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{card.name}</h2>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-full text-sm font-medium">
                                    {card.type}
                                </span>
                                {card.race && (
                                    <span className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-full text-sm font-medium">
                                        {card.race}
                                    </span>
                                )}
                                {card.attribute && (
                                    <span className="px-3 py-1 bg-orange-600/20 text-orange-300 border border-orange-500/30 rounded-full text-sm font-medium uppercase">
                                        {card.attribute}
                                    </span>
                                )}
                            </div>
                        </div>

                        {(card.level || card.rank || card.linkval) && (
                            <div className="flex gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
                                {card.level && (
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Level</div>
                                        <div className="text-xl font-bold text-yellow-500 flex items-center gap-1 justify-center">
                                            <span className="w-4 h-4 bg-yellow-500 rounded-full inline-block" /> {card.level}
                                        </div>
                                    </div>
                                )}
                                {(card.atk !== undefined) && (
                                    <div className="text-center w-full border-l border-white/10 pl-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">ATK</div>
                                        <div className="text-xl font-bold text-red-400">{card.atk}</div>
                                    </div>
                                )}
                                {(card.def !== undefined) && (
                                    <div className="text-center w-full border-l border-white/10 pl-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">DEF</div>
                                        <div className="text-xl font-bold text-blue-400">{card.def}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Card Text</h3>
                            <div className="text-slate-200 leading-relaxed whitespace-pre-wrap text-base font-medium p-4 bg-slate-900/30 rounded-xl border border-white/5">
                                {card.desc}
                            </div>
                        </div>

                        {card.archetype && (
                            <div className="pt-4 border-t border-white/5 text-sm text-slate-500">
                                Archetype: <span className="text-slate-300">{card.archetype}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
