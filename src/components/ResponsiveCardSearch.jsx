import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { CardSearch } from './DeckBuilder/CardSearch';

export const ResponsiveCardSearch = (props) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className={`
                flex flex-col
                /* Desktop: Static column, full height */
                lg:static lg:h-full lg:w-full
                
                /* Mobile: Fixed Bottom Drawer */
                fixed bottom-0 left-0 right-0 z-40 
                bg-slate-950 lg:bg-transparent
                border-t border-white/20 lg:border-none
                shadow-2xl lg:shadow-none
                transition-all duration-300 ease-in-out
                ${isOpen ? 'h-[50vh]' : 'h-14'} lg:h-full
            `}
        >
            {/* Mobile Handle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden flex items-center justify-center p-3 w-full bg-slate-900 text-slate-200 hover:bg-slate-800 transition-colors border-b border-white/10"
            >
                {isOpen ? <ChevronDown className="w-5 h-5 mr-2" /> : <ChevronUp className="w-5 h-5 mr-2" />}
                <span className="font-bold text-sm flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" />
                    Card Database
                </span>
            </button>

            {/* Content Container */}
            <div className="flex-1 h-full overflow-hidden">
                <CardSearch {...props} />
            </div>
        </div>
    );
};
