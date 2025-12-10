import { getCardsCollection, getMetadataCollection } from './utils/mongodb.js';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Basic auth check
    const authHeader = req.headers.authorization;
    const apiKey = process.env.SYNC_API_KEY || 'your-secret-key';

    if (authHeader !== `Bearer ${apiKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const cardsCollection = await getCardsCollection();
        const metadataCollection = await getMetadataCollection();

        // Get last sync info
        const metadata = await metadataCollection.findOne({ _id: 'sync_info' });
        const isInitialSync = !metadata || !metadata.last_sync;

        console.log(isInitialSync ? 'Starting initial sync...' : 'Starting update sync...');

        // Fetch all cards from YGOProDeck API
        const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');

        if (!response.ok) {
            throw new Error(`YGOProDeck API error: ${response.statusText}`);
        }

        const data = await response.json();
        const cards = data.data;

        console.log(`Fetched ${cards.length} cards from API`);

        let inserted = 0;
        let updated = 0;

        if (isInitialSync) {
            // Initial sync: bulk upsert all cards
            console.log('Performing bulk upsert for initial sync...');
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

            const result = await cardsCollection.bulkWrite(bulkOps);
            inserted = result.upsertedCount;
            updated = result.modifiedCount;
        } else {
            // Update sync: only update new or missing cards
            console.log('Checking for new cards...');
            const existingIds = new Set(
                (await cardsCollection.find({}, { projection: { id: 1 } }).toArray())
                    .map(doc => doc.id)
            );

            const newCards = cards.filter(card => !existingIds.has(card.id));

            if (newCards.length > 0) {
                console.log(`Found ${newCards.length} new cards, inserting...`);
                const bulkOps = newCards.map(card => ({
                    insertOne: {
                        document: {
                            ...card,
                            last_updated: new Date()
                        }
                    }
                }));

                const result = await cardsCollection.bulkWrite(bulkOps);
                inserted = result.insertedCount;
            } else {
                console.log('No new cards found');
            }
        }

        // Update metadata
        await metadataCollection.updateOne(
            { _id: 'sync_info' },
            {
                $set: {
                    last_sync: new Date(),
                    card_count: cards.length,
                    api_version: 'v7',
                    sync_type: isInitialSync ? 'initial' : 'update'
                }
            },
            { upsert: true }
        );

        console.log('Sync completed successfully');

        res.status(200).json({
            success: true,
            sync_type: isInitialSync ? 'initial' : 'update',
            stats: {
                total_cards_in_api: cards.length,
                inserted: inserted,
                updated: updated,
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
