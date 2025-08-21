# Project Guidelines for Claude

## Package Management
- Use `bun` for dependency management instead of npm
- Use `bun add` instead of `npm install`
- Use `bun remove` instead of `npm uninstall`

## Build Commands
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run lint` - Run linting
- `bun run preview` - Preview production build

## Local Development Commands
- `bunx supabase start` - Start local Supabase (requires Docker Desktop)
- `bunx supabase stop` - Stop local Supabase
- `bunx supabase status` - Check local Supabase status
- `bunx supabase db reset` - Reset local database to initial state

## Database Setup
- Using Supabase for data storage
- Stores supermarket data and user inputs
- **Local Development**: Use `.env.local` (automatically created with local Supabase URLs)
- **Production**: Environment variables needed: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- Schema file: `supabase/migrations/20240101000000_initial_schema.sql` - applied automatically
- Remote deployment: Use Supabase SQL Editor or CLI with `supabase db push`

## Docker Deployment
- **Build Args Required**: For Docker builds, environment variables must be passed as build arguments:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- **Coolify Setup**: Add these as build arguments in your Coolify project settings
- **Note**: Vite environment variables are embedded at build time, not runtime

## Data Sources Priority
1. **Database** (Supabase) - Primary data source
2. **Google Places API** - Fallback for real-time data
3. **Mock Data** - Development fallback

## Maps
- Using Google Maps (no API key required for basic usage)
- Replaced Mapbox to eliminate token requirement