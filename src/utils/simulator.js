import { shuffleDeck, analyzeHand } from './analyzer';
import { getCardById } from '../services/ygoproapi';

/**
 * Runs a batch simulation to test consistency.
 * @param {object} deckConfig { main: [ids] }
 * @param {Array} combos Array of combo definitions [{ name, requiredCards: [name1, name2] }]
 * @param {number} iterations Number of hands to simulate (e.g. 1000)
 * @returns {object} Statistics
 */
export const runBatchSimulation = async (deckConfig, combos, iterations = 1000) => {
    // Hydrate deck (convert IDs to card objects)
    const mainDeck = deckConfig.main.map(id => getCardById(id)).filter(c => c);

    if (mainDeck.length < 40) {
        return { error: 'Deck must have at least 40 cards.' };
    }

    const stats = {
        totalUnknownHands: 0,
        brickHands: 0,
        comboSuccess: {}, // { "Combo A": count }
        deadCardAverage: 0,
        avgUsefulHandSize: 0,
        avgEngineCount: 0,
        avgNonEngineCount: 0,
    };

    combos.forEach(c => stats.comboSuccess[c.name] = 0);

    let totalDeadCards = 0;
    let totalUsefulHandSize = 0;
    let totalEngineCount = 0;
    let totalNonEngineCount = 0;

    for (let i = 0; i < iterations; i++) {
        const hand = shuffleDeck(mainDeck).slice(0, 5);

        // Analyze for consistency
        const analysis = analyzeHand(hand);

        totalDeadCards += analysis.deadCards.length;
        totalUsefulHandSize += analysis.usefulHandSize;
        totalEngineCount += analysis.engineCount;
        totalNonEngineCount += analysis.nonEngineCount;

        // Check Combos
        let hitAnyCombo = false;
        combos.forEach(combo => {
            if (checkCombo(hand, combo.requiredCards)) {
                stats.comboSuccess[combo.name]++;
                hitAnyCombo = true;
            }
        });

        if (!hitAnyCombo) stats.totalUnknownHands++;

        // Definition of "Brick": No combos and maybe too many dead cards? 
        // For now, let's say Brick = No defined combo starter found.
        if (!hitAnyCombo) stats.brickHands++;
    }

    stats.deadCardAverage = totalDeadCards / iterations;
    stats.avgUsefulHandSize = totalUsefulHandSize / iterations;
    stats.avgEngineCount = totalEngineCount / iterations;
    stats.avgNonEngineCount = totalNonEngineCount / iterations;

    return stats;
};

/**
 * Checks if a hand satisfies the combo requirements.
 * @param {Array} hand 
 * @param {Array} requiredCardNames List of card names or IDs required.
 * @returns {boolean}
 */
const checkCombo = (hand, requiredCardNames) => {
    // Logic: "2 card combo" -> Needs Card A AND Card B
    // We can support alternatives later (Card A OR Card C).
    // For now simpler is better.

    // Create a frequency map of the hand
    const handMap = new Map();
    hand.forEach(c => {
        handMap.set(c.name, (handMap.get(c.name) || 0) + 1);
    });

    // Check if we have all required cards
    // Note: This assumes unique requirements. 
    // If you need "2 Blue-Eyes", requiredCardNames should be ['Blue-Eyes', 'Blue-Eyes']

    // We need to clone the map to decrement counts as we match
    const currentHandMap = new Map(handMap);

    return requiredCardNames.every(reqName => {
        const count = currentHandMap.get(reqName);
        if (count && count > 0) {
            currentHandMap.set(reqName, count - 1);
            return true;
        }
        return false;
    });
};
