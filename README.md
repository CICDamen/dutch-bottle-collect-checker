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

## Known Issues / TODOs

### Google Maps Integration
- **Resolve Google Maps watermark showing "for development purposes only"**
- **Resolve message: "This page can't load Google Maps correctly. Do you own this website?"**

See [Troubleshooting Guide](./docs/troubleshooting.md) for solutions to these and other common issues.

## Security

- Admin access controlled via Row Level Security (RLS) policies
- Role-based permissions with `supermarket_admin` user metadata
- All admin functions include proper authorization checks
- Database functions use `SECURITY DEFINER` with access control

## Support

- 📖 **Documentation**: Check the [`docs/`](./docs/) folder for comprehensive guides
- 🐛 **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/CICDamen/dutch-bottle-collect-checker/issues)
- 🔧 **Troubleshooting**: See [Troubleshooting Guide](./docs/troubleshooting.md)