/**
 * Checks if a card has a "Hard Once Per Turn" condition.
 * @param {object} card 
 * @returns {boolean}
 */
export const isHOPT = (card) => {
    if (!card || !card.desc) return false;
    const text = card.desc;
    // Common HOPT phrases
    const pattern1 = /You can only use (each effect|this effect|the effect) of "(.+?)" once per turn/i;
    const pattern2 = /You can only activate 1 "(.+?)" per turn/i;
    // "Heritage of the Chalice" style:
    const pattern3 = /You can only use 1 "(.+?)" effect per turn/i;

    return pattern1.test(text) || pattern2.test(text) || pattern3.test(text);
};

/**
 * Checks if a card has a "Soft Once Per Turn" condition.
 * @param {object} card 
 * @returns {boolean}
 */
export const isSOPT = (card) => {
    if (!card || !card.desc) return false;
    const text = card.desc;
    // Common SOPT phrases: "Once per turn: You can..." 
    // Key difference: Does not mention "Each effect of [Name]" or "You can only activate 1 [Name]"
    const soptPattern = /Once per turn: /i;

    // Some cards have both SOPT and HOPT (different effects).
    // The user wants to identify SOPT cards.
    return soptPattern.test(text);
};

/**
 * Heuristic to determine if a card is likely a Hand Trap.
 * Hand traps are:
 * 1. Monster cards with Quick Effects that activate from hand during opponent's turn
 *    PSCT Template: [condition] (Quick Effect): [cost]; [effect]
 *    where cost or condition mentions hand activation (e.g., "discard this card")
 * 2. Trap cards that can be activated from hand
 *    PSCT Template: [effect]. [condition for hand activation]
 * Examples: Ash Blossom, Effect Veiler, Ghost Ogre, Mulcharmy Fuwalos, Infinite Impermanence
 * @param {object} card 
 * @returns {boolean}
 */
