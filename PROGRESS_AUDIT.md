# NATGAS Uganda — Progress Audit

**Date:** September 2026  
**Method:** Full source trace from frontend route → API endpoint → Prisma model → PostgreSQL migration  
**Auditor:** Kiro AI

---

## 1. Completed Features

### Authentication & Sessions
- DB-backed session tokens (64-byte random hex, stored in `sessions` table)
- `httpOnly`, `secure` (production), `sameSite: lax` session cookie named `natgas_session`
- argon2id password hashing: memoryCost 64 MB, timeCost 3, parallelism 2
- Login rate limiting: 10 attempts / 15 min per IP (`authLimiter`)
- Account lockout after 5 failed attempts (15-minute lockout window, per-user)
- Generic login error messages (no user enumeration)
- Password reset flow: 32-byte token, 2-hour expiry, single-use, invalidates all sessions on reset
- Password change: invalidates all sessions, re-issues new session cookie
- Customer self-registration (`POST /auth/register`) for order portal only
- `/api/auth/me` session rehydration on page load
- Admin guard in React (redirects to `/admin/login` if unauthenticated)
- Soft logout (session deletion, cookie clear, audit log entry)

### Role-Based Access Control
- 6 roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `HR`, `CONTENT_MANAGER`, `CUSTOMER`
- Role hierarchy numeric map used by `requireRole()` middleware
- All `/api/admin/*` routes protected by `requireAuth` at router level
- Per-resource role checks on every admin endpoint
- `SUPER_ADMIN`-only: delete user, create/manage SUPER_ADMIN accounts
- Customer role cannot be promoted to staff role via API
- Admin cannot demote/promote SUPER_ADMIN accounts
- Role permission matrix (`ROLE_PERMISSIONS`) defined in shared types

### Products
- Full CRUD: create, update, archive (soft delete), publish/unpublish
- Unique slug generation with collision loop
- Price stored as `Decimal(12,2)` in PostgreSQL — no floating-point money
- `compareAtPrice` for promotional pricing
- Category filtering, search (name/description, case-insensitive), pagination
- Featured flag for homepage display
- JSON fields: `features` array, `specifications` record, `images` array
- Product status: DRAFT / PUBLISHED / ARCHIVED
- `publishedAt` timestamp set on first publish, preserved thereafter
- Audit log on create/update/archive
- Public endpoint filters `status=PUBLISHED AND isAvailable=true`
- Admin list shows all statuses

### Product Categories
- CRUD: create, update, delete (unlinks products before deletion)
- `isActive` flag, `displayOrder`, unique slug
- Public endpoint returns only active categories ordered by `displayOrder`

### Services
- Full CRUD with slug generation, audit logging
- `isFeatured`, `displayOrder`, JSON `features` array
- Public endpoint: `status=PUBLISHED` only
- 12 seeded services covering all NATGAS business lines

### News / Blog
- Full article CRUD with `NewsCategory` association
- `featuredImage`, `tags` (JSON array), SEO fields
- `publishedAt` timestamp, `isFeatured` flag
- Public endpoint: `status=PUBLISHED`, ordered by `publishedAt DESC`
- News categories CRUD with cascade unlink on delete
- 2 seeded articles (expansion announcement + safety tips)

### Careers / Jobs
- Full job CRUD with `EmploymentType` enum, `deadline`, `salaryRange`
- Public list filters out past-deadline jobs
- Job application form: CV upload (pdf/doc/docx only via storage service), cover letter
- Application status workflow: NEW → REVIEWING → SHORTLISTED → INTERVIEW → REJECTED/HIRED
- Confirmation email to applicant (non-blocking)
- 2 seeded published jobs

### Locations / Outlets
- CRUD: create, update, delete
- `isHeadquarters` flag with single-HQ enforcement (updateMany clears others before setting)
- `isActive` filter on public list
- Google Maps link from coords or address in frontend
- 3 seeded locations

### Contact Messages
- `POST /contact` with rate limiting (5/15 min), Zod validation
- Auto-marks UNREAD → READ on first admin view
- Status: UNREAD / READ / ARCHIVED
- Admin notification email (non-blocking, failure logged not thrown)
- Stores IP address and user agent

### Orders
- Customer self-service: requires auth (CUSTOMER role via `requireAuth`)
- Order items validated: all products must be `PUBLISHED + isAvailable`
- Price snapshot at order time: `unitPrice` and `lineTotal` locked as `Decimal(12,2)`
- `deliveryMethod` (DELIVERY / PICKUP), `preferredDate`, `notes`
- Order status workflow: PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → COMPLETED / CANCELLED
- `staffNotes` field for internal coordination
- `orderNumber` generator (format `NG-{year}-{random}`)
- Audit log on create and status update
- Admin list includes customer info and item prices

