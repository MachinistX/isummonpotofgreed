/**
 * Parses a YDK file content string into deck sections.
 * @param {string} fileContent 
 * @returns {object} { main: [], extra: [], side: [] } (arrays of card IDs)
 */
export const parseYDK = (fileContent) => {
    const deck = {
        main: [],
        extra: [],
        side: []
    };

    const lines = fileContent.split(/\r?\n/);
    let currentSection = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed === '#main') {
            currentSection = 'main';
        } else if (trimmed === '#extra') {
            currentSection = 'extra';
        } else if (trimmed === '!side') {
            currentSection = 'side';
        } else if (trimmed.startsWith('#') || trimmed.startsWith('!')) {
            // Unknown section or comment, ignore
            continue;
        } else {
            // It's a card ID
            if (currentSection) {
                // IDs are integers
                const id = parseInt(trimmed, 10);
                if (!isNaN(id)) {
                    deck[currentSection].push(id);
                }
            }
        }
    }

    return deck;
};

/**
 * Generates a YDK file content string from a deck object.
 * @param {object} deck { main: [], extra: [], side: [] }
 * @returns {string} YDK file content
 */
export const generateYDK = (deck) => {
    let content = '#created by custom-app\n#main\n';

    deck.main.forEach(id => {
        content += `${id}\n`;
    });

    content += '#extra\n';
    deck.extra.forEach(id => {
        content += `${id}\n`;
    });

    content += '!side\n';
    deck.side.forEach(id => {
        content += `${id}\n`;
    });

    return content;
};
