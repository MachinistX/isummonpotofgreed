import React, { useState, useRef } from 'react';
import { ResponsiveCardSearch } from '../ResponsiveCardSearch';
import { ComboList } from './ComboList';
import { ComboEditor } from './ComboEditor';
import { VulnerabilityEditor } from './VulnerabilityEditor';
import { BrickEditor } from './BrickEditor';

export const ComboBuilder = ({ combos, setCombos, onAddCard: propAddCard, onView, deck }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit' | 'vulnerability' | 'bricks'
    const [draftCombo, setDraftCombo] = useState(null);
    const [activeZone, setActiveZone] = useState('inputs'); // 'inputs', 'outputs', 'bricks', 'threats', or specific IDs
    const fileInputRef = useRef(null);

    // Helpers
    const createCombo = () => ({
        id: crypto.randomUUID(),
        name: 'New Combo',
        inputs: [{ id: crypto.randomUUID(), cards: [] }], // Start with 1 group
        outputs: [],
        bricks: [],
        vulnerabilities: []
    });

    // Handlers
    // Link to migrateCombo logic
    const migrateCombo = (combo) => {
        let inputs = combo.inputs || [];
        // Legacy check: If inputs has items but the first item lacks 'cards' property, it's a flat array of cards
        if (inputs.length > 0 && !inputs[0].cards) {
            inputs = [{ id: crypto.randomUUID(), cards: inputs }];
        } else if (inputs.length === 0) {
            // Ensure at least one empty group exists
            inputs = [{ id: crypto.randomUUID(), cards: [] }];
        }
        return { ...combo, inputs };
    };

    const handleCreate = () => {
        const newCombo = createCombo();
        setDraftCombo(newCombo);
        setViewMode('edit');
        setActiveZone(newCombo.inputs[0].id);
    };

    const handleEdit = (combo) => {
        // Ensure structure compatibility via migration
        const validCombo = migrateCombo({
            ...createCombo(), // Defaults
            ...combo
        });
        setDraftCombo(JSON.parse(JSON.stringify(validCombo))); // Deep copy
        setViewMode('edit');
        setActiveZone('inputs');
    };

    const handleVulnerability = (combo) => {
        const validCombo = migrateCombo({ ...createCombo(), ...combo });
        setDraftCombo(JSON.parse(JSON.stringify(validCombo)));
        setViewMode('vulnerability');
        setActiveZone('threats');
    };

    const handleBricks = (combo) => {
        const validCombo = migrateCombo({ ...createCombo(), ...combo });
        setDraftCombo(JSON.parse(JSON.stringify(validCombo)));
        setViewMode('bricks');
        setActiveZone('bricks');
    };

    const handleSave = () => {
        if (!draftCombo) return;

        setCombos(prev => {
            const index = prev.findIndex(c => c.id === draftCombo.id);
            if (index >= 0) {
                const newCombos = [...prev];
                newCombos[index] = draftCombo;
                return newCombos;
            } else {
                return [...prev, draftCombo];
            }
        });
        setViewMode('list');
        setDraftCombo(null);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this combo?')) {
            setCombos(prev => prev.filter(c => c.id !== id));
        }
    };

    const handleCopy = (id) => {
        const original = combos.find(c => c.id === id);
        if (original) {
            const copy = {
                ...JSON.parse(JSON.stringify(original)),
                id: crypto.randomUUID(),
                name: `${original.name} (Copy)`
            };
            setCombos(prev => [...prev, copy]);
        }
    };

    const handleExport = (id) => {
        const combo = combos.find(c => c.id === id);
        if (combo) {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(combo, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${combo.name.replace(/\s+/g, '_')}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.id && imported.name) {
                    // Regenerate ID to avoid conflicts
                    imported.id = crypto.randomUUID();
                    setCombos(prev => [...prev, imported]);
                } else {
                    alert("Invalid combo file format");
                }
            } catch (err) {
                console.error(err);
                alert("Error parsing JSON");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset
    };

    const handleAddCard = (card) => {
        if (!draftCombo) return;

        const newCard = { ...card, uid: crypto.randomUUID() };

        if (viewMode === 'edit') {
            if (activeZone === 'outputs') {
                setDraftCombo(prev => ({
                    ...prev,
                    outputs: [...prev.outputs, newCard]
                }));
            } else {
                // Determine target group. If activeZone matches a group ID, use it.
                // If activeZone is 'inputs', use the LAST group or FIRST group.
                const groupIndex = draftCombo.inputs.findIndex(g => g.id === activeZone);
                if (groupIndex !== -1) {
                    // Add to specific group
                    setDraftCombo(prev => {
                        const newInputs = [...prev.inputs];
                        newInputs[groupIndex] = {
                            ...newInputs[groupIndex],
                            cards: [...newInputs[groupIndex].cards, newCard]
                        };
                        return { ...prev, inputs: newInputs };
                    });
                } else {
                    // Default to last group if zone invalid or general 'inputs'
                    // Or ask user to select group?
                    // For now, fallback to last group
                    if (draftCombo.inputs.length > 0) {
                        setDraftCombo(prev => {
                            const newInputs = [...prev.inputs];
                            const lastIdx = newInputs.length - 1;
                            newInputs[lastIdx] = {
                                ...newInputs[lastIdx],
                                cards: [...newInputs[lastIdx].cards, newCard]
                            };
                            return { ...prev, inputs: newInputs };
                        });
                    }
                }
            }
        } else if (viewMode === 'bricks') {
            setDraftCombo(prev => ({
                ...prev,
                bricks: [...(prev.bricks || []), newCard]
            }));
        } else if (viewMode === 'vulnerability') {
            if (activeZone === 'threats') {
                // Add new threat entry
                setDraftCombo(prev => ({
                    ...prev,
                    vulnerabilities: [...(prev.vulnerabilities || []), {
                        uid: crypto.randomUUID(),
                        threat: newCard,
                        responses: []
                    }]
                }));
            } else {
                // activeZone likely a Vulnerability UID
                const vulnIndex = draftCombo.vulnerabilities?.findIndex(v => v.uid === activeZone);
                if (vulnIndex !== undefined && vulnIndex !== -1) {
                    setDraftCombo(prev => {
                        const newVulns = [...prev.vulnerabilities];
                        newVulns[vulnIndex] = {
                            ...newVulns[vulnIndex],
                            responses: [...newVulns[vulnIndex].responses, newCard]
                        };
                        return { ...prev, vulnerabilities: newVulns };
                    });
                }
            }
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
                {/* Search Sidebar / Mobile Drawer */}
                <div className="lg:col-span-4 h-full lg:border-r border-white/10 lg:pr-4 pointer-events-none lg:pointer-events-auto">
                    <div className="pointer-events-auto h-full">
                        <ResponsiveCardSearch onAddCard={handleAddCard} onView={onView} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 h-full pb-16 lg:pb-0 overflow-hidden">
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
                            onBack={handleSave} // Implicitly save when going back
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
                            onBack={handleSave} // Implicitly save
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
