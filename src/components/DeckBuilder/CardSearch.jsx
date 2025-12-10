import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { YgoCard } from '../Card';

const PAGE_SIZE = 12; // 3 rows of 4 cards approx

export const CardSearch = ({ onAddCard, onView }) => {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({
        type: '', // Monster, Spell, Trap
        race: '', // Quick-Play, Continuous, Dragon, etc.
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search and fetch from database API
    useEffect(() => {
        const timer = setTimeout(async () => {
            const hasActiveSearch = query.length >= 2 || filters.type || filters.race;
            if (hasActiveSearch) {
                setLoading(true);
                try {
                    // Build query params for database API
                    const params = new URLSearchParams();

                    if (query) {
                        params.append('fname', query); // Fuzzy name search
                    }
                    if (filters.type) {
                        params.append('type', filters.type);
                    }
                    if (filters.race) {
                        params.append('race', filters.race);
                    }

                    // Fetch from database API
                    const response = await fetch(`/api/cards?${params.toString()}`);
                    const data = await response.json();

                    if (data.data) {
                        setResults(data.data);
                        setTotalPages(Math.ceil(data.data.length / PAGE_SIZE));
                        setPage(1);
                    } else {
                        setResults([]);
                        setTotalPages(1);
                    }
                } catch (error) {
                    console.error('Card search error:', error);
                    setResults([]);
                    setTotalPages(1);
                } finally {
                    setLoading(false);
                }
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
                        disabled={!filters.type}
                    >
                        <option value="">All Subtypes</option>
                        {/* Dynamically populate based on type if needed */}
                        {filters.type === 'Monster' && (
                            <>
                                <option value="Dragon">Dragon</option>
                                <option value="Spellcaster">Spellcaster</option>
                                <option value="Warrior">Warrior</option>
                                <option value="Fiend">Fiend</option>
                                <option value="Zombie">Zombie</option>
                                <option value="Machine">Machine</option>
                                <option value="Aqua">Aqua</option>
                                <option value="Pyro">Pyro</option>
                                <option value="Rock">Rock</option>
                                <option value="Winged Beast">Winged Beast</option>
                                <option value="Plant">Plant</option>
                                <option value="Insect">Insect</option>
                                <option value="Thunder">Thunder</option>
                                <option value="Beast">Beast</option>
                                <option value="Beast-Warrior">Beast-Warrior</option>
                                <option value="Dinosaur">Dinosaur</option>
                                <option value="Fish">Fish</option>
                                <option value="Sea Serpent">Sea Serpent</option>
                                <option value="Reptile">Reptile</option>
                                <option value="Psychic">Psychic</option>
                                <option value="Divine-Beast">Divine-Beast</option>
                                <option value="Fairy">Fairy</option>
                                <option value="Cyberse">Cyberse</option>
                                <option value="Wyrm">Wyrm</option>
                                <option value="Illusion">Illusion</option>
                            </>
                        )}
                        {filters.type === 'Spell Card' && (
                            <>
                                <option value="Normal">Normal</option>
                                <option value="Quick-Play">Quick-Play</option>
                                <option value="Continuous">Continuous</option>
                                <option value="Equip">Equip</option>
                                <option value="Field">Field</option>
                                <option value="Ritual">Ritual</option>
                            </>
                        )}
                        {filters.type === 'Trap Card' && (
                            <>
                                <option value="Normal">Normal</option>
                                <option value="Continuous">Continuous</option>
                                <option value="Counter">Counter</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && (
                    <div className="text-center text-slate-400 py-8">
                        Loading cards...
                    </div>
                )}

                {!hasActiveSearchOrFilter && !loading && (
                    <div className="text-center text-slate-500 py-8 text-sm">
                        🔍 Enter a search query or apply filters to browse cards.
                    </div>
                )}

                {hasActiveSearchOrFilter && !loading && results.length === 0 && (
                    <div className="text-center text-slate-500 py-8 text-sm">
                        No cards found matching your criteria.
                    </div>
                )}

                {!loading && paginatedResults.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {paginatedResults.map(card => (
                            <div key={card.id} className="relative group">
                                <YgoCard
                                    card={card}
                                    onClick={() => onAddCard(card)}
                                    onView={onView}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        Page {page} of {totalPages} • {results.length} cards
                    </span>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