### Media
- Multer memoryStorage → sharp optimization → local or S3 upload
- Image dimensions extracted via sharp
- Content-type validation against whitelist
- 10 MB file size limit
- Public endpoint restricted to `gallery` and `team` folders, images only
- Admin CRUD: upload, list (paginated, filterable), update alt/caption, delete (storage + DB)
- Audit log on upload and delete

### FAQs
- CRUD: create, update, delete with audit logs
- `isActive` flag, `displayOrder`, optional `category`
- Public endpoint: `isActive=true`, optional category filter
- 8 seeded FAQs covering products, safety, payments, dealership

### Pages (CMS)
- Create, update, delete with `isSystem` guard (system pages cannot be deleted)
- JSON `content` blocks, SEO fields, hero fields, `publishedAt`
- Public endpoint: `status=PUBLISHED` by slug

### Website Settings
- Key/value store with type, category, label, description
- Public endpoint exposes whitelisted keys only (22 keys)
- Bulk update (`PUT /admin/settings`) and single-key update (`PUT /admin/settings/:key`)
- Restore presentation defaults endpoint
- 19 seeded settings covering company info, social links, SEO, hero copy

### Admin Dashboard
- Parallel Prisma queries for 8 resource counts
- DB health check on every dashboard load
- Last 10 audit log entries with user info

### Audit Logging
- `createAuditLog()` on every mutating admin action
- Logs: userId, action, resource, resourceId, metadata, IP, userAgent
- Failures swallowed (never breaks the main request)
- Admin list endpoint: paginated, filterable by user/action/resource/date range

### Public Website Pages
- Home: hero (image/video from CMS), announcement banner, product tabs, services, order steps, dealer locator, news, jobs, CTA — all API-connected
- Products: listing with pagination, category filter, search; product detail with gallery, specs, features, safety info
- Services: fetches from API with static fallback
- About Us: vision/mission (seeded), services summary, partners section
- Contact: form → `POST /contact`; success/error state
- FAQ: static accordion (8 items — see gap below)
- Careers: listing + detail with application form and CV upload
- News: listing + article detail with basic markdown parsing
- Media: gallery and team photo grids from API
- Locations: outlet list with distance search and Maps link
- Customer Account: register/login with `?next` redirect
- Order Cart: localStorage cart, checkout form → `POST /orders`
- Privacy Policy / Terms: minimal but appropriate for current scope
- 404 page

### Admin CMS Screens
- Dashboard, Products, Services, News, Jobs, Messages, Orders, Users, Media, Locations, Audit, Settings, Experience — all connected to backend
- Toast notifications for success/error on all admin actions
- ConfirmDialog component for destructive actions (used in AdminServices)

### Infrastructure
- Express middleware stack: Helmet CSP, CORS, compression, cookie-parser, body-parser, Morgan logger, rate limiter, error handler
- Graceful shutdown on SIGTERM/SIGINT (closes HTTP server, disconnects Prisma, 10s force exit)
- `keepAliveTimeout=65000`, `headersTimeout=66000` (ALB/nginx tuning)
- `unhandledRejection` and `uncaughtException` handlers
- Winston structured logging: console (dev), file transports in production
- Health endpoint `GET /api/health` with DB ping
- Local uploads served as static files via Express
- Vite proxy for `/api` in development
- Vitest configured for server tests

---

## 2. Partially Completed Features

### FAQ Page (frontend)
- Status: **Static only** — the `FAQ` component renders a hardcoded 8-item array and never calls `GET /api/faqs`
- The API endpoint exists and is seeded. The frontend ignores it.
- Fix needed: replace static array with `useEffect(() => api('/faqs'))` fetch with static fallback

### Services Page (frontend)
- Status: **Dual rendering bug** — when API returns services, both the `managedServices` grid AND the hardcoded `SERVICES` grid render simultaneously, producing duplicate content
- The legacy grid has `aria-hidden="true"` but is still visually rendered
- Fix needed: render API data when available, fall back to static only when API returns empty

### PublicLayout Navigation (dropdown)
- Status: **Non-functional click handlers** — "Opportunities" and "News & Blog" nav dropdown trigger buttons have `onClick={() => {}}` (no-op handlers). The dropdowns rely on CSS `:hover` only, which breaks on touch devices and keyboard navigation
- Fix needed: toggle state handler, keyboard support

