# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "bufords-toy-chest")
4. Disable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Realtime Database

1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Select "Start in test mode" (we'll configure security rules later)
4. Choose a location close to your users

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" and select Web (</>) 
4. Register your app with a name
5. Copy the Firebase configuration object

## 4. Configure Environment Variables

Create a `.env` file in the backend directory with:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## 5. Deploy to Production

For Render.com deployment:

1. Go to your Render dashboard
2. Navigate to your backend service
3. Go to "Environment" tab
4. Add all Firebase environment variables
5. Save and redeploy

## 6. Test the Setup

1. Start your backend: `npm run dev`
2. Check logs for "Firebase initialized successfully"
3. Test an API endpoint: `curl http://localhost:3001/api/leaderboard/2048`

## 7. Migration from SQLite (Optional)

If you have existing data in SQLite:

1. Make sure both databases are configured
2. Run the migration script: `npm run migrate`
3. Verify data was migrated correctly

## 8. Security Rules (Important!)

Go to Realtime Database > Rules and update to:

```json
{
  "rules": {
    "leaderboard": {
      ".read": true,
      ".write": true
    },
    "nominations": {
      ".read": true,
      ".write": true
    },
    "votes": {
      ".read": true,
      ".write": true
    },
    "gameVotes": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Benefits of Firebase

- ✅ **Free persistent storage** (1GB limit)
- ✅ **Real-time updates** for leaderboards
- ✅ **Global CDN** for fast reads
- ✅ **Automatic backups**
- ✅ **No database wipes on deployment**
- ✅ **Scales automatically**

## Troubleshooting

- **"Firebase not initialized"**: Check environment variables
- **"Database connection failed"**: Verify database URL format
- **"Permission denied"**: Update security rules
- **"Module not found"**: Run `npm install firebase`

## Free Tier Limits

- **Storage**: 1GB
- **Bandwidth**: 10GB/month
- **Connections**: 100,000 simultaneous

Your current usage will be well within these limits.