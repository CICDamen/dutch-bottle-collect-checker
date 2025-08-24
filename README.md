# Dutch Bottle Collect Checker - Statiegeld Locaties Nederland

A web application to help users find supermarket locations in the Netherlands for bottle return (statiegeld) collection services. Features live Google Places API integration with cost-efficient caching strategies, plus admin dashboard for incident management.

## Features

- 🗺️ **Interactive Map**: View all supermarket locations on an interactive Google Maps interface
- 📍 **Smart Search**: Find supermarkets by name, chain, city, or postal code
- 📊 **Real-time Status**: See which locations are open, closed, or have unknown status
-  **Smart Caching**: 24-hour localStorage cache for optimal performance
- 🔄 **Backend Sync**: Manual/scheduled sync with Google Places API via server scripts
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚠️ **Incident Reporting**: Report issues with bottle return machines
- 👨‍💼 **Admin Dashboard**: Manage incidents and supermarket data
- 🔐 **Role-based Access**: Secure admin permissions

## Quick Start

### Prerequisites
- Node.js 18+ and bun
- Docker Desktop (required for local Supabase)
- Git

### Setup
```bash
# Clone and install
git clone https://github.com/CICDamen/dutch-bottle-collect-checker.git
cd dutch-bottle-collect-checker
bun install

# Start local Supabase (requires Docker)
bunx supabase start

# Start development server
bun run dev
```

App available at `http://localhost:5173` | Admin at `http://localhost:5173/admin`

## Documentation

📚 **Comprehensive guides available in the [`docs/`](./docs/) folder:**

- **[Setup Guide](./docs/setup.md)** - Complete installation and configuration
- **[Admin Guide](./docs/admin-guide.md)** - Admin dashboard setup and usage
- **[Synchronization Guide](./docs/sync-guide.md)** - Google Places API sync setup
- **[Architecture Guide](./docs/architecture.md)** - Technical system overview
- **[Troubleshooting Guide](./docs/troubleshooting.md)** - Common issues and solutions

## Technology Stack

**Frontend:** React + TypeScript, Vite, shadcn/ui + Tailwind CSS, Google Maps React API  
**Backend:** Supabase (PostgreSQL), Google Places API (server-side sync), Real-time subscriptions  
**State Management:** TanStack Query with database-first caching strategies

## Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run ESLint

# Local Supabase commands
bunx supabase start  # Start local Supabase (requires Docker)
bunx supabase stop   # Stop local Supabase
bunx supabase status # Check local Supabase status
bunx supabase db reset # Reset local database to initial state

# Data synchronization (requires Google Places API key)
node scripts/sync-supermarkets.js # Sync supermarket data from Google Places API

# Docker deployment
docker build -t dutch-bottle-checker . # Build Docker image
docker run -p 8080:8080 dutch-bottle-checker # Run container
docker-compose up -d  # Run with docker-compose
```

## Project Structure

```
dutch-bottle-collect-checker/
├── docs/                        # 📚 Documentation
│   ├── setup.md                 # Setup and installation guide
│   ├── admin-guide.md           # Admin dashboard configuration
│   ├── sync-guide.md            # Google Places API synchronization
│   ├── architecture.md          # Technical system overview
│   └── troubleshooting.md       # Common issues and solutions
├── src/
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries (Supabase, utils)
│   ├── pages/                   # Main page components
│   ├── services/                # API services (database, places)
│   ├── types/                   # TypeScript type definitions
│   └── data/                    # Mock data for development
├── scripts/
│   └── sync-supermarkets.js     # Google Places API sync script
├── supabase/
│   ├── migrations/              # Database schema migrations
│   └── config.toml              # Local Supabase configuration
└── public/                      # Static assets (favicon, etc.)
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and test locally with `bun run dev`
4. Submit a pull request

## Development Workflow

1. **Setup Local Environment**: Follow the [Setup Guide](./docs/setup.md)
2. **Access Features**:
   - Main app: `http://localhost:5173`
   - Admin dashboard: `http://localhost:5173/admin`
   - Supabase dashboard: `http://localhost:54323`
