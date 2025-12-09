# VisionFlow - 3D Vision Board Platform

## Overview

VisionFlow is a 3D vision board platform with AI-powered goal planning. It enables users to create immersive vision boards in a 3D room environment, set and track SMART goals with AI assistance, build habits with streak tracking, and share their boards publicly.

## Current State

The application is in active development with core MVP features implemented:
- User authentication via Replit Auth
- Vision board CRUD with 3D editor
- AI goal generation (mock implementation, to be connected to OpenAI)
- Task and habit tracking with calendar view
- Theme toggle (light/dark mode)

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TanStack React Query for data fetching
- Wouter for routing
- Framer Motion for animations
- Three.js + React Three Fiber for 3D
- Tailwind CSS + Shadcn/UI components
- Uppy for file uploads

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Replit Auth (OpenID Connect)
- Replit Object Storage for file uploads

## Project Structure

```
client/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI primitives
│   │   ├── VisionRoom.tsx # 3D canvas component
│   │   ├── AppSidebar.tsx # Navigation sidebar
│   │   ├── AIGoalModal.tsx # AI goal generation
│   │   └── ...
│   ├── pages/            # Route pages
│   │   ├── Landing.tsx   # Public landing page
│   │   ├── Home.tsx      # Dashboard
│   │   ├── Boards.tsx    # Board listing
│   │   ├── BoardEditor.tsx # 3D board editor
│   │   ├── Goals.tsx     # Goals management
│   │   └── Calendar.tsx  # Habit calendar
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   └── App.tsx           # Root component
server/
├── routes.ts             # API endpoints
├── storage.ts            # Database operations
├── replitAuth.ts         # Authentication
├── objectStorage.ts      # File storage
├── objectAcl.ts          # Access control
└── index.ts              # Server entry
shared/
└── schema.ts             # Database schema + types
```

## Database Schema

- `users`: User accounts from Replit Auth
- `sessions`: Session storage
- `vision_boards`: Vision boards with metadata
- `assets`: Images/media on boards with 3D positioning
- `goals`: SMART goals with progress tracking
- `tasks`: Tasks and habits
- `calendar_entries`: Daily habit check-ins
- `shared_links`: Board sharing tokens

## Key Features

### 3D Vision Room
- Interactive Three.js canvas with room environment
- Drag-and-drop asset placement
- Transform controls (position, scale, rotation)
- Wall-mounted images with perspective

### AI Goal Builder
- Natural language input for vision description
- SMART goal generation with milestones
- Suggested daily habits
- Goal selection and import

### Habit Tracking
- Calendar view with completion dots
- Streak counting
- Daily check-in interface
- Progress rings

## API Endpoints

- `GET/POST /api/boards` - Board CRUD
- `GET/PATCH/DELETE /api/boards/:id` - Single board
- `GET/POST /api/boards/:id/assets` - Board assets
- `GET/POST /api/goals` - Goals CRUD
- `GET/POST /api/tasks` - Tasks and habits
- `GET/POST /api/calendar-entries` - Habit check-ins
- `POST /api/objects/upload` - File upload URL
- `POST /api/boards/:id/share` - Share link creation

## Environment Variables

Required secrets (set via Replit Secrets):
- `DATABASE_URL`: PostgreSQL connection
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit identifier
- `ISSUER_URL`: OpenID Connect issuer

Object Storage (auto-configured):
- `PUBLIC_OBJECT_SEARCH_PATHS`: Public asset paths
- `PRIVATE_OBJECT_DIR`: Private upload directory
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Bucket ID

## Development

Start the app: `npm run dev`
Push schema changes: `npm run db:push`

## Design System

See `design_guidelines.md` for complete design specifications including:
- Typography hierarchy (Inter font)
- Color palette with dark mode support
- Spacing and layout patterns
- Component styling guidelines
- Animation standards
