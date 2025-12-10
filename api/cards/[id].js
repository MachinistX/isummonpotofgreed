import { getCardsCollection } from '../utils/mongodb.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Card ID required' });
        }

        const cardsCollection = await getCardsCollection();
        const card = await cardsCollection.findOne({ id: Number(id) });

        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Remove MongoDB-specific fields
        const { _id, last_updated, ...cardData } = card;

        res.status(200).json({
            data: [cardData] // Wrap in array to match YGOProDeck format
        });

    } catch (error) {
        console.error('Query error:', error);
        res.status(500).json({
            error: 'Query failed',
            message: error.message
        });
    }
}
