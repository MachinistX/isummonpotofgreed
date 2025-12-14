import React from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';

export const YgoCard = ({
    card,
    onClick,
    onView,
    onAdd,
    onRemove,
    isSelected = false,
    className = '',
    showDetails = true,
    ...props
}) => {
    if (!card) return <div className={`w-24 h-36 bg-slate-800 rounded-md animate-pulse ${className}`} />;

    // Image URL from API (using the small version for performance in lists)
    const imageUrl = card.card_images?.[0]?.image_url_small || card.card_images?.[0]?.image_url;

    const handleAction = (e, action) => {
        e.stopPropagation();
        action && action(card);
    };

    return (
        <div
            className={`group relative cursor-pointer ${className} ${isSelected ? 'ring-2 ring-blue-500 rounded-md scale-105 z-10' : ''}`}
            onClick={(e) => {
                // If not selected, click selects it (parent handles this via onClick)
                // If selected, we might want to toggle off or just keep it. 
                // Usually parent logic: if (selectedId === card.id) set(null) else set(card.id)
                onClick && onClick(card);
            }}
            {...props}
        >
            <img
                src={imageUrl}
                alt={card.name}
                className="w-full h-auto rounded-md shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-blue-500/30 font-bold"
                loading="lazy"
            />
            {/* View/Action Overlay - Visible if Selected */}
            {showDetails && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md backdrop-blur-sm gap-2 animate-in fade-in duration-200">
                    <button
                        onClick={(e) => handleAction(e, onView)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-all border border-blue-400"
                        title="View Details"
                    >
                        <Eye className="w-5 h-5" />
                    </button>

                    {onAdd && (
                        <button
                            onClick={(e) => handleAction(e, onAdd)}
                            className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-all border border-green-400"
                            title="Add Card"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}

                    {onRemove && (
                        <button
                            onClick={(e) => handleAction(e, onRemove)}
                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-all border border-red-400"
                            title="Remove Card"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
