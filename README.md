# Smart Plant Care System — Next.js + MongoDB (Prisma)

A streamlined full-stack + IoT app. Devices send moisture telemetry and poll for pump commands via simple HTTPS endpoints. The backend uses Next.js App Router API routes with Prisma (MongoDB). The UI is modern, responsive, and uses shadcn/ui components with an intuitive sidebar.

What’s inside
- Next.js App Router (frontend + API routes)
- MongoDB (Atlas or self-hosted) with Prisma ORM
- Cookie-based auth (JWT with `jose`) and bcrypt for password hashing
- Device telemetry ingestion + command queue
- Dashboard with KPI cards, live stream (SSE), and history chart
- CRUD for devices and plants

Prerequisites
- Node 18+
- A MongoDB connection string (Atlas recommended)

Environment variables
- DATABASE_URL: MongoDB URI (e.g., `mongodb+srv://user:pass@cluster/dbname?retryWrites=true&w=majority`)
- AUTH_SECRET (or STACK_SECRET_SERVER_KEY/JWT_SECRET): JWT signing secret

Quickstart
1) Install dependencies:
\`\`\`
npm install
\`\`\`

2) Provision MongoDB
- Create a database and get the DATABASE_URL.

3) Initialize schema
- Run the Prisma schema push command:
\`\`\`
npx prisma generate
npx prisma db push
\`\`\`

4) Run locally
\`\`\`
export DATABASE_URL="mongodb+srv://..."
export AUTH_SECRET="a-long-random-secret"
npm run dev
\`\`\`
Open http://localhost:3000

5) Create an account
- Visit /signup, then log in.

6) Register a device
- Go to /devices, enter Device ID and Name.
- Copy the generated secret into your ESP firmware.

7) Flash firmware
- Use the existing HTTP firmware, pointing API_BASE to your domain or http://localhost:3000
- Device endpoints:
  - POST /api/telemetry/ingest
  - GET /api/actions/pending?deviceId&secret
  - POST /api/actions/ack

8) Monitor and control
- Visit /dashboard to see live data (SSE) and toggle the pump.
- Adjust the moisture threshold and save (calibration command).
- Manage plants under /plants.
- View recent command history under /actions.
- Check account overview under /settings.

Key endpoints
- Auth: POST /api/auth/signup, POST /api/auth/login, POST /api/auth/logout, GET /api/users/me
- Devices: GET /api/devices, POST /api/devices
- Telemetry: POST /api/telemetry/ingest, GET /api/telemetry?deviceId&limit, GET /api/telemetry/stream?deviceId (SSE)
- Actions: POST /api/actions, GET /api/actions/pending, POST /api/actions/ack, GET /api/actions/list
- Plants: GET /api/plants, POST /api/plants

Database schema (MongoDB/Prisma)
- users(id, name, email unique, password_hash, created_at)
- devices(id text PK, name, owner_id -> users.id, secret, threshold, last_moisture, pump_on, last_seen, updated_at)
- telemetry(id, device_id -> devices.id, at, moisture, pump_on)
- commands(id, device_id -> devices.id, action, state, value jsonb, status, created_at, updated_at)
- plants(id, user_id -> users.id, name, species, notes, device_id -> devices.id, threshold, created_at)

Real-time streaming (SSE)
- The dashboard opens an EventSource to /api/telemetry/stream. The server periodically checks for new telemetry rows and emits them as SSE messages.
- This avoids client polling and works on Vercel.

Troubleshooting
- 401 on API calls: sign in first (/login)
- Prisma errors: ensure `DATABASE_URL` is set and `npx prisma db push` was run
- SSE not streaming: keep the /dashboard open; ensure the device is posting telemetry
- JSON parse errors: the client uses a defensive fetch helper that checks Content-Type and falls back to text

Design and UX
- Clean emerald/teal palette, elevated cards, and soft gradient background (styles/brand.css)
- Sidebar-based layout for intuitive navigation, using shadcn/ui Sidebar primitives [^1]
- Modern KPI layout with responsive grid and a history area chart

IoT notes
- Pump control: Device polls /api/actions/pending and receives actions like {"action":"pump","state":true}.
- After executing a command, the device should POST /api/actions/ack.

Security
- User auth uses bcrypt password hashes and signed JWT cookies (httpOnly).
- Devices authenticate with per-device secrets.
- Always use HTTPS in production.

Deploy
- Vercel: Add DATABASE_URL and AUTH_SECRET to Project Settings > Environment Variables, then deploy.

Contributing
- Extend with scheduling, multi-tenant orgs, or email notifications.
- Add tests around API routes and SQL queries as needed.
- Implement PUT/DELETE for devices and plants.
- Add role-based access and multi-tenant orgs.

[^1]: The sidebar uses the shadcn/ui Sidebar primitives (SidebarProvider, Sidebar, SidebarTrigger, etc.) as documented, for a responsive, collapsible experience with persisted state.
[^2]: Expected errors should be modeled as return values/UI state, with error boundaries for unexpected exceptions (Next.js App Router Error Handling docs).
