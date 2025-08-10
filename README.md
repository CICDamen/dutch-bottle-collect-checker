# Dutch Bottle Check - Statiegeld Locaties Nederland

A web application to help users find supermarket locations in the Netherlands for bottle return (statiegeld) services. Features both demo data and live Google Places API integration with cost-efficient caching strategies.

## Features

- 🗺️ **Interactive Map**: View all supermarket locations on an interactive Mapbox map
- 📍 **Smart Search**: Find supermarkets by name, chain, city, or postal code
- 📊 **Real-time Status**: See which locations are open, closed, or have unknown status
- 🔄 **Live/Demo Toggle**: Switch between demo data and live Google Places API data
- 💾 **Smart Caching**: 24-hour localStorage cache to minimize API costs
- 🤖 **Automated Sync**: Daily background sync via GitHub Actions
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚠️ **Incident Reporting**: Report issues with bottle return machines

## Technology Stack

### Frontend
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Maps**: Mapbox GL JS
- **State Management**: TanStack Query

### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **API**: Google Places API
- **Serverless Functions**: Vercel Functions
- **Hosting**: Vercel (Frontend + API)
- **Sync**: Automated cron jobs
- **Monitoring**: Vercel Analytics + Supabase Dashboard

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Places API key (optional, for live data)
- Mapbox API token (for maps)
- Supabase account (recommended for production)
- Vercel account (recommended for deployment)

### Development Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd dutch-bottle-check

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Google Places API Key (optional - for live data)
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Production Database (Supabase) - Recommended
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side configuration (for sync functions)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_key
SYNC_TOKEN=your_random_sync_token_here
```

## Production Setup (Recommended)

### 1. Supabase Database Setup

1. **Create Supabase Project**:
   - Visit [supabase.com](https://supabase.com) and create account
   - Create new project
   - Note your project URL and API keys

2. **Setup Database Schema**:
   ```sh
   # Run the schema SQL in Supabase SQL Editor
   cat supabase/schema.sql
   ```

3. **Configure Environment**:
   - Add Supabase URL and keys to `.env`
   - Update Vercel environment variables

### 2. Vercel Deployment

1. **Deploy to Vercel**:
   ```sh
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel dashboard:
   - `GOOGLE_PLACES_API_KEY`
   - `SUPABASE_URL` 
   - `SUPABASE_SERVICE_KEY`
   - `SYNC_TOKEN`

3. **Automatic Sync**: Vercel cron runs daily at 2 AM UTC

### 3. Google Places API Setup

1. **Get API Key**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)
   - Create project and enable **Places API**
   - Create credentials → API Key
   - Restrict to your domain for security

2. **Set Quotas** (Cost Control):
   - Set daily quota limit (e.g., $50/day)
   - Enable billing alerts

### 4. Alternative: GitHub Actions (Legacy)

For file-based storage (less recommended):

```sh
# Add to GitHub Secrets
GOOGLE_PLACES_API_KEY=your_key

# Manual sync
node sync-supermarkets.js
```

## Architecture

### Recommended Production Setup

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Sync Function  │    │   Database      │
│   (Vercel)      │────│  (Vercel Cron)  │────│  (Supabase)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                       ┌─────────────────┐
                       │ Google Places   │
                       │      API        │
                       └─────────────────┘
