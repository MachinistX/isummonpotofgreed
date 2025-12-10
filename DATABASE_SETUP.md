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
In Vercel dashboard → Project Settings → Environment Variables, add:

```
MONGODB_USER=petarjovanchevic_db_user
MONGODB_PASSWORD=u9UYQWJCIQ1jplL6
MONGODB_HOST=isummonpotofgreed.yu8phoe.mongodb.net
MONGODB_DATABASE=card_information
MONGODB_COLLECTION=ygoprodeck_db
MONGODB_APPNAME=isummonpotofgreed
SYNC_API_KEY=<generate-strong-random-key>
CRON_SECRET=<generate-another-random-key>
```

### 2. Deploy to Vercel
```bash
git push origin main
```
Vercel will auto-deploy on push.

### 3. Run Initial Sync

**Option A: Using Admin Page (Easiest)**
1. Visit: `https://your-app.vercel.app/admin-sync.html`
2. Enter your `SYNC_API_KEY`
3. Click "Start Sync"
4. Wait 30-60 seconds for all ~13,000 cards to download

**Option B: Using cURL**
```bash
curl -X POST https://your-app.vercel.app/api/sync-cards \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY"
```

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

### Automatic Daily Sync
A Vercel Cron Job runs daily at 2 AM UTC to check for new cards.

**Setup:**
1. Cron is configured in `vercel.json`
2. Vercel Pro/Enterprise plans support cron
3. Free plans: manually sync periodically

### Manual Re-sync
Update database anytime via admin page:
- Visit: `https://your-app.vercel.app/admin-sync.html`
- Enter API key and sync

Or via cURL:
```bash
curl -X POST https://your-app.vercel.app/api/sync-cards \
  -H "Authorization: Bearer YOUR_SYNC_API_KEY"
```

**Sync Behavior:**
- **Initial sync**: Bulk upserts all cards (~13,000)
- **Update sync**: Only inserts new cards not in database
- Safe to run multiple times

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