export const isHandTrap = (card) => {
    if (!card || !card.desc || !card.type) return false;

    const text = card.desc;
    const cardType = card.type.toLowerCase();

    // Check if it's a Monster card with Quick Effect from hand
    if (cardType.includes('monster')) {
        // Split into sentences/clauses to handle multi-effect cards
        // Look for "(Quick Effect):" pattern
        const quickEffectMatch = text.match(/\([^)]*Quick Effect[^)]*\):[^.;]*/gi);

        if (!quickEffectMatch) return false;

        // Check each Quick Effect clause to see if it activates from hand
        for (const effectClause of quickEffectMatch) {
            const clauseLower = effectClause.toLowerCase();

            // Common hand activation patterns in PSCT
            const handActivationPatterns = [
                'discard this card',
                'send this card from your hand',
                'from your hand',
                'special summon this card from your hand',
                'you can reveal this card in your hand'
            ];

            // Check if this Quick Effect mentions hand activation
            const activatesFromHand = handActivationPatterns.some(pattern =>
                clauseLower.includes(pattern)
            );

            if (activatesFromHand) {
                // Additional check: look at the preceding condition text
                // Find text before "(Quick Effect):" in the original sentence
                const fullSentence = text.match(new RegExp(`[^.;]*${effectClause.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
                if (fullSentence) {
                    const precedingText = fullSentence[0].toLowerCase();
                    // Verify it doesn't require being on field first
                    const requiresField = precedingText.includes('if this card is on the field') ||
                        precedingText.includes('while this card is on the field');

                    if (!requiresField) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // Check if it's a Trap card that can be activated from hand
    if (cardType.includes('trap')) {
        const textLower = text.toLowerCase();

        // PSCT pattern: explicit statement about hand activation
        const trapHandPatterns = [
            'you can activate this card from your hand',
            'activate this card from your hand',
            'you can also activate this card from your hand'
        ];

        return trapHandPatterns.some(pattern => textLower.includes(pattern));
    }

    return false;
};

/**
 * Analyzes a hand of cards for issues and stats.
 * @param {Array} hand Array of card objects
 * @returns {object} { deadCards, handTraps, soptCards, usefulHandSize, engineCount, nonEngineCount }
 */
export const analyzeHand = (hand) => {
    const deadCards = [];
    const handTraps = [];
    const soptCards = [];
    const seenHOPT = new Set();

    // We need to track which specific card instances are dead to avoid double counting or identifying
    // But since objects are unique (thanks to UIDs), we can just use the object reference handling or internal flags.
    // However, the loop is simple.

    let engineCount = 0;
    let nonEngineCount = 0;

    hand.forEach(card => {
        if (!card) return;

        let isDead = false;

        // Check HOPT Duplicates FIRST
        // If it's a HOPT card...
        if (isHOPT(card)) {
            if (seenHOPT.has(card.name)) {
                // This is a duplicate HOPT - It is Dead
                deadCards.push({ card, reason: 'Duplicate HOPT' });
                isDead = true;
            } else {
                // First copy is live
                seenHOPT.add(card.name);
            }
        }

        // Check SOPT (Info only, doesn't affect Dead status)
        if (isSOPT(card)) {
            soptCards.push(card);
        }

        // Stats Counting
        // User Request: "count in Dead cards, but do not include them in Engine or Hand trap numbers."
        if (!isDead) {
            // Check Hand Trap (Non-Engine heuristic)
            if (isHandTrap(card)) {
                handTraps.push(card); // Live Hand Trap
                nonEngineCount++;
            } else {
                // Live Engine Card
                engineCount++;
            }
        }
    });

    const usefulHandSize = hand.length - deadCards.length;

    return {
        deadCards,
        handTraps,
        soptCards,
        usefulHandSize,
        engineCount,
        nonEngineCount
    };
};

/**
 * Shuffles a deck.
 * @param {Array} deck 
 * @returns {Array} New shuffled deck array
 */
export const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

/**
 * Draws a hand from the deck.
 * @param {Array} deck 
 * @param {number} handSize 
 * @returns {Array} hand
 */
export const drawHand = (deck, handSize = 5) => {
    // We assume deck is already shuffled or we shuffle it here.
    // Best to shuffle here to be safe.
    const shuffled = shuffleDeck(deck);
    return shuffled.slice(0, handSize);
};

/**
 * Recursive backtracking to find a satisfying assignment of cards to groups.
 * @param {Array} groups Array of InputGroup objects
 * @param {Object} handCounts Mutable map of CardName -> Count (Available cards)
 * @param {Object} usedCounts Mutable map of CardName -> Count (Cards used so far)
 * @returns {Object|null} Map of Used Counts if successful, null if not
 */
const findSatisfyingAssignment = (groups, handCounts, usedCounts = {}) => {
    if (groups.length === 0) return usedCounts;

    const [currentGroup, ...remainingGroups] = groups;

    // Try each card option in the current group
    for (const card of currentGroup.cards) {
        const count = handCounts[card.name] || 0;
        if (count > 0) {
            // Use this card
            handCounts[card.name]--;
            usedCounts[card.name] = (usedCounts[card.name] || 0) + 1;

            // Recurse
            const result = findSatisfyingAssignment(remainingGroups, handCounts, usedCounts);
            if (result) {
                return result;
            }

            // Backtrack
            handCounts[card.name]++;
            usedCounts[card.name]--;
            if (usedCounts[card.name] === 0) delete usedCounts[card.name]; // Clean up
        }
    }

    return null;
};

/**
 * Checks which combos are achievable with the current hand.
 * @param {Array} hand 
 * @param {Array} combos 
 * @returns {Array} List of matching combo objects
 */
export const checkCombos = (hand, combos) => {
    if (!combos || combos.length === 0) return [];

    const handCounts = {};
    for (const card of hand) {
        handCounts[card.name] = (handCounts[card.name] || 0) + 1;
    }

    const matches = [];

    for (const combo of combos) {
        if (!combo.inputs || combo.inputs.length === 0) continue;

        const currentHandCounts = { ...handCounts };
        const isNewFormat = combo.inputs[0] && combo.inputs[0].cards;

        if (isNewFormat) {
            if (findSatisfyingAssignment(combo.inputs, currentHandCounts)) {
                matches.push(combo);
            }
        } else {
            // -- LEGACY LOGIC --
            const comboCounts = {};
            for (const input of combo.inputs) {
                comboCounts[input.name] = (comboCounts[input.name] || 0) + 1;
            }
            let isMatch = true;
            for (const [name, count] of Object.entries(comboCounts)) {
                if ((currentHandCounts[name] || 0) < count) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) matches.push(combo);
        }
    }
    return matches;
};

/**
 * Calculates the outcome of using a specific combo with the given hand.
 * Returns the specific card instances used and remaining.
 * @param {Array} hand 
 * @param {Object} combo 
 * @returns {Object|null} { used: Array<Card>, remaining: Array<Card> }
 */
export const getComboOutcome = (hand, combo) => {
    if (!combo || !combo.inputs) return null;

    const handCounts = {};
    for (const card of hand) {
        handCounts[card.name] = (handCounts[card.name] || 0) + 1;
    }

    let usedCounts = null;
    const isNewFormat = combo.inputs[0] && combo.inputs[0].cards;

    if (isNewFormat) {
        usedCounts = findSatisfyingAssignment(combo.inputs, { ...handCounts });
    } else {
        // Legacy logic usage calc
        usedCounts = {};
        for (const input of combo.inputs) {
            usedCounts[input.name] = (usedCounts[input.name] || 0) + 1;
        }
        // Verify legacy match again just in case?
        for (const [name, count] of Object.entries(usedCounts)) {
            if ((handCounts[name] || 0) < count) return null;
        }
    }

    if (!usedCounts) return null;

    // Distribute actual card instances
    const used = [];
    const remaining = [];

    // We need to match usedCounts to specific instances.
    // We clone the usedCounts so we can decrement as we find them.
    const needed = { ...usedCounts };

    for (const card of hand) {
        if (needed[card.name] && needed[card.name] > 0) {
            used.push(card);
            needed[card.name]--;
        } else {
            remaining.push(card);
        }
    }

    // Filter Remaining: Remove cards that appear in the Output (Field)
    // to prevent counting duplicates (User Request: "deducted from the hand too")
    if (combo.outputs && combo.outputs.length > 0) {
        const outputCounts = {};
        for (const card of combo.outputs) {
            outputCounts[card.name] = (outputCounts[card.name] || 0) + 1;
        }

        const filteredRemaining = [];
        for (const card of remaining) {
            if (outputCounts[card.name] > 0) {
                // This card exists in the output, so assume the hand copy was moved to field
                // or corresponds to the field card. Deduct it.
                outputCounts[card.name]--;
            } else {
                filteredRemaining.push(card);
            }
        }
        return { used, remaining: filteredRemaining };
    }

    return { used, remaining };
};