```

### Core Components

**Frontend Services**:
- **`src/services/databaseService.ts`**: Supabase database integration with real-time updates
- **`src/services/placesService.ts`**: Google Places API integration (fallback)
- **`src/hooks/useSupermarkets.ts`**: React hook for data management and state

**Backend Services**:
- **`api/sync-supermarkets.js`**: Vercel serverless function for data sync
- **`supabase/schema.sql`**: PostgreSQL database schema
- **`vercel.json`**: Deployment configuration with cron jobs

### Data Flow Strategy (Production)

1. **Database First**: Supabase PostgreSQL → localStorage cache → fallback to demo
2. **Real-time Updates**: WebSocket connections for live data changes
3. **Background Sync**: Vercel cron function runs daily at 2 AM UTC
4. **Smart Caching**: Multi-layer caching (database, CDN, browser)
5. **Failover**: Graceful degradation to cached/demo data

### Cost Optimization & Performance

**Database Benefits**:
- **Sub-100ms Queries**: Indexed PostgreSQL responses
- **Real-time Updates**: Live data changes via WebSockets
- **CDN Caching**: Global edge cache for faster loading
- **Concurrent Users**: Handles thousands of simultaneous users

**Cost Structure**:
- **Vercel Pro**: $20/month (includes cron + functions)
- **Supabase Pro**: $25/month (2GB database + real-time)
- **Google Places API**: ~$50/month (daily sync only)
- **Total**: ~$95/month for production-grade infrastructure

**Free Tier Option**:
- **Vercel Hobby**: Free (limited cron)
- **Supabase Free**: 500MB database
- **Total**: ~$50/month (Google Places only)

## Usage

### Live Data Mode

- Click "Live Data" button to enable Google Places API
- Requires valid API key in environment variables
- Data is cached locally for 24 hours
- Use "Refresh" button to force update

### Demo Mode

- Default mode using mock supermarket data
- No API key required
- Perfect for development and testing
- Includes sample incident reports

### Incident Reporting

- Click "Incident Melden" to report issues
- Search and select affected supermarket
- Submit incident with description
- Currently works with demo data only

## Development

### Available Scripts

```sh
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
vercel dev           # Local development with serverless functions
vercel deploy        # Deploy to Vercel
```

### Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API services and utilities
│   ├── databaseService.ts    # Supabase integration (production)
│   └── placesService.ts      # Google Places API (fallback)
├── types/              # TypeScript type definitions
├── data/               # Mock data and constants
└── pages/              # Main page components

api/
└── sync-supermarkets.js      # Vercel serverless sync function

supabase/
└── schema.sql               # Database schema

sync-supermarkets.js         # Legacy Node.js sync script
.github/workflows/           # GitHub Actions (legacy)
vercel.json                  # Vercel configuration
```

### Migration Path

**Phase 1** - Current (File-based):
- GitHub Actions sync
- localStorage caching
- Static JSON files

**Phase 2** - Hybrid (Recommended):
- Add Supabase database
- Keep file-based as fallback
- Gradual migration

**Phase 3** - Full Production:
- Database-first architecture
- Vercel serverless functions
- Real-time updates

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## API Reference

### Google Places API Usage

The application uses the following Google Places API endpoints:

- **Text Search**: Find supermarkets by chain name
- **Place Details**: Get detailed information about locations
- **Geographic Bounds**: Filter results to Netherlands only

### Rate Limits & Quotas

- **Request Frequency**: 100ms delay between requests
- **Daily Sync**: Once per day via GitHub Actions
- **Cache Duration**: 24 hours in localStorage
- **Fallback**: Demo data if API unavailable

## Troubleshooting

### Common Issues

**Database connection failing**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Check Supabase project status in dashboard
- Ensure RLS policies allow public read access

**Sync function not working**
- Check Vercel function logs in dashboard
- Verify `SYNC_TOKEN` environment variable
- Test API endpoint: `/api/sync-supermarkets`
- Ensure Supabase service key has write permissions

**Maps not loading**
- Check if Mapbox token is configured
- Verify token has correct permissions

**Live data fallback issues**
- Ensure `VITE_GOOGLE_PLACES_API_KEY` is set for fallback
- Check API key permissions in Google Cloud Console
- Verify Places API is enabled

**Performance issues**
- Check database query performance in Supabase dashboard
- Verify indexes are created (run `schema.sql`)
- Monitor Vercel function execution times

### Deployment Issues

**Vercel deployment failing**
- Verify all environment variables are set in Vercel dashboard
- Check build logs for missing dependencies
- Ensure `vercel.json` configuration is correct

**Cron job not running**
- Upgrade to Vercel Pro for cron functionality
- Check cron logs in Vercel dashboard
- Verify `SYNC_TOKEN` is configured

### Support & Monitoring

**Production Monitoring**:
- Vercel Analytics: Function performance
- Supabase Dashboard: Database metrics
- Google Cloud Console: Places API usage

**For issues and questions**:
1. Check existing GitHub issues
2. Create a new issue with reproduction steps
3. Include browser console logs if applicable
4. For database issues, include Supabase logs
