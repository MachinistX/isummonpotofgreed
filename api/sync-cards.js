import { getCardsCollection, getMetadataCollection } from './utils/mongodb.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Basic auth check (optional - you can add API key here)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.SYNC_API_KEY || 'your-secret-key'}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const cardsCollection = await getCardsCollection();
        const metadataCollection = await getMetadataCollection();

        // Fetch all cards from YGOProDeck API
        console.log('Fetching cards from YGOProDeck API...');
        const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');

        if (!response.ok) {
            throw new Error(`YGOProDeck API error: ${response.statusText}`);
        }

        const data = await response.json();
        const cards = data.data;

        console.log(`Fetched ${cards.length} cards`);

        // Prepare bulk operations for upsert
        const bulkOps = cards.map(card => ({
            updateOne: {
                filter: { id: card.id },
                update: {
                    $set: {
                        ...card,
                        last_updated: new Date()
                    }
                },
                upsert: true
            }
        }));

        // Execute bulk write
        console.log('Writing to MongoDB...');
        const result = await cardsCollection.bulkWrite(bulkOps);

        // Update metadata
        await metadataCollection.updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date(),
                    card_count: cards.length,
                    api_version: 'v7'
                }
            },
            { upsert: true }
        );

        console.log('Sync completed successfully');

        res.status(200).json({
            success: true,
            stats: {
                total_cards: cards.length,
                inserted: result.upsertedCount,
                updated: result.modifiedCount,
                matched: result.matchedCount,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({
            error: 'Sync failed',
            message: error.message
        });
    }
}