### AdminOrders.tsx
- Status: **Minified/unreadable code** — entire component is on 2 lines with dense JSX. Functionally appears correct but is unmaintainable and uses `window.confirm` implicitly through the status `<select>` (no confirmation before status change)
- Fix needed: reformat to readable code, add confirmation for irreversible status changes (CANCELLED, COMPLETED)

### Email Brand Colour
- Status: **Wrong colour** — all email HTML templates use `background: #f97316` (orange) for headers and CTAs. The brand colour is `#0d3b35` (dark green)
- The welcome email also links to `/login` but the customer login route is `/account`

### Admin Contact Route
- Status: **Route mismatch** — `AdminMessages.tsx` calls `GET /admin/contact?limit=100` and `PUT /admin/contact/:id/status`. The admin routes file registers these endpoints correctly at `/admin/contact`. The nav link in `AdminLayout` routes to `/admin/messages`. The Express route is correct; the frontend URLs in the component are correct. **This item is actually correct** — no fix needed here (was a false positive from audit).

### Order Number Generation
- Status: **Collision risk** — `NG-{year}-${Math.random().toString(36).slice(2,8).toUpperCase()}` gives ~2.2 billion combinations but is non-deterministic. Under concurrent load, two simultaneous orders could generate the same number (no DB-level retry). The `orderNumber` field has a `@unique` constraint, so Prisma will throw `P2002`, but this surfaces as an unhandled 500 rather than a retry.
- Fix needed: retry loop on unique constraint violation, or use a sequential counter

### Config Environment Validation
- Status: **No startup validation** — `DATABASE_URL`, `SESSION_SECRET`, `JWT_SECRET` all use `optionalEnv()` with default dev placeholders. In production, a missing `DATABASE_URL` would surface as a Prisma connection error at runtime rather than a clear startup failure
- Fix needed: validate required env vars at startup with `requireEnv()` when `NODE_ENV=production`

---

## 3. Missing Requirements

### No Server-Side Tests
- `vitest` and `supertest` are installed as dev dependencies
- **Zero test files exist** — no `*.test.ts` or `*.spec.ts` under `server/src`
- Critical flows (login, auth, product CRUD, order creation, role enforcement) have no automated coverage

### No PM2 / systemd Configuration
- No `ecosystem.config.cjs` or `ecosystem.config.js` file
- No systemd service file
- Production process management is undocumented

### No Nginx Configuration
- No `nginx.conf` or example configuration provided
- Frontend/API proxy rules undocumented

### No DEPLOYMENT.md
- README covers development setup but not production deployment, rollback, or backup

### Shared Workspace Directory
- Root `package.json` declares `"workspaces": ["client", "server", "shared"]`
- No `shared/` directory or `package.json` exists
- npm will warn about the missing workspace on install

### No CSRF Protection
- `csurf` is listed as a dependency and `@types/csurf` as a devDependency
- It is not imported or used anywhere in the middleware chain
- State-mutating endpoints rely on cookie-based sessions without CSRF tokens
- SameSite=lax provides partial protection but is not sufficient for all attack vectors
- Note: The session cookie is `sameSite: lax`, which blocks most CSRF from external origins. For a CMS on a corporate website this is an acceptable residual risk, but the dependency should be removed or the protection implemented.

### JWT Is Unused
- `jsonwebtoken` is listed as a dependency, `JWT_SECRET` is in config
- No `jwt.sign()` or `jwt.verify()` calls anywhere
- The dependency should be removed to reduce attack surface

### Logs Directory
- Winston file transports write to `{cwd}/logs/` in production
- No `mkdir -p logs` or `logs/.gitkeep` documented in deployment instructions
- Will fail silently or throw on first log write if directory does not exist

### Missing Admin Routes
- `AdminPlaceholder.tsx` is registered at `/admin/experience` but the actual `AdminExperience` component is also at `/admin/experience` — no true placeholder routes remain
- No pages admin screen is wired to a frontend route (the `Page` model and API exist but there is no `/admin/pages` route in `App.tsx` or `AdminLayout`)

### Pages Admin CMS
- `Page` model, API endpoints (`GET/POST/PUT/DELETE /admin/pages`), and controller exist and are fully implemented
- No frontend admin page (`AdminPages.tsx`) exists
- No route in `App.tsx` for `/admin/pages`
- The `AdminLayout` sidebar does not include a Pages link

---

## 4. Broken or Disconnected Functionality

