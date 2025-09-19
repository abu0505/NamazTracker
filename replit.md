# Overview

This is a modern Islamic Prayer Tracker web application built for tracking daily Namaz (Islamic prayers) with analytics, achievements, and a beautiful UI. The app helps users track their five daily prayers (Fajr, Dhuhr, Asr, Maghrib, and Isha), monitor their progress through visual analytics, earn achievements for consistent prayer completion, and maintain streaks. The application features a responsive design with dark/light theme support and glassmorphism UI elements.

# Recent Changes (January 19, 2025)

## UI/UX Improvements
- **Toast Notifications**: Repositioned to top-right corner with glassmorphism effects including backdrop blur, semi-transparent backgrounds, and subtle borders for both light and dark modes
- **Date Ordering**: All date lists (weeks, months) now display in descending order (most recent first) for improved usability and easier access to recent dates
- **Qaza Prayer Calculations**: Fixed analytics calculations to accurately show Qaza prayers as (Total obligatory prayers for period up to today) - (prayers performed for period up to today), eliminating inflated counts from future dates

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing with three main pages (Dashboard, Achievements, Analytics)
- **State Management**: React Context API for prayer tracking state and React Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with custom CSS variables for theming and glassmorphism effects
- **Charts**: Chart.js with react-chartjs-2 for prayer analytics and progress visualization
- **Theme System**: next-themes for dark/light mode switching with CSS custom properties

## Backend Architecture
- **Runtime**: Node.js with Express.js as the web framework
- **Development**: tsx for TypeScript execution in development mode
- **API Design**: RESTful API with routes for prayer records, achievements, and user statistics
- **Data Storage**: In-memory storage implementation with interface for easy database integration
- **Build System**: Vite for frontend bundling and esbuild for backend compilation

## Data Storage Solutions
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe database operations
- **Database**: PostgreSQL (via Neon Database) with structured schemas for users, prayer records, achievements, and statistics
- **Schema Design**: 
  - Users table for authentication
  - Prayer records with JSON columns for flexible prayer data storage
  - Achievements system for gamification
  - User statistics for progress tracking
- **Development Storage**: In-memory storage fallback for development without database dependency

## Authentication and Authorization
- **Session Management**: Prepared for session-based authentication with connect-pg-simple for PostgreSQL session storage
- **User System**: Basic user schema with username/password authentication ready for implementation
- **Demo Mode**: Currently uses a default "demo-user" for development and testing

## Core Features Architecture
- **Prayer Tracking**: Context-based state management with localStorage persistence for offline capability
- **Progress Calculation**: Utility functions for weekly/monthly progress calculation with streak tracking
- **Achievement System**: Configurable achievement types (perfect week, streaks, consistency) with metadata storage
- **Analytics Engine**: Multi-timeframe data processing for prayer completion trends and statistics

# External Dependencies

## Database and ORM
- **@neondatabase/serverless**: PostgreSQL database connection via Neon's serverless platform
- **drizzle-orm**: Type-safe ORM for database operations with PostgreSQL dialect
- **drizzle-kit**: Database migration and schema management tools

## UI and Design
- **@radix-ui/***: Complete set of accessible UI primitives for components like dialogs, dropdowns, tooltips
- **@tanstack/react-query**: Server state management and caching for API interactions
- **chart.js**: Data visualization library for prayer analytics and progress charts
- **next-themes**: Theme management system for dark/light mode switching
- **tailwindcss**: Utility-first CSS framework with custom theme configuration

## Development Tools
- **vite**: Modern build tool for fast development and optimized production builds
- **typescript**: Static type checking for enhanced development experience
- **@replit/vite-plugins**: Replit-specific development enhancements for error handling and debugging

## Utilities and Helpers
- **date-fns**: Date manipulation and formatting for prayer time calculations
- **clsx + tailwind-merge**: Conditional CSS class composition with Tailwind optimization
- **zod**: Runtime type validation for API data and form validation
- **wouter**: Lightweight routing library for single-page application navigation.