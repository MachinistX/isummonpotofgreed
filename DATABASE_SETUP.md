# MongoDB Database Setup

## Overview
This application uses MongoDB Atlas to store YGOProDeck card data, minimizing API calls per usage guidelines.

## Architecture
- **Backend**: Vercel serverless functions (`/api`)
- **Database**: MongoDB Atlas
- **Sync**: Manual/scheduled sync from YGOProDeck API

## Environment Variables

Set these in Vercel dashboard (Production) or `.env.local` (Development):

```
MONGODB_USER=your_user
MONGODB_PASSWORD=your_password
MONGODB_HOST=your_cluster.mongodb.net
MONGODB_DATABASE=card_information
MONGODB_COLLECTION=ygoprodeck_db
MONGODB_APPNAME=isummonpotofgreed
SYNC_API_KEY=generate-strong-random-key
```

## Initial Setup

### 1. Set Environment Variables
In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all MongoDB vars from above
3. Generate strong random key for `SYNC_API_KEY`

### 2. Deploy to Vercel
```bash
git push origin main
```

### 3. Run Initial Sync
After deployment, sync the database:

```bash
curl -X POST https://your-app.vercel.app/api/sync-cards \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY"
```

This will download all ~13,000 cards from YGOProDeck and store in MongoDB.

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "total_cards": 13000,
    "inserted": 13000,
    "updated": 0,
    "matched": 0,
    "timestamp": "2024-12-10T..."
  }
}
```

## API Endpoints

### GET /api/cards
Query cards from database.

**Parameters:**
- `id` - Card IDs (comma-separated)
- `name` - Exact name (pipe-separated for multiple)
- `fname` - Fuzzy name search
- `type`, `race`, `attribute`, `archetype` - Filters
- `sort` - Sort field (atk, def, name, etc.)

**Example:**
```
GET /api/cards?fname=Dark%20Magician
GET /api/cards?id=46986414,89631139
```

### GET /api/cards/[id]
Get single card by ID.

**Example:**
```
GET /api/cards/46986414
```

### POST /api/sync-cards
Admin endpoint to sync YGOProDeck → MongoDB.

**Headers:**
```
Authorization: Bearer YOUR_SYNC_API_KEY
```

## Database Schema

**Collection:** `ygoprodeck_db`
- All YGOProDeck fields preserved
- Additional `last_updated` timestamp

**Collection:** `sync_metadata`
```json
{
  "_id": "sync_info",
  "last_sync": "2024-12-10T...",
  "card_count": 13000,
  "api_version": "v7"
}
```

## Maintenance

### Re-sync Database
Run sync endpoint monthly or when YGOProDeck adds new cards:

```bash
curl -X POST https://your-app.vercel.app/api/sync-cards \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY"
```

### Monitor Usage
Check Vercel function logs for errors or performance issues.

## Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in MongoDB credentials
3. Run `npm run dev`
4. API endpoints available at `http://localhost:5173/api/*`

## Notes
- Initial sync takes ~30-60 seconds
- Database size: ~50MB for all cards
- Complies with YGOProDeck API rules (local storage)
