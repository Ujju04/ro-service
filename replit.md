# RO Service Marketplace — AquaFix

## Overview

Full-stack RO water purifier service marketplace platform. Similar to Urban Company for RO services. Includes customer-facing app, technician dashboard, AI chatbot, transparent pricing, booking system, and technician matching.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + framer-motion
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API server)
- **Auth**: Custom JWT (HMAC-SHA256, no external deps)
- **AI Chatbot**: Custom agentic chatbot (AquaBot) with intent detection and tool-based responses

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server (all backend routes)
│   │   └── src/
│   │       ├── routes/     # auth, bookings, technicians, products, pricing, reviews, chat
│   │       ├── middlewares/ # JWT auth middleware
│   │       └── lib/        # auth helpers (JWT, password hashing)
│   └── ro-marketplace/     # React + Vite frontend (served at /)
│       └── src/
│           ├── pages/      # Home, Auth, Booking, Products, AmcPlans, Pricing, Chat, user/Dashboard, technician/Dashboard
│           ├── context/    # auth-context.tsx
│           ├── components/ # layout.tsx, ui/shared.tsx
│           └── App.tsx
├── lib/
│   ├── api-spec/           # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/
│       └── src/schema/     # users, technicians, bookings, booking_parts, products, parts, amc_plans, amc_subscriptions, reviews
└── scripts/
```

## Key Features

### Customer Platform
- Book RO repair (instant or scheduled)
- Chat with AI chatbot (AquaBot) - diagnoses issues, estimates cost, recommends products
- Product marketplace (RO systems, filters, accessories)
- AMC plan subscriptions (Basic/Standard/Premium)
- Transparent pricing page with all parts and their costs in INR
- Service history and booking tracking

### Technician Dashboard (`/technician`)
- Orange-themed sidebar UI
- Online/Offline availability toggle
- Accept/Reject job requests
- View active jobs with customer details
- Generate bills with parts selection
- Earnings summary with charts

### AI Chatbot (AquaBot)
- Intent detection: diagnose, get_price, product_recommendation, amc_info, book_service, water_quality, faq
- Context-aware responses with symptom → parts mapping
- Returns product cards, cost estimates, booking CTAs inline in chat
- Quick-reply chips for common issues

### Transparent Pricing
- Carbon Filter: ₹450
- Sediment Filter: ₹450
- Membrane: ₹1250–1650
- Spun Filter: ₹150–250
- Adapter: ₹750
- Solenoid Valve: ₹450
- RO Pump: ₹1650–1850
- Flow Resistor: ₹100
- Tape: ₹100
- UV Lamp: ₹350
- UV Adapter: ₹350
- Filter Kit: ₹1050
- Full Kit: ₹2250
- Service Charge: ₹199

## API Endpoints

All routes are under `/api`:

**Auth:** POST /auth/register, POST /auth/login, POST /auth/technician/register, POST /auth/technician/login  
**User:** GET/PATCH /users/me  
**Bookings:** POST/GET /bookings, GET /bookings/:id, PATCH /bookings/:id/status, POST /bookings/:id/accept, POST /bookings/:id/reject, POST /bookings/:id/bill  
**Technicians:** GET /technicians/nearby, GET/PATCH /technicians/me, PATCH /technicians/me/availability, GET /technicians/me/bookings, GET /technicians/me/earnings  
**Products:** GET /products, GET /products/:id, GET /amc-plans, POST /amc-plans/subscribe  
**Pricing:** GET /pricing/parts, POST /pricing/estimate, GET /water-quality/:city  
**Chat:** POST /chat, GET /chat/history  
**Reviews:** POST /reviews, GET /reviews/technician/:id  

## Demo Accounts

Technician logins (password: `password123`):
- rajesh@aquafix.com (Delhi, online)
- amit@aquafix.com (Mumbai, online)
- priya@aquafix.com (Bangalore, offline)
- suresh@aquafix.com (Hyderabad, online)
- manoj@aquafix.com (Delhi, online)

## TypeScript & Composite Projects

Every lib package extends `tsconfig.base.json` (composite: true). Always typecheck from root:
- `pnpm run typecheck` — full type check
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types after spec changes
- `pnpm --filter @workspace/db run push` — push schema changes
