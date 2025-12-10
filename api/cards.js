import { getCardsCollection } from './utils/mongodb.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cardsCollection = await getCardsCollection();
        const query = {};
        const options = {};

        // Build MongoDB query from request parameters
        const {
            id,
            name,
            fname,
            type,
            atk,
            def,
            level,
            race,
            attribute,
            archetype,
            sort
        } = req.query;

        // ID filter (comma-separated)
        if (id) {
            const ids = id.split(',').map(Number);
            query.id = { $in: ids };
        }

        // Exact name filter (pipe-separated for multiple)
        if (name) {
            const names = name.split('|');
            query.name = names.length === 1 ? names[0] : { $in: names };
        }

        // Fuzzy name search
        if (fname) {
            query.name = { $regex: fname, $options: 'i' };
        }

        // Type filter (comma-separated)
        if (type) {
            const types = type.split(',');
            query.type = types.length === 1 ? types[0] : { $in: types };
        }

        // Numeric filters
        if (atk !== undefined) query.atk = Number(atk);
        if (def !== undefined) query.def = Number(def);
        if (level !== undefined) query.level = Number(level);

        // Race filter (comma-separated)
        if (race) {
            const races = race.split(',');
            query.race = races.length === 1 ? races[0] : { $in: races };
        }

        // Attribute filter (comma-separated)
        if (attribute) {
            const attributes = attribute.split(',');
            query.attribute = attributes.length === 1 ? attributes[0] : { $in: attributes };
        }

        // Archetype filter
        if (archetype) {
            query.archetype = archetype;
        }

        // Sorting
        if (sort) {
            const sortField = sort.toLowerCase();
            options.sort = { [sortField]: 1 };
        }

        // Execute query
        console.log('MongoDB query:', JSON.stringify(query));
        const cards = await cardsCollection.find(query, options).toArray();
        console.log(`Found ${cards.length} cards`);

        // Return in YGOProDeck API format (always return data array, even if empty)
        res.status(200).json({
            data: cards.map(card => {
                // Remove MongoDB-specific fields
                const { _id, last_updated, ...cardData } = card;
                return cardData;
            })
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query failed',
            message: error.message
        });
    }
}