3. **Data Management**:
   - **Initial Setup**: Run `node scripts/sync-supermarkets.js` to populate database with Google Places data
   - **Ongoing Updates**: Re-run sync script as needed or set up scheduled automation
4. **Testing**: Report incidents via main app, manage in admin dashboard

## Docker Deployment

### Quick Docker Setup

```bash
# Build and run with Docker
docker build -t dutch-bottle-checker .
docker run -p 8080:8080 -e VITE_SUPABASE_URL=your-url -e VITE_SUPABASE_ANON_KEY=your-key dutch-bottle-checker
```

### Docker Compose Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables** in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_GOOGLE_PLACES_API_KEY=your-web-api-key-with-referrer-restrictions
   GOOGLE_PLACES_SERVER_API_KEY=your-server-api-key-no-referrer-restrictions
   ```

3. **Start the application**:
   ```bash
   docker-compose up -d
   ```

4. **Access the application**:
   - Application: `http://localhost:8080`
   - Health check: `http://localhost:8080/health`

### Production Deployment

For production deployment, consider:
- Using a proper domain with HTTPS
- Setting up environment variables in your hosting platform
- Configuring proper logging and monitoring
- Setting up automated backups for your Supabase database

**Deployment Platforms:**
- **Docker**: Use the provided Dockerfile with any Docker-compatible platform
- **Cloud Run**: Deploy directly from container registry
- **Kubernetes**: Use the Docker image with appropriate manifests
- **Railway/Render**: Deploy using the Dockerfile

## Environment Variables

This project uses **two separate** Google Places API keys for optimal security:

### Google Places API Keys
- **`VITE_GOOGLE_PLACES_API_KEY`**: For web app Google Maps integration
  - ✅ **Must have HTTP referrer restrictions** (e.g., `localhost:*`, `yourdomain.com/*`)
  - Used by: Frontend React components
  - The `VITE_` prefix exposes it to client-side code

- **`GOOGLE_PLACES_SERVER_API_KEY`**: For server-side data synchronization  
  - ✅ **No restrictions** OR **IP address restrictions only**
  - ❌ **Cannot have HTTP referrer restrictions** (causes "API keys with referer restrictions cannot be used with this API" error)
  - Used by: `scripts/sync-supermarkets.js`
  - Fallback: Uses `VITE_GOOGLE_PLACES_API_KEY` if not set (not recommended for production)

### Why Two Keys?
Google's security model requires different restriction types:
- **Web apps** need HTTP referrer restrictions for browser security
- **Server APIs** cannot use referrer restrictions (they work server-to-server)

### API Key Setup Guide
1. **Create two API keys** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Enable these APIs** for both keys:
   - Places API
   - Maps JavaScript API
3. **Configure restrictions**:
   - **Web key**: Add HTTP referrer restrictions
   - **Server key**: Add IP restrictions OR leave unrestricted (monitor usage)

## Known Issues / TODOs

### Google Maps Integration
- ✅ **RESOLVED**: Google Maps "This page can't load Google Maps correctly" error
  - **Solution**: Ensure `VITE_GOOGLE_PLACES_API_KEY` is set in your `.env` file
- **Resolve Google Maps watermark showing "for development purposes only"**

See [Troubleshooting Guide](./docs/troubleshooting.md) for solutions to these and other common issues.

## Security

- Admin access controlled via Row Level Security (RLS) policies
- Role-based permissions with `supermarket_admin` user metadata
- All admin functions include proper authorization checks
- Database functions use `SECURITY DEFINER` with access control

## License

This project is licensed under a **Non-Commercial Use License**.

**Permitted Uses:**
- ✅ Personal use and learning
- ✅ Educational purposes
- ✅ Open source contributions
- ✅ Research and development

**Prohibited Uses:**
- ❌ Commercial use by third parties
- ❌ Redistribution for profit
- ❌ Integration into commercial products without permission
- ❌ Selling or licensing derivatives

For commercial licensing inquiries, please contact the repository owner.

## Support

- 📖 **Documentation**: Check the [`docs/`](./docs/) folder for comprehensive guides
- 🐛 **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/CICDamen/dutch-bottle-collect-checker/issues)
- 🔧 **Troubleshooting**: See [Troubleshooting Guide](./docs/troubleshooting.md)