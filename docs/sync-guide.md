# Synchronization Guide

## Google Places API Synchronization

### Overview

The Dutch Bottle Collect Checker uses a server-side synchronization script to populate the database with real supermarket data from Google Places API. This approach avoids CORS restrictions that would prevent direct browser API calls.

### Prerequisites

1. **Google Places API Key**
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the "Places API (New)" service
   - Configure API restrictions as needed

2. **Supabase Access**
   - Local development: Ensure `bunx supabase start` is running
   - Production: Have access to your Supabase project

3. **Environment Variables**
   ```env
   # Google Places API
   GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
   
   # Supabase service role key (required for sync operations)
   # For local development, get this from `bunx supabase status`
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

### Running the Sync Script

#### 1. Install Dependencies

```bash
# Install sync script dependencies
npm install node-fetch dotenv @supabase/supabase-js
```

#### 2. Execute Synchronization

```bash
# Run the synchronization script
node scripts/sync-supermarkets.js
```

### What the Sync Script Does

#### Data Collection
- **Search Coverage**: Searches for supermarkets across major Dutch cities including:
  - Amsterdam, Rotterdam, The Hague, Utrecht, Eindhoven
  - Groningen, Tilburg, Almere, Breda, Nijmegen
  - And many more municipalities

- **Search Terms**: Uses comprehensive search queries:
  - Generic: "supermarket", "grocery store"
  - Chain-specific: "Albert Heijn", "Jumbo", "PLUS", "Lidl", "Aldi", etc.

#### Data Processing
- **Duplicate Prevention**: Uses Google Place ID as unique identifier
- **Incremental Updates**: 
  - **New locations**: Inserts fresh supermarket data
  - **Existing locations**: Updates with latest information
  - **No duplicates**: Avoids creating duplicate entries

#### Database Operations
- **Insert Strategy**: Uses `ON CONFLICT (google_place_id) DO UPDATE`
- **Data Mapping**: Maps Google Places fields to database schema:
  ```sql
  google_place_id -> google_place_id (unique)
  name -> name
  formatted_address -> address
  geometry.location -> latitude, longitude
  opening_hours.open_now -> status determination
  business_status -> permanent/temporary closure detection
  ```

### Status Determination Logic

The sync script implements sophisticated status logic:

#### Priority Hierarchy
1. **Business Status Check**
   ```javascript
   if (place.business_status === 'CLOSED_PERMANENTLY') return 'closed';
   if (place.business_status === 'CLOSED_TEMPORARILY') return 'closed';
   ```

2. **Recent Incidents Check**
   ```javascript
   // Check for incidents in last 24 hours
   if (await hasRecentIncidents(googlePlaceId)) return 'closed';
   ```

3. **Opening Hours**
   ```javascript
   if (place.opening_hours?.open_now !== undefined) {
       return place.opening_hours.open_now ? 'open' : 'closed';
   }
   ```

4. **Safe Default**
   ```javascript
   return 'closed'; // When no data available
   ```

### Sync Frequency & Performance

#### Recommended Schedule
- **Development**: Manual runs as needed
- **Production**: Daily at 2 AM UTC (low traffic period)

#### Performance Considerations
- **API Quotas**: Google Places API has usage limits
- **Rate Limiting**: Script includes delays between requests
- **Batch Processing**: Processes cities sequentially to manage load
- **Error Handling**: Continues processing if individual requests fail

#### Cost Optimization
- **Smart Caching**: Only syncs when business hours might have changed
- **Incremental Updates**: Updates existing records rather than full replacement
- **Selective Sync**: Can be configured to sync specific regions only

### Automation Setup

#### GitHub Actions (Recommended)
```yaml
# .github/workflows/sync-supermarkets.yml
name: Sync Supermarkets
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install node-fetch dotenv @supabase/supabase-js
      - run: node scripts/sync-supermarkets.js
        env:
          GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
```

#### Alternative: Cron Job
```bash
# Add to your server's crontab
0 2 * * * cd /path/to/project && node scripts/sync-supermarkets.js
```

### Verification & Monitoring

#### Post-Sync Verification
1. **Check Supabase Dashboard**: Review the `supermarkets` table
2. **Application Testing**: Switch to "Database" mode in the app
3. **Map Verification**: Confirm new locations appear on the map

#### Monitoring Sync Health
- **Sync Metadata**: Check `sync_metadata` table for last sync timestamps
- **Error Logging**: Review console output for API errors or database issues
- **Data Freshness**: Verify `lastUpdated` timestamps on supermarket records

#### Success Indicators
```bash
# Example successful sync output
✅ Processing Amsterdam: Found 45 supermarkets
✅ Processing Rotterdam: Found 32 supermarkets  
✅ Processing Utrecht: Found 28 supermarkets
📊 Summary: 15 new locations added, 78 existing locations updated
⏱️  Total sync time: 3m 24s
```

### Troubleshooting Sync Issues

#### Common API Errors

**❌ "API key not found"**
```bash
Error: API key not found
```
- Verify `GOOGLE_PLACES_API_KEY` is set correctly
- Check API key hasn't expired in Google Cloud Console

**❌ "This service is not enabled"**
```bash
Error: Places API (New) not enabled
```
- Enable "Places API (New)" in Google Cloud Console
- Wait 5-10 minutes for activation

**❌ "Quota exceeded"**
```bash
Error: Quota exceeded
```
- Check usage in Google Cloud Console
- Consider increasing quotas or implementing more aggressive rate limiting

#### Database Connection Issues

**❌ "Database connection failed"**
```bash
Error: Failed to connect to Supabase
```
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)
- Check `SUPABASE_URL` environment variable
- Ensure Supabase is running (`bunx supabase status`)

**❌ "RLS policy errors"**
```bash
Error: Row Level Security policy violation
```
- Use service role key, not anon key
- Verify admin permissions are configured correctly

#### Performance Issues

**❌ "Sync taking too long"**
- Reduce the number of cities being processed
- Increase delays between API requests
- Consider splitting sync into multiple smaller jobs

**❌ "Memory usage too high"**
- Process cities in smaller batches
- Add garbage collection hints between city processing
- Monitor server resources during sync

### Best Practices

#### Security
- **Never commit API keys**: Use environment variables only
- **Rotate keys regularly**: Update API keys periodically
- **Minimum permissions**: Grant only necessary API access

#### Reliability
- **Error recovery**: Implement retry logic for failed requests
- **Monitoring**: Set up alerts for sync failures
- **Backup strategy**: Regular database backups before major syncs

#### Efficiency
- **Smart scheduling**: Run during low-traffic periods
- **Incremental updates**: Update only changed data
- **Resource monitoring**: Track API usage and costs