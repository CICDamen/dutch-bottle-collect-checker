# Setup Guide

## Prerequisites

- Node.js 18+ and bun
- Docker Desktop (required for local Supabase)
- Git

## Local Development Setup

### 1. Clone and Install Dependencies
```bash
git clone https://github.com/CICDamen/dutch-bottle-collect-checker.git
cd dutch-bottle-collect-checker
bun install
```

### 2. Start Local Supabase
```bash
# Start Docker Desktop first, then:
bunx supabase start
```

This will start all Supabase services locally and automatically:
- Apply database migrations
- Set up relevant tables and policies
- Generate local environment configuration

### 3. Start Development Server
```bash
bun run dev
```

The app will be available at `http://localhost:5173`

### 4. Access Admin Dashboard
- Navigate to `http://localhost:5173/admin`
- Admin access is handled through Supabase authentication

## Environment Configuration

When you run `bunx supabase start`, it automatically creates a `.env.local` file with the local Supabase configuration. You can also checkout the `.env.example` file for reference.

For production use with live Google Places data, use the server-side synchronization script described in the [Synchronization Guide](./sync-guide.md).

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
```