### Services Page Dual Render (confirmed bug)
When the API returns services, the `Services()` component renders both:
1. `<div className="svc-grid managed-services">` — API data
2. `<div className="svc-grid legacy-services" aria-hidden="true">` — 12 hardcoded items

The second grid is hidden from screen readers but visible on screen. Users see 12 + N service cards. The condition `managedServices.length > 0 && ...` gates only the first grid, not the removal of the second.

### FAQ Static Override
`FAQ()` renders from a hardcoded 8-item `items` array. The DB contains 8 seeded FAQs. The API endpoint `GET /api/faqs` works. The frontend never calls it. Changes made via AdminFAQs (if that existed) or direct DB edits would not appear on the page.

### Nav Dropdown Accessibility
Opportunities and News & Blog dropdowns have button elements with empty click handlers. This means:
- Keyboard users cannot open them (Enter/Space does nothing)
- Touch users on mobile cannot open them (no tap state)
- Only mouse hover works

### Home Testimonials Visible Placeholder Note
`Home.tsx` renders `<p className="review-note">Testimonials are displayed only after customer confirmation; these representative placeholders can be replaced with approved reviews in the CMS.</p>` — this annotation is visible to all public users below the testimonials section.

---

## 5. Security and Production Risks

| Risk | Severity | Details |
|------|----------|---------|
| Default `SESSION_SECRET` in production | **Critical** | `optionalEnv('SESSION_SECRET', 'natgas-dev-session-secret...')` — if `.env` is missing, session tokens are signed with a public string |
| Default `DATABASE_URL` is empty string | **Critical** | Empty string causes Prisma to throw at connect time, not at startup validation |
| Unused `jsonwebtoken` dependency | Medium | Attack surface: dependency vulnerabilities for unused code |
| Unused `csurf` dependency | Low | Dead code, listed as dependency but never activated |
| Hardcoded seed credentials in repository | Low | `NatGas@Admin2024!` — documented as dev-only; rotation required before production |
| Email templates use wrong brand colour | Low | Visual/brand inconsistency, not a security issue |
| `logs/` directory not provisioned | Low | Winston file transports will fail if directory absent |
| Missing `shared/` workspace | Low | npm workspace warning; no functional impact |
| `window.prompt()` for password in AdminUsers | Low | Password entered in browser-native prompt is not masked in some contexts; use a proper input field |
| Order number not retry-safe | Low | Concurrent duplicate `orderNumber` surfaces as 500 rather than graceful retry |
| `generalLimiter` counts uploads | Low | Uploads skip the rate limiter (`skip: req.path.startsWith('/uploads')`), but the upload limiter (20/15min) is separate and correct |
| No request ID / correlation ID | Info | Structured logs lack a request identifier for correlating logs to specific requests |

---

## 6. Prioritised Implementation Checklist

### P1 — Security and correctness (block production)
- [ ] Add production startup validation for `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGINS`
- [ ] Remove `jsonwebtoken` and `csurf` unused dependencies (or activate CSRF protection)
- [ ] Fix order number collision: add retry loop on `P2002`
- [ ] Provision `logs/` directory in deployment (mkdir -p)

### P2 — Functional bugs (visible to users)
- [ ] Fix Services page dual-render: hide legacy grid when API data is available
- [ ] Fix FAQ page: load from `/api/faqs`, use static as fallback only
- [ ] Remove public-facing testimonials placeholder annotation from Home
- [ ] Fix nav dropdown click handlers for keyboard/touch accessibility

### P3 — Code quality and maintainability
- [ ] Reformat AdminOrders.tsx into readable code
- [ ] Fix email template brand colour from #f97316 to #0d3b35
- [ ] Fix welcome email login URL from `/login` to `/account`

### P4 — Production configuration
- [ ] Write PM2 ecosystem file
- [ ] Write Nginx configuration example
- [ ] Write DEPLOYMENT.md
- [ ] Create `logs/.gitkeep` and document `mkdir -p logs` in deployment steps

### P5 — Missing features (add without breaking existing)
- [ ] Add Pages admin screen (`AdminPages.tsx` + route in App.tsx + sidebar link)
- [ ] Add basic server-side tests for auth and product endpoints

---

## Appendix: File Inventory

