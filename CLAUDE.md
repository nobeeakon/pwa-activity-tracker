# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Progressive Web App (PWA) for tracking activities and habits. Users can create activities, record dates when they perform them, add notes to records, and view their activity history in a calendar view. The app works offline and uses IndexedDB for local storage.

## Technology Stack

- **React 19.2** with TypeScript
- **Vite** (using rolldown-vite for faster builds)
- **Material-UI (MUI)** v6 for UI components
- **Dexie.js** for IndexedDB management
- **React Router** v7 for routing
- **date-fns** and **dayjs** for date handling
- **vite-plugin-pwa** for PWA functionality with Workbox

## Build and Development Commands

```bash
# Start development server (with PWA enabled in dev)
npm run dev

# Build for production (runs TypeScript check first)
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

## Architecture

### Database Layer (`src/db/`)

The app uses Dexie.js as a wrapper around IndexedDB for client-side persistence:

- `database.ts` - Defines the Dexie schema and handles migrations. Currently at version 2 (migrated from `recordedDates` array to `records` array with notes)
- `activityService.ts` - Provides CRUD operations for activities

### Data Model

Activities are stored with the following structure:

```typescript
interface Activity {
  id?: number;
  name: string;
  description: string;
  createdAt: Date;
  records: { date: Date; note?: string }[];
  everyHours?: number;  // Optional frequency tracking
}
```

### React Hooks Pattern

The app uses custom hooks for data access:

- `useActivities()` - Returns live array of all activities using `dexie-react-hooks`
- `useActivity(id)` - Returns a single activity with live updates
- `useMultiTabDetection()` - Detects multiple tabs using BroadcastChannel API

### Multi-Tab Detection (`src/utils/tabDetection.ts`)

Uses BroadcastChannel API to detect and warn when multiple tabs are open. Each tab:
- Generates a unique UUID
- Sends heartbeat messages every 3 seconds
- Sends goodbye message on tab close
- Maintains a Set of active tab IDs

This is a singleton service pattern with a React hook wrapper.

### PWA Configuration

- Base URL: `/pwa-activity-tracker/`
- Service worker: autoUpdate mode
- Runtime caching: Google Fonts with CacheFirst strategy
- Offline-capable with all assets cached
- PWA is enabled in both dev and production modes

### Routing Structure

- `/` - HomePage: Main activity list and creation form
- `/activity/:activityId` - ActivityDetailPage: Individual activity view with records and calendar

## Important Patterns

### Date Handling
- Use `date-fns` for formatting and relative time display
- Store dates as Date objects in IndexedDB
- Helper functions in `src/utils/activityHelpers.ts` for consistent date formatting

### Status Calculation
Activities have status based on hours until next due date:
- `onTrack` - More than 8 hours remaining
- `almostOverdue` - 0-8 hours remaining
- `shortOverdue` - 0 to -24 hours overdue
- `overdue` - More than 24 hours overdue

### Theming
- Custom Material-UI theme in `src/theme/theme.ts`
- Uses LocalizationProvider with dayjs adapter for date pickers
- Theme color: `#1976d2` (blue)

### Service Worker
- Registered in `src/main.tsx` via `virtual:pwa-register`
- Logs when new content is available or app is offline-ready
- Caches all assets matching `**/*.{js,css,html,ico,png,svg,woff2}`

## Database Migrations

When modifying the Activity schema:
1. Increment version number in `src/db/database.ts`
2. Add migration logic in `.upgrade()` callback
3. Handle both old and new data structures
4. Log migration progress for debugging

Example: Version 2 migrated from `recordedDates: Date[]` to `records: {date: Date, note?: string}[]`

## Notes and Constraints

- Record notes are limited to 300 characters (defined in `activityHelpers.ts`)
- The app assumes single-user usage (no authentication)
- All data is stored locally in the browser
- Multi-tab usage is discouraged via warning dialog