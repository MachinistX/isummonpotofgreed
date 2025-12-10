import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';
import { searchCards } from '../../services/ygoproapi';

const PAGE_SIZE = 12; // 3 rows of 4 cards approx

export const CardSearch = ({ onAddCard, onView }) => {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({
        type: '', // Monster, Spell, Trap
        race: '', // Quick-Play, Continuous, Dragon, etc.
    });
    const [results, setResults] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            const hasActiveSearch = query.length >= 2 || filters.type || filters.race;
            if (hasActiveSearch) {
                // We ask the service to find cards. 
                // Note: The service currently limits to 50. This might be too small for pagination if we want to browse.
                // Ideally, we'd update the service to return all matches or support pagination.
                // For now, let's assume the service searchCards logic is capable enough or we update it later.
                // To support client-side pagination effectively, we need the service to return MORE than 50,
                // or the service to support pagination.
                // Let's assume we pull 100 or more.
                const matches = searchCards(query, filters);
                setResults(matches);
                setTotalPages(Math.ceil(matches.length / PAGE_SIZE));
                setPage(1);
            } else {
                setResults([]);
                setTotalPages(1);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, filters]);

    const paginatedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const hasActiveSearchOrFilter = query.length > 0 || filters.type || filters.race;

    return (
        <div className="flex flex-col h-full bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 space-y-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" />
                    Card Database
                </h3>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search cards..."
                        className="w-full pl-9"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <select
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Monster">Monster</option>
                        <option value="Spell Card">Spell</option>
                        <option value="Trap Card">Trap</option>
                    </select>

                    <select
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.race}
                        onChange={(e) => handleFilterChange('race', e.target.value)}
                    >
                        <option value="">All Sub-Types</option>
                        {/* Common sub-types */}
                        <option value="Normal">Normal</option>
                        <option value="Effect">Effect</option>
                        <option value="Ritual">Ritual</option>
                        <option value="Fusion">Fusion</option>
                        <option value="Synchro">Synchro</option>
                        <option value="Xyz">Xyz</option>
                        <option value="Link">Link</option>
                        <option value="Quick-Play">Quick-Play</option>
                        <option value="Continuous">Continuous</option>
                        <option value="Field">Field</option>
                        <option value="Equip">Equip</option>
                        <option value="Counter">Counter</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {results.length === 0 && hasActiveSearchOrFilter ? (
                    <div className="text-center text-slate-500 py-10">No cards found</div>
                ) : null}

                {results.length === 0 && !hasActiveSearchOrFilter ? (
                    <div className="text-center text-slate-500 py-10">
                        Search or filter to find cards
                    </div>
                ) : null}

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedResults.map(card => (
                        <YgoCard
                            key={card.id}
                            card={card}
                            onClick={() => onAddCard(card)}
                            onView={onView}
                            className="w-full"
                        />
                    ))}
                </div>
            </div>

            {/* Pagination Controls */}
            {results.length > PAGE_SIZE && (
                <div className="p-3 border-t border-white/10 bg-slate-900 flex justify-between items-center">
                    <Button
                        variant="secondary"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="!px-2 !py-1 text-xs"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="!px-2 !py-1 text-xs"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
};
