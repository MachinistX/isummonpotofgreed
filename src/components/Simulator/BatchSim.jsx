import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { drawHand, checkCombos, analyzeHand } from '../../utils/analyzer';
import { TrendingUp, Target, Zap, GitBranch, AlertTriangle } from 'lucide-react';

export const BatchSim = ({ deck, combos = [] }) => {
    const [results, setResults] = useState(null);
    const [running, setRunning] = useState(false);

    const handleRun = async () => {
        setRunning(true);
        // Emulate async so UI updates
        await new Promise(r => setTimeout(r, 100));

        const iterations = 10000;
        const comboCounts = {}; // { comboId: { achieved: count, bricked: count } }
        const vulnerabilityTally = {}; // { threatName: count }

        // Initialize counts
        combos.forEach(c => {
            comboCounts[c.id] = { achieved: 0, bricked: 0 };
        });

        let brickCount = 0; // Hands with 0 combos
        let totalDeadCards = 0;
        let playableHandCount = 0; // Hands with at least 1 combo
        let gasHandCount = 0; // Hands with no dead cards and playable content
        let totalComboOptions = 0; // Sum of combos per hand

        // Helper: Check if a combo is bricked
        const isComboBricked = (hand, combo, fullDeck) => {
            if (!combo.bricks || combo.bricks.length === 0) return false;

            for (const brick of combo.bricks) {
                const totalInDeck = fullDeck.filter(c => c.name === brick.name).length;
                const drawnInHand = hand.filter(c => c.name === brick.name).length;

                if (drawnInHand > 0) {
                    return true;
                }
            }
            return false;
        };

        // Helper: Check vulnerabilities for a hand
        const checkVulnerabilities = (hand, combo) => {
            if (!combo.vulnerabilities || combo.vulnerabilities.length === 0) return;

            const handNames = new Set(hand.map(c => c.name));

            combo.vulnerabilities.forEach(vuln => {
                // Check if we have an answer
                const hasAnswer = vuln.responses.some(r => handNames.has(r.name));

                if (!hasAnswer) {
                    // Vulnerable! Tally this threat
                    const threatKey = vuln.threat.name;
                    vulnerabilityTally[threatKey] = (vulnerabilityTally[threatKey] || 0) + 1;
                }
            });
        };

        const fullDeck = [...(deck.main || []), ...(deck.extra || []), ...(deck.side || [])];

        for (let i = 0; i < iterations; i++) {
            const hand = drawHand(deck, 5);
            const analysis = analyzeHand(hand);
            const matches = checkCombos(hand, combos);

            totalDeadCards += analysis.deadCards.length;

            // Check for playable hand
            if (matches.length > 0) {
                playableHandCount++;
                totalComboOptions += matches.length;

                // Track combos (achieved and bricked)
                matches.forEach(combo => {
                    const bricked = isComboBricked(hand, combo, fullDeck);

                    if (bricked) {
                        comboCounts[combo.id].bricked++;
                    }
                    comboCounts[combo.id].achieved++;

                    // Check vulnerabilities for non-bricked combos
                    if (!bricked) {
                        checkVulnerabilities(hand, combo);
                    }
                });
            } else {
                brickCount++;
            }

            // Gas hand check: no dead cards, has combo pieces or hand traps
            const hasGas = analysis.deadCards.length === 0 &&
                (matches.length > 0 || analysis.handTraps.length > 0);
            if (hasGas) {
                gasHandCount++;
            }
        }

        // Calculate top 4 vulnerabilities
        const vulnerabilityRanking = Object.entries(vulnerabilityTally)
            .map(([threat, count]) => ({ threat, count, percentage: (count / iterations) * 100 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        setResults({
            iterations,
            comboCounts,
            brickCount,
            avgHandSize: (5 - (totalDeadCards / iterations)).toFixed(1),
            playableHandPercentage: ((playableHandCount / iterations) * 100).toFixed(1),
            gasPercentage: ((gasHandCount / iterations) * 100).toFixed(1),
            avgOptions: (totalComboOptions / iterations).toFixed(2),
            vulnerabilityRanking
        });
        setRunning(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                        Batch Simulation
                    </h2>
                    <span className="text-slate-500 text-sm">10,000 Iterations</span>
                </div>

                <p className="text-slate-400 mb-6 text-sm">
                    Simulate drawing 10,000 hands to calculate probabilities, consistency metrics, and vulnerability analysis.
                </p>

                <Button onClick={handleRun} disabled={running || deck.length < 40} className="w-full md:w-auto">
                    {running ? 'Simulating...' : 'Run Analysis'}
                </Button>
            </div>

            {results && (
                <>
                    {/* Score Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Average Hand Size */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-blue-400" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Avg Hand Size</h3>
                            </div>
                            <p className="text-2xl font-bold text-white">{results.avgHandSize}</p>
                            <p className="text-xs text-slate-500 mt-1">Playable cards</p>
                        </div>

                        {/* Playable Hand % */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Playable Hand</h3>
                            </div>
                            <p className="text-2xl font-bold text-green-400">{results.playableHandPercentage}%</p>
                            <p className="text-xs text-slate-500 mt-1">Has combo</p>
                        </div>

                        {/* Gas % */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Gas %</h3>
                            </div>
                            <p className="text-2xl font-bold text-yellow-400">{results.gasPercentage}%</p>
                            <p className="text-xs text-slate-500 mt-1">All playable</p>
                        </div>

                        {/* Options */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <GitBranch className="w-4 h-4 text-purple-400" />
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Options</h3>
                            </div>
                            <p className="text-2xl font-bold text-purple-400">{results.avgOptions}</p>
                            <p className="text-xs text-slate-500 mt-1">Avg combos/hand</p>
                        </div>
                    </div>

                    {/* Vulnerability Ranking */}
                    {results.vulnerabilityRanking.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-orange-400" />
                                <h3 className="text-lg font-bold text-white">Vulnerability Ranking</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.vulnerabilityRanking.map((vuln, idx) => (
                                    <div key={idx} className="bg-slate-950/50 rounded-lg p-3 border border-slate-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-300">
                                                #{idx + 1}: {vuln.threat}
                                            </span>
                                            <span className="text-lg font-bold text-orange-400">
                                                {vuln.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Exposed {vuln.count.toLocaleString()} times
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Combo Probability Table */}
                    <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4">Stat / Combo</th>
                                    <th className="p-4 text-right">Probability</th>
                                    <th className="p-4 text-right">Brick %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {/* Bricks */}
                                <tr className="bg-red-500/5">
                                    <td className="p-4 font-bold text-red-400">Brick (No Combos)</td>
                                    <td className="p-4 text-right font-mono text-white">
                                        {((results.brickCount / results.iterations) * 100).toFixed(1)}%
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600">—</td>
                                </tr>

                                {/* Combos */}
                                {combos.map(combo => {
                                    const stats = results.comboCounts[combo.id];
                                    const achievedRate = ((stats.achieved / results.iterations) * 100).toFixed(1);
                                    const brickRate = stats.achieved > 0
                                        ? ((stats.bricked / stats.achieved) * 100).toFixed(1)
                                        : '0.0';

                                    return (
                                        <tr key={combo.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-white">{combo.name}</td>
                                            <td className="p-4 text-right font-mono text-green-300">
                                                {achievedRate}%
                                            </td>
                                            <td className="p-4 text-right font-mono text-orange-400">
                                                {brickRate}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
