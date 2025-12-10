import React, { useState, useRef } from 'react';
import { CardSearch } from '../DeckBuilder/CardSearch';
import { ComboList } from './ComboList';
import { ComboEditor } from './ComboEditor';
import { VulnerabilityEditor } from './VulnerabilityEditor';
import { BrickEditor } from './BrickEditor';

// Helper to migrate legacy flat inputs to grouped inputs
const migrateInputs = (inputs) => {
    if (!inputs || inputs.length === 0) return [];
    if (inputs[0].cards) return inputs; // Already grouped

    // Convert legacy: Each card becomes a 1-card group (AND logic)
    return inputs.map(card => ({
        id: crypto.randomUUID(),
        cards: [card]
    }));
};

export const ComboBuilder = ({ combos, setCombos, onAddCard: propAddCard, onView, deck }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list', 'edit'
    const [draftCombo, setDraftCombo] = useState(null);
    const [activeZone, setActiveZone] = useState('inputs'); // 'inputs', 'outputs'
    const fileInputRef = useRef(null);

    const handleCreate = () => {
        setDraftCombo({
            id: crypto.randomUUID(),
            name: 'New Combo',
            inputs: [], // Array of Requirement Groups
            outputs: [],
            vulnerabilities: [],
            bricks: []
        });
        setViewMode('edit');
        setActiveZone('inputs');
    };

    const handleEdit = (combo) => {
        setDraftCombo({
            ...combo,
            inputs: migrateInputs(combo.inputs),
            bricks: combo.bricks || [] // Ensure bricks array exists
        });
        setViewMode('edit');
        setActiveZone('inputs');
    };

    const handleVulnerability = (combo) => {
        setDraftCombo({ ...combo, vulnerabilities: combo.vulnerabilities || [] });
        setViewMode('vulnerability');
        setActiveZone('threats');
    };

    const handleBricks = (combo) => {
        setDraftCombo({ ...combo, bricks: combo.bricks || [] });
        setViewMode('bricks');
        setActiveZone('bricks');
    };

    const handleCopy = (originalCombo) => {
        const migratedInputs = migrateInputs(originalCombo.inputs);

        // Deep copy groups and cards
        const copiedInputs = migratedInputs.map(group => ({
            id: crypto.randomUUID(),
            cards: group.cards.map(c => ({ ...c, uid: crypto.randomUUID() }))
        }));
        const copiedOutputs = originalCombo.outputs.map(c => ({ ...c, uid: crypto.randomUUID() }));
        const copiedBricks = (originalCombo.bricks || []).map(c => ({ ...c, uid: crypto.randomUUID() }));
        const copiedVulns = (originalCombo.vulnerabilities || []).map(v => ({
            ...v,
            uid: crypto.randomUUID(),
            responses: v.responses.map(r => ({ ...r, uid: crypto.randomUUID() }))
        }));

        const newCombo = {
            ...originalCombo,
            id: crypto.randomUUID(),
            name: `${originalCombo.name} (Copy)`,
            inputs: copiedInputs,
            outputs: copiedOutputs,
            vulnerabilities: copiedVulns,
            bricks: copiedBricks
        };

        setDraftCombo(newCombo);
        setViewMode('edit');
        setActiveZone('inputs');
    };

    const handleDelete = (id) => {
        if (confirm('Delete this combo?')) {
            setCombos(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleSave = () => {
        if (!draftCombo.name.trim()) {
            alert('Please name your combo');
            return;
        }

        setCombos(prev => {
            const index = prev.findIndex(c => c.id === draftCombo.id);
            if (index >= 0) {
                const newCombos = [...prev];
                newCombos[index] = draftCombo;
                return newCombos;
            }
            return [...prev, draftCombo];
        });
        setViewMode('list');
        setDraftCombo(null);
    };

    // --- Import / Export ---
    const handleExport = () => {
        const dataStr = JSON.stringify(combos, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'my-combos.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (!Array.isArray(imported)) throw new Error("Invalid format: Root must be an array");

                const validCombos = imported.filter(c => c && typeof c === 'object' && c.name);

                if (validCombos.length === 0) {
                    alert("No valid combos found in file.");
                    return;
                }

                // Re-assign IDs to prevent conflicts
                const newCombos = validCombos.map(c => ({
                    ...c,
                    id: crypto.randomUUID(),
                    name: `${c.name} (Imported)`,
                    inputs: c.inputs, // assume format logic is handled by migration later if needed
                    vulnerabilities: c.vulnerabilities || [],
                    bricks: c.bricks || []
                }));

                setCombos(prev => [...prev, ...newCombos]);
                alert(`Imported ${newCombos.length} combos successfully.`);
            } catch (err) {
                alert("Failed to import: " + err.message);
            }
            e.target.value = ''; // Reset
        };
        reader.readAsText(file);
    };

    const handleAddCard = (card) => {
        if (viewMode === 'list' || !draftCombo) return;
        const newCard = { ...card, uid: crypto.randomUUID() };

        if (viewMode === 'bricks') {
            setDraftCombo(prev => ({
                ...prev,
                bricks: [...(prev.bricks || []), newCard]
            }));
            return;
        }

        if (viewMode === 'vulnerability') {
            if (activeZone === 'threats') {
                // Add new Threat
                setDraftCombo(prev => ({
                    ...prev,
                    vulnerabilities: [...(prev.vulnerabilities || []), {
                        uid: crypto.randomUUID(),
                        threat: newCard,
                        responses: []
                    }]
                }));
            } else {
                // Add Response to specific Threat (activeZone = threatUid)
                setDraftCombo(prev => ({
                    ...prev,
                    vulnerabilities: prev.vulnerabilities?.map(v => {
                        if (v.uid === activeZone) {
                            return { ...v, responses: [...v.responses, newCard] };
                        }
                        return v;
                    })
                }));
            }
            return;
        }

        // Edit Mode Logic
        if (activeZone === 'outputs') {
            setDraftCombo(prev => ({
                ...prev,
                outputs: [...prev.outputs, newCard]
            }));
        } else {
            // Check if activeZone matches an existing group ID
            const targetGroupId = activeZone;
            const groupExists = draftCombo.inputs.some(g => g.id === targetGroupId);

            setDraftCombo(prev => {
                if (groupExists) {
                    // Add to Selected Group (OR logic)
                    const inputs = prev.inputs.map(group => {
                        if (group.id === targetGroupId) {
                            return { ...group, cards: [...group.cards, newCard] };
                        }
                        return group;
                    });
                    return { ...prev, inputs };
                } else {
                    // No group selected (or valid): Create NEW Group (AND logic)
                    const inputs = [...prev.inputs];
                    inputs.push({ id: crypto.randomUUID(), cards: [newCard] });
                    return { ...prev, inputs };
                }
            });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Search Sidebar */}
                <div className="lg:col-span-4 h-full border-r border-white/10 pr-4">
                    <CardSearch onAddCard={handleAddCard} onView={onView} />
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 h-full">
                    {viewMode === 'list' && (
                        <ComboList
                            combos={combos}
                            onCreate={handleCreate}
                            onEdit={handleEdit}
                            onVulnerability={handleVulnerability}
                            onBricks={handleBricks}
                            onDelete={handleDelete}
                            onCopy={handleCopy}
                            onExport={handleExport}
                            onImport={handleImportClick}
                            deck={deck}
                        />
                    )}
                    {viewMode === 'edit' && (
                        <ComboEditor
                            combo={draftCombo}
                            setCombo={setDraftCombo}
                            onSave={handleSave}
                            onCancel={() => {
                                if (confirm('Discard changes?')) {
                                    setViewMode('list');
                                    setDraftCombo(null);
                                }
                            }}
                            activeZone={activeZone}
                            setActiveZone={setActiveZone}
                            onAddCard={handleAddCard}
                            deck={deck}
                            onView={onView}
                        />
                    )}
                    {viewMode === 'vulnerability' && (
                        <VulnerabilityEditor
                            combo={draftCombo}
                            setCombo={setDraftCombo}
                            onBack={handleSave} // Save on back implicitly for now, or just back? Let's use Save to ensure persistent updates.
                            activeZone={activeZone}
                            setActiveZone={setActiveZone}
                            deck={deck}
                            onView={onView}
                        />
                    )}
                    {viewMode === 'bricks' && (
                        <BrickEditor
                            combo={draftCombo}
                            setCombo={setDraftCombo}
                            onBack={handleSave}
                            activeZone={activeZone}
                            setActiveZone={setActiveZone}
                            deck={deck}
                            onView={onView}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
