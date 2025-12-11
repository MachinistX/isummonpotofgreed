import { MongoClient } from 'mongodb';
import https from 'https';

// MongoDB connection string from environment variables
// Ensure these are set in your .env.local file or environment
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_APPNAME = process.env.MONGODB_APPNAME || 'isummonpotofgreed';

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_HOST) {
    console.error('❌ Missing required environment variables:');
    if (!MONGODB_USER) console.error('  - MONGODB_USER');
    if (!MONGODB_PASSWORD) console.error('  - MONGODB_PASSWORD');
    if (!MONGODB_HOST) console.error('  - MONGODB_HOST');
    console.error('\nPlease set these in your .env.local file or environment.');
    process.exit(1);
}

const MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}/?retryWrites=true&w=majority&appName=${MONGODB_APPNAME}`;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'card_information';
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || 'ygoprodeck_db';

// Helper function to fetch data using https module
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON response'));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function syncDatabase() {
    console.log('🔄 Starting database sync...');
    console.log('━'.repeat(50));

    let client;

    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB Atlas...');
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db(DATABASE_NAME);
        const cardsCollection = db.collection(COLLECTION_NAME);
        const metadataCollection = db.collection('sync_metadata');

        // Fetch cards from YGOProDeck API
        console.log('📥 Fetching cards from YGOProDeck API...');
        const data = await fetchJson('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        const cards = data.data;

        console.log(`✅ Fetched ${cards.length} cards`);

        // Check if this is initial sync
        const metadata = await metadataCollection.findOne({ _id: 'sync_info' });
        const isInitialSync = !metadata;

        if (isInitialSync) {
            console.log('🆕 Initial sync - inserting all cards...');

            // Prepare bulk operations
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
            const result = await cardsCollection.bulkWrite(bulkOps);

            console.log(`✅ Inserted: ${result.upsertedCount} cards`);
            console.log(`✅ Updated: ${result.modifiedCount} cards`);
        } else {
            console.log('🔄 Update sync - checking for new cards...');

            const existingIds = new Set(
                (await cardsCollection.find({}, { projection: { id: 1 } }).toArray())
                    .map(doc => doc.id)
            );

            const newCards = cards.filter(card => !existingIds.has(card.id));

            if (newCards.length > 0) {
                console.log(`🆕 Found ${newCards.length} new cards, inserting...`);

                const docsToInsert = newCards.map(card => ({
                    ...card,
                    last_updated: new Date()
                }));

                const result = await cardsCollection.insertMany(docsToInsert);
                console.log(`✅ Inserted: ${result.insertedCount} new cards`);
            } else {
                console.log('✅ No new cards found - database is up to date');
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

        console.log('━'.repeat(50));
        console.log('🎉 Sync completed successfully!');
        console.log(`📊 Total cards in API: ${cards.length}`);

    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Disconnected from MongoDB');
        }
    }
}

// Run the sync
syncDatabase();
