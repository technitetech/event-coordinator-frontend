# St. Lachland Hotel — Complete App (Next.js)

One self-contained Next.js application: a premium hotel website, an AI event
coordinator with **reservations**, customer accounts, and an admin dashboard.
It connects directly to MySQL through **server actions** — there is **no
separate API and no Flask backend** (the rule engine now runs inside this app).

## What it does

**Customers**
- Browse the site and plan an event (venue + menu + décor + instant cost estimate).
- **Reserve** a planned event — but only after logging in.
- Register / log in, and view their reservations on the account page.

**Admin**
- Log in and manage everything: users, bookings, and the rule-engine data
  (venues, menus, decorations, packages).

**No hardcoded credentials:** customers set their own bcrypt-hashed passwords;
the admin account is created once with `npm run create-admin`.

## Setup (one time)

### 1. Create the database (MySQL Workbench)

Open `schema.sql` in Workbench (File → Open SQL Script) and Execute (⚡). It
builds the whole database with seed data. (Running it resets the database.)

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=event_coordinator
SESSION_SECRET=<long random string>
```

Generate the secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Install and create the admin

```
npm install
npm run create-admin      # prompts for admin email + password
```

## Run

```
npm run dev
```

Open **http://localhost:3000**. That's it — one process, no Flask, no API server.

- Register a customer: `/register`
- Plan + reserve an event: `/events`
- Customer bookings: `/account`
- Admin: `/admin/login`

## How it works (for your dissertation)

- **Rule engine** (`app/(public)/events/actions.js`) is a server action that
  queries MySQL directly and applies the same IF–THEN rules as before (venue by
  capacity, rainy-season swap, menu by type, décor by remaining budget, budget
  checks, date-conflict). Verified to match the original Flask logic exactly.
- **Reservations** (`createReservation`) require a valid session; the booking is
  saved to `event_bookings` and linked to the customer via `user_id`.
- **Auth** (`app/(public)/auth-actions.js`): bcrypt password hashing + a signed,
  httpOnly session cookie (HMAC via `lib/session.js`).
- **Admin** (`app/admin/actions.js`): CRUD server actions guarded by
  `role === 'admin'`.
- **No API:** every data operation is a server action called directly from a
  component — no REST endpoints, no fetch, no second server.

## Structure

```
hotel-react/
├── schema.sql                 # full DB — run once in Workbench
├── .env.local.example
├── package.json               # next, react, mysql2, bcryptjs, dotenv
├── lib/{db.js, session.js}
├── scripts/create-admin.mjs
└── app/
    ├── layout.js, globals.css
    ├── components/            # Nav (session-aware), Footer, Reveal, Frond
    ├── (public)/
    │   ├── layout.js, auth-actions.js
    │   ├── page.js            # homepage
    │   ├── login, register, account
    │   └── events/            # actions.js (rule engine + reserve), page.js, EventPlanner.jsx
    └── admin/
        ├── actions.js, resources.js, login
        └── (panel)/           # dashboard + manage any table
```

## Notes

- The old Flask `backend/` folder is no longer used — the rule engine lives in
  this app now.
- Deleting a venue still referenced by a booking is blocked by the database.
- Security is coursework-appropriate: no login rate-limiting or password reset
  yet — reasonable future work to mention.
```