| File | Lines | Status |
|------|-------|--------|
| `server/src/app.ts` | 73 | Complete |
| `server/src/index.ts` | 65 | Complete |
| `server/src/config/index.ts` | 75 | Partial — no production validation |
| `server/src/middleware/auth.ts` | 65 | Complete |
| `server/src/middleware/errorHandler.ts` | 75 | Complete |
| `server/src/middleware/rateLimit.ts` | 55 | Complete |
| `server/src/middleware/validate.ts` | ~30 | Complete |
| `server/src/middleware/requestLogger.ts` | ~20 | Complete |
| `server/src/controllers/auth.controller.ts` | 160 | Complete |
| `server/src/controllers/products.controller.ts` | 170 | Complete |
| `server/src/controllers/orders.controller.ts` | 55 | Partial — order number not retry-safe |
| `server/src/controllers/dashboard.controller.ts` | 60 | Complete |
| `server/src/controllers/settings.controller.ts` | 110 | Complete |
| `server/src/controllers/users.controller.ts` | 200 | Complete |
| `server/src/controllers/media.controller.ts` | 120 | Complete |
| `server/src/controllers/contact.controller.ts` | ~50 | Complete |
| `server/src/controllers/news.controller.ts` | ~120 | Complete |
| `server/src/controllers/jobs.controller.ts` | ~150 | Complete |
| `server/src/controllers/services.controller.ts` | ~90 | Complete |
| `server/src/controllers/locations.controller.ts` | ~90 | Complete |
| `server/src/controllers/pages.controller.ts` | ~80 | Complete |
| `server/src/controllers/faqs.controller.ts` | ~70 | Complete |
| `server/src/controllers/audit.controller.ts` | ~30 | Complete |
| `server/src/services/auth.service.ts` | 200 | Complete |
| `server/src/services/email.service.ts` | 200 | Partial — wrong brand colour |
| `server/src/services/storage.service.ts` | 160 | Complete |
| `server/src/services/audit.service.ts` | ~40 | Complete |
| `server/prisma/schema.prisma` | 290 | Complete |
| `server/prisma/migrations/*` | — | 4 migrations, complete |
| `server/src/database/seed.ts` | 320 | Complete (dev credentials noted) |
| `client/src/App.tsx` | 160 | Partial — no /admin/pages route |
| `client/src/api/client.ts` | 130 | Complete |
| `client/src/styles.css` | ~900 | Complete |
| `client/src/components/PublicLayout.tsx` | 160 | Partial — dropdown click handlers are no-ops |
| `client/src/components/AdminLayout.tsx` | ~100 | Partial — no Pages link in sidebar |
| `client/src/pages/Home.tsx` | 240 | Partial — public-facing placeholder annotation |
| `client/src/pages/Products.tsx` | 200 | Complete |
| `client/src/pages/StaticPages.tsx` | 290 | Partial — Services dual-render, FAQ static-only |
| `client/src/pages/News.tsx` | ~120 | Complete |
| `client/src/pages/Careers.tsx` | ~200 | Complete |
| `client/src/pages/Media.tsx` | ~60 | Complete |
| `client/src/pages/Locations.tsx` | ~80 | Complete |
| `client/src/pages/OrderCart.tsx` | ~150 | Complete |
| `client/src/pages/CustomerAccount.tsx` | ~100 | Complete |
| `client/src/pages/admin/Login.tsx` | ~80 | Complete |
| `client/src/pages/admin/Dashboard.tsx` | 15 | Complete (but minified) |
| `client/src/pages/admin/AdminProducts.tsx` | 200 | Complete |
| `client/src/pages/admin/AdminOrders.tsx` | 5 | Functional but minified — unmaintainable |
| `client/src/pages/admin/AdminServices.tsx` | ~150 | Complete |
| `client/src/pages/admin/AdminNews.tsx` | ~150 | Complete |
| `client/src/pages/admin/AdminJobs.tsx` | ~200 | Complete |
| `client/src/pages/admin/AdminMedia.tsx` | ~150 | Complete |
| `client/src/pages/admin/AdminLocations.tsx` | ~150 | Complete |
| `client/src/pages/admin/AdminMessages.tsx` | ~130 | Complete |
| `client/src/pages/admin/AdminUsers.tsx` | ~130 | Partial — window.prompt for password |
| `client/src/pages/admin/AdminAudit.tsx` | ~70 | Complete |
| `client/src/pages/admin/AdminSettings.tsx` | 20 | Complete (minified but functional) |
| `client/src/pages/admin/AdminExperience.tsx` | 20 | Complete (minified but functional) |
| `client/src/pages/admin/AdminPlaceholder.tsx` | ~10 | Unused |
| Missing: `client/src/pages/admin/AdminPages.tsx` | — | Not created |
| Missing: `server/src/tests/*` | — | No test files |
| Missing: `ecosystem.config.cjs` | — | Not created |
| Missing: `DEPLOYMENT.md` | — | Not created |
