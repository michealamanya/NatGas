# NATGAS Uganda Platform

Corporate website and secured CMS for NATGAS Uganda Limited. The monorepo contains a React/Vite client and an Express/Prisma/PostgreSQL API.

## Requirements

- Node.js 20+
- PostgreSQL 15+

## Local setup

1. Install dependencies: `npm install`
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` plus secure local secrets.
3. Generate Prisma client: `npm run db:generate --workspace=server`
4. Create the development schema: `npm run db:migrate`
5. Seed content: `npm run db:seed`
6. Start both applications: `npm run dev`

The public client runs on `http://localhost:5173` and the API runs on `http://localhost:3001`.

## Key commands

- `npm run build` — production build for all workspaces
- `npm run db:migrate` — create and apply a development migration
- `npm run db:seed` — add sample products, locations, news and an initial administrator
- `npm run test` — run server tests when present

## Security notes

Authentication uses Argon2 password hashes and database-backed, HTTP-only cookie sessions. Never use the seeded development password in production; create a unique administrator account and rotate secrets before deployment. Set `NODE_ENV=production`, restrict `CORS_ORIGINS`, configure HTTPS, and use S3-compatible object storage for production uploads.

## Current implementation status

The API covers authentication, RBAC, audit logging, products, news, services, careers, locations, media, contact messages, FAQs, pages and settings. The client provides the public site, secure admin sign-in, and functional product and news publishing modules. Remaining admin screens can be completed against their existing API endpoints.
