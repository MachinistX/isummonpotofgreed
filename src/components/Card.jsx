import React from 'react';
import { Eye } from 'lucide-react';

export const YgoCard = ({ card, onClick, onView, className = '', showDetails = true, ...props }) => {
    if (!card) return <div className={`w-24 h-36 bg-slate-800 rounded-md animate-pulse ${className}`} />;

    // Image URL from API (using the small version for performance in lists)
    const imageUrl = card.card_images?.[0]?.image_url_small || card.card_images?.[0]?.image_url;

    return (
        <div
            className={`group relative cursor-pointer ${className}`}
            onClick={() => onClick && onClick(card)}
            {...props}
        >
            <img
                src={imageUrl}
                alt={card.name}
                className="w-full h-auto rounded-md shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-blue-500/30 font-bold"
                loading="lazy"
            />
            {/* View/Info Button Overlay */}
            {showDetails && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView && onView(card);
                        }}
                        className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-sm transform scale-90 hover:scale-110 transition-all pointer-events-auto border border-white/20 shadow-xl"
                        title="View Card Details"
                    >
                        <Eye className="w-6 h-6 text-blue-300" />
                    </button>
                </div>
            )}
        </div>
    );
};
