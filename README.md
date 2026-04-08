# Internal Team Chat Monorepo

This repository contains the source code for an internal team messaging application, similar to Slack and WhatsApp. It utilizes a **Turborepo** monorepo structure.

## Tech Stack
- **Web App**: Next.js 14 App Router, Tailwind CSS, Zustand
- **Mobile App**: Expo SDK 51, React Native, React Navigation
- **Backend API**: Node.js, Express, Socket.IO
- **Database/Auth/Storage**: Supabase (PostgreSQL, Realtime, Storage)
- **Infrastructure**: Docker, Upstash Redis

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)
- [Docker Compose](https://docs.docker.com/compose/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) or a Supabase Cloud account

### 2. Environment Setup
1. Copy `.env.example` to `.env` at the root, and configure it with your Supabase credentials.
2. In your Supabase Dashboard, go to **SQL Editor** and run the contents of `supabase/schema.sql` to initialize all tables, RLS rules, and Realtime triggers.

### 3. Installation
```bash
pnpm install
```

### 4. Running the Development Server
Since we use Turborepo, you can run all applications defined in the Monorepo concurrently:
```bash
pnpm dev
```
- The Next.js web application will start at `http://localhost:3000`.
- The Express/Socket.IO backend will start at `http://localhost:8080`.
- The Expo mobile application will generate a QR code for testing via the Expo Go app.

*Note*: Ensure Redis container is running for Socket.IO horizontal scaling capabilities via Docker Compose:
```bash
docker-compose up redis -d
```

## Structure
- `apps/server`: Express backend with Socket.IO endpoints.
- `apps/web`: Next.js frontend UI.
- `apps/mobile`: Expo React Native app.
- `packages/types`: Shared TypeScript definitions across the monorepo.
- `supabase/schema.sql`: Contains the complete database configuration script.
