import { getMetadataCollection } from './utils/mongodb.js';

// This endpoint is called by Vercel Cron daily
// Configure in Vercel dashboard: Project Settings > Cron Jobs
export default async function handler(req, res) {
    // Verify this is a cron request
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Call the sync endpoint internally
        const syncUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/sync-cards`;

        const response = await fetch(syncUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SYNC_API_KEY || 'your-secret-key'}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Sync failed');
        }

        console.log('Daily sync completed:', result);

        res.status(200).json({
            success: true,
            message: 'Daily sync completed',
            result
        });

    } catch (error) {
        console.error('Daily sync error:', error);
        res.status(500).json({
            error: 'Daily sync failed',
            message: error.message
        });
    }
}
