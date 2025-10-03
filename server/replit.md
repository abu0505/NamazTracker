# Overview

This is a modern Islamic Prayer Tracker web application that helps Muslims track their five daily prayers (Namaz/Salah) with analytics, achievements, and progress visualization. The app provides daily prayer tracking, historical record management (Qaza prayers), streak tracking, and gamification through achievements to encourage consistent prayer habits.

# Setup Instructions

## Database Setup (REQUIRED)

**IMPORTANT: This project requires Supabase PostgreSQL database. Do NOT use Replit's built-in database.**

### Connecting Supabase Database:

1. **Get Supabase Connection String:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Database
   - Copy the **Transaction Pooler** connection string (uses port 6543)
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. **Add to Replit Secrets:**
   - Open Replit Secrets (lock icon in left sidebar)
   - Create a new secret named `DATABASE_URL`
   - Paste your Supabase connection string as the value

3. **Push Database Schema:**
   ```bash
   npm run db:push
   ```

4. **Verify Setup:**
   - The demo user will be automatically created on first run
   - Check server logs for "Database: PostgreSQL (Connected)"

### Why Supabase?
- Transaction pooler support for IPv4 compatibility
- Serverless PostgreSQL with automatic scaling
- Better performance and reliability than Replit's database
- Existing project data is stored in Supabase

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Routing**
- React 18 with TypeScript for type safety and component-based development
- Wouter for lightweight client-side routing with four main pages: Dashboard, Qaza (prayer history), Achievements, and Analytics
- Vite as the build tool and development server for fast builds and hot module replacement

**State Management**
- React Context API (PrayerContext) for global prayer tracking state
- TanStack React Query (formerly React Query) for server state management, caching, and API synchronization
- localStorage for offline persistence of prayer data

**UI & Styling**
- Shadcn/ui component library built on Radix UI primitives for accessible, customizable components
- Tailwind CSS with custom CSS variables for theming
- next-themes for dark/light mode support with system preference detection
- Glassmorphism design pattern with backdrop blur effects and semi-transparent backgrounds

**Data Visualization**
- Chart.js with react-chartjs-2 wrapper for prayer analytics
- Line charts for trends, doughnut charts for completion rates, bar charts for period comparisons
- Custom progress rings and visual indicators for streaks and weekly progress

## Backend Architecture

**Runtime & Framework**
- Node.js with Express.js as the web framework
- TypeScript execution via tsx in development mode
- RESTful API design with routes for prayer records, achievements, and user statistics

**Development Setup**
- Hot reload in development using Vite middleware integration
- esbuild for fast backend TypeScript compilation in production
- Environment-based configuration with dotenv

**API Structure**
- `/api/prayers/*` - Prayer record CRUD operations with batch update support
- `/api/achievements/*` - Achievement tracking and retrieval
- `/api/stats/*` - User statistics and analytics endpoints
- Date-based querying with range support for historical data

## Data Storage Solutions

**Database**
- PostgreSQL as the primary database via Supabase (serverless Postgres with transaction pooler)
- Drizzle ORM for type-safe database operations and schema management
- Connected using transaction pooler for IPv4 compatibility (port 6543)
- Demo user created for development/testing (id: 'demo-user')

**Schema Design**
- `users` table: Authentication with username/email, password hash, profile data
- `prayer_records` table: Daily prayer tracking with JSONB column for flexible prayer status storage (completed, onTime, completedAt for each of 5 prayers)
- `achievements` table: Gamification system with type, title, description, earned date, and metadata JSONB
- `user_stats` table: Aggregated statistics for performance optimization (total prayers, streaks, perfect weeks, etc.)

**Data Patterns**
- JSONB columns for flexible schema evolution without migrations
- Composite keys using userId + date for prayer records
- Indexed queries for date ranges and user lookups

## Authentication and Authorization

**Current Implementation**
- Demo mode with hardcoded "demo-user" for development
- Authentication code present but commented out throughout the application
- JWT token infrastructure prepared (bcrypt for password hashing, jsonwebtoken for tokens)
- Session management setup with connect-pg-simple for PostgreSQL-backed sessions

**Prepared Authentication Flow**
- Login/Register schemas with Zod validation
- Protected API routes with bearer token middleware
- User context and hooks ready for integration
- 7-day JWT expiration with automatic refresh

## Core Features Architecture

**Prayer Tracking**
- Five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) with completion and on-time status
- Real-time updates with optimistic UI updates via React Query mutations
- localStorage persistence for offline capability and instant loading

**Qaza (Historical) Management**
- Three view modes: Daily calendar picker, Weekly bulk update, Monthly overview
- Batch update API for efficient multi-date modifications
- Descending date ordering (most recent first) for better UX

**Analytics System**
- Period-based analytics (week, month, year) with dynamic chart generation
- Completion rate calculations, on-time percentage tracking
- Qaza prayer calculation: (Total obligatory prayers for period up to today) - (prayers performed)
- Trend analysis with historical data visualization

**Achievement System**
- Multiple achievement types: perfect_day, perfect_week, streak_milestone, consistency tracking
- Dynamic icon and gradient assignment based on achievement type
- Metadata storage for achievement context (streak count, period, rates)
- Milestone progress tracking with percentage completion

**Toast Notifications**
- Radix UI Toast positioned at top-right
- Glassmorphism effects with backdrop blur and semi-transparent backgrounds
- Theme-aware styling for both light and dark modes
- Success/error/info variants for different notification types

# External Dependencies

**Database & ORM**
- Supabase (Serverless PostgreSQL) for cloud-hosted database
- Drizzle ORM for type-safe database operations and migrations
- postgres npm package for database connections via transaction pooler

**UI Component Library**
- Radix UI primitives (@radix-ui/*) for accessible, unstyled components
- Shadcn/ui configuration for pre-built styled components
- Tailwind CSS for utility-first styling
- next-themes for theme management

**Data Visualization**
- Chart.js for chart rendering
- react-chartjs-2 for React integration
- Support for Line, Doughnut, and Bar chart types

**Form & Validation**
- React Hook Form for form state management
- Zod for runtime schema validation
- @hookform/resolvers for Zod integration

**State Management & API**
- TanStack React Query for server state and caching
- Native fetch API for HTTP requests
- Custom apiRequest wrapper with credential handling

**Authentication (Prepared)**
- bcrypt for password hashing (6.0.0 or higher)
- jsonwebtoken for JWT token generation/verification
- connect-pg-simple for session storage (configured but not active)

**Development Tools**
- tsx for TypeScript execution in development
- Vite for frontend bundling and dev server
- esbuild for production backend compilation
- cross-env for cross-platform environment variables