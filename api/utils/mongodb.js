import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}/?retryWrites=true&w=majority&appName=${process.env.MONGODB_APPNAME || 'isummonpotofgreed'}`;

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = client.db(process.env.MONGODB_DATABASE || 'card_information');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

export async function getCardsCollection() {
    const { db } = await connectToDatabase();
    return db.collection(process.env.MONGODB_COLLECTION || 'ygoprodeck_db');
}

export async function getMetadataCollection() {
    const { db } = await connectToDatabase();
    return db.collection('sync_metadata');
}
