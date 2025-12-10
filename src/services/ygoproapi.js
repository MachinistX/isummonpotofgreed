const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

let cardDatabase = [];
let databaseLoaded = false;

export const fetchCardDatabase = async () => {
    if (databaseLoaded) return cardDatabase;

    try {
        const response = await fetch(`${API_BASE_URL}?misc=yes`); // misc=yes gives us extra info like if it has specific formats
        const data = await response.json();

        if (data.data) {
            cardDatabase = data.data;
            databaseLoaded = true;
            console.log(`Loaded ${cardDatabase.length} cards from API.`);
            return cardDatabase;
        } else {
            console.error("No data received from YGOPRODeck API");
            return [];
        }
    } catch (error) {
        console.error("Failed to fetch card database:", error);
        return [];
    }
};

export const searchCards = (query, filters = {}) => {
    if (!databaseLoaded) return [];

    const lowerQuery = query.toLowerCase();

    return cardDatabase.filter(card => {
        // Name search
        if (!card.name.toLowerCase().includes(lowerQuery)) return false;

        // Apply filters
        // Type Filter: Partial match (e.g. 'Monster' matches 'Effect Monster')
        if (filters.type && !card.type.includes(filters.type)) return false;

        // Race Filter: Strict match usually, but let's be safe.
        // API race values: 'Dragon', 'Quick-Play', etc.
        if (filters.race && card.race !== filters.race) return false;

        // Attr/Level if passed
        if (filters.attribute && card.attribute !== filters.attribute) return false;
        if (filters.level && card.level !== filters.level) return false;

        return true;
    }).slice(0, 500); // Increased limit for pagination
};

export const getCardById = (id) => {
    // ID checking needs to be loose (string/number)
    return cardDatabase.find(c => c.id == id);
};
