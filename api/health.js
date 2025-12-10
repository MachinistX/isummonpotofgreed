import { getCardsCollection } from './utils/mongodb.js';

export default async function handler(req, res) {
    try {
        // Test environment variables
        const envVars = {
            MONGODB_USER: process.env.MONGODB_USER ? '✓ Set' : '✗ Missing',
            MONGODB_PASSWORD: process.env.MONGODB_PASSWORD ? '✓ Set' : '✗ Missing',
            MONGODB_HOST: process.env.MONGODB_HOST ? '✓ Set' : '✗ Missing',
            MONGODB_DATABASE: process.env.MONGODB_DATABASE ? '✓ Set' : '✗ Missing',
            MONGODB_COLLECTION: process.env.MONGODB_COLLECTION ? '✓ Set' : '✗ Missing',
        };

        // Test MongoDB connection
        const cardsCollection = await getCardsCollection();
        const count = await cardsCollection.countDocuments();

        res.status(200).json({
            status: 'OK',
            message: 'MongoDB connection successful',
            environment: envVars,
            database: {
                connected: true,
                totalCards: count
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            stack: error.stack,
            environment: {
                MONGODB_USER: process.env.MONGODB_USER ? '✓ Set' : '✗ Missing',
                MONGODB_PASSWORD: process.env.MONGODB_PASSWORD ? '✓ Set' : '✗ Missing',
                MONGODB_HOST: process.env.MONGODB_HOST ? '✓ Set' : '✗ Missing',
                MONGODB_DATABASE: process.env.MONGODB_DATABASE ? '✓ Set' : '✗ Missing',
                MONGODB_COLLECTION: process.env.MONGODB_COLLECTION ? '✓ Set' : '✗ Missing',
            }
        });
    }
}
