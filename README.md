# Lamton

Lamton is an entrepreneurship and mentorship platform for Bhutan. Phase 1 opens founder accounts, keeps a real session in MongoDB, and shows each person only the data that belongs to them.

Public registration creates a **founder**. It cannot create an admin or a verified mentor. Admin accounts are created with a server command. The web app never talks to MongoDB.

## Repository

```
apps/api          Express API, Mongoose, sessions, tests
apps/web          React, Vite, Tailwind CSS v4
packages/shared   Zod schemas and shared types
docs              Roadmap and phase progress
scripts           Windows helpers for provisioning and verification
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A MongoDB Atlas cluster (or another MongoDB server you control)

The API will not start without `MONGODB_URI`. It does not fall back to a JSON file or an in-memory database. Tests use their own in-memory MongoDB and refuse a non-local URI.

## Install

From the repository root, in PowerShell:

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env`. Generate a session secret:

```powershell
node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('base64url'))"
```

Put that value in `SESSION_SECRET`. Replace `MONGODB_URI` with the Atlas connection string and include the database name, for example `/lamton`.

On Atlas, create a database user and allow your current IP. Do not commit `.env`.

## Run

Start the API and the web app together:

```powershell
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000
- Health: http://localhost:4000/api/health

The Vite dev server proxies `/api` to the API, so the browser stays on port 5173 and the session cookie stays on that origin. Open the site as `localhost`, matching `WEB_ORIGIN`.

Run one side on its own:

```powershell
npm run dev -w @lamton/api
npm run dev -w @lamton/web
```

The API reads `.env` from the repository root (or from `apps/api/.env` if that file exists). Prefer the root file.

## Admin account

There is no admin form and no public admin endpoint. From the repository root, set the variables and run the command. The password must be 12 or more characters, include a letter and a number, and must not be a common passphrase. No default password is built in.

```powershell
$env:ADMIN_NAME = "Your Name"
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_PASSWORD = "a-unique-passphrase-48"
npm run provision:admin
```

You can also put those three variables in `.env` and run `npm run provision:admin`, or run `scripts/provision-admin.ps1`. If the email already belongs to a founder, the command stops and does not change that person's role. If the admin already exists, the password is left unchanged.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds shared types, then starts the API and the web app |
| `npm run build` | Compiles the shared package and the API, and builds the web app |
| `npm run typecheck` | Typechecks every package |
| `npm run lint` | Runs ESLint |
| `npm run test` | Runs API and web tests |
| `npm run provision:admin` | Creates one admin from the environment |
| `npm run start -w @lamton/api` | Starts the compiled API. Run `npm run build` first |

`scripts/verify.ps1` runs typecheck, lint, test, and build.

## Tests

API tests start `mongodb-memory-server`, point `MONGODB_URI` at it, and refuse `mongodb+srv` or any non-local host. They do not load `.env`. The first run downloads a MongoDB binary.

```powershell
npm test
```

Run that from the repository root. On this npm version, `npm run test -w @lamton/api` can print a failure and still return exit code 0, so a PowerShell `&&` chain will not stop. The root `npm test` script calls the test runners directly and returns their real exit code.

Covered behavior includes valid signup and login, duplicate emails, invalid input, rejected role fields, unauthorized access, a founder blocked from admin routes, session cookies, logout with CSRF, and the admin command's refusal to promote a founder.

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`. Defaults to `development`. |
| `PORT` | No | API port. Defaults to `4000`. |
| `MONGODB_URI` | Yes | MongoDB connection string. Placeholders are rejected. |
| `MONGODB_DB_NAME` | No | Database name when it is not already in the URI. |
| `SESSION_SECRET` | Yes | At least 32 random characters. Used to hash session tokens. |
| `WEB_ORIGIN` | No | Browser origin allowed for CORS and CSRF. Defaults to `http://localhost:5173`. |
| `COOKIE_SECURE` | No | `true` or `false`. Production defaults to a Secure cookie. Use `false` for local http. |
| `ADMIN_NAME` | Provisioning only | Admin display name. |
| `ADMIN_EMAIL` | Provisioning only | Admin email. |
| `ADMIN_PASSWORD` | Provisioning only | Admin password. Never given a default. |
| `VITE_API_URL` | No | Leave unset in development so the web app uses the `/api` proxy. |

## Authentication

- `POST /api/auth/register` creates a founder and sets an HttpOnly, SameSite=Lax session cookie.
- `POST /api/auth/login` checks the password with scrypt and opens a new session.
- `GET /api/auth/me` returns the current account and a CSRF token.
- `POST /api/auth/logout` requires the session and the `X-CSRF-Token` header, then deletes the session.
- `GET /api/health` reports application health and a real MongoDB ping. It returns 503 when the database is down.
- `GET /api/founder/workspace` is founder-only. Venture, mentorship, and research are `null` in this release.
- `GET /api/admin/summary` is admin-only and returns live account counts.
- `GET /api/users/:userId` lets a person read their own account. An admin may read any account. Anyone else receives 403.

Passwords are hashed with scrypt. Session tokens are random and only their HMAC is stored. The cookie is HttpOnly. In production it is Secure unless `COOKIE_SECURE=false`. Mutations from another origin are rejected, and cookie-authenticated mutations other than login and register require the CSRF token returned at login.

## Roles

| Role | How it is granted in Phase 1 |
| --- | --- |
| Founder | Public registration. The server sets this. The client cannot. |
| Admin | `npm run provision:admin` only. |
| Mentor | Not granted. The `/mentor` route exists for a future verified mentor and denies everyone else. |

Suspended accounts cannot sign in. There is no public screen that suspends an account yet. The field is enforced when it is set.

## Troubleshooting

**`MONGODB_URI is still the example placeholder`**  
`.env` still contains `USER:PASSWORD` or `@CLUSTER`. Paste the connection string from Atlas.

**`MongoDB connection failed`**  
The API stopped on purpose. Check the username, password, database name, and Atlas network access. Lamton will not switch to a file or a fake database.

**The health check says `database: down`**  
The process is up and MongoDB did not answer a ping. Fix the cluster, then refresh.

**Sign-in succeeds in the API but the site stays signed out**  
Open http://localhost:5173, not the API port and not `127.0.0.1`, unless `WEB_ORIGIN` uses that exact origin. The session cookie is tied to the site origin.

**`CSRF_ORIGIN` or `CSRF_INVALID`**  
A mutation came from a different origin, or the page did not send `X-CSRF-Token`. Use the dev proxy. Log in again if the token was lost.

**`EADDRINUSE`**  
Port 4000 or 5173 is already taken. Stop the other process or change `PORT`. The web proxy reads `PORT` from the root `.env`.

**Admin command says credentials are missing**  
Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the environment or `.env`. The command will not invent them.

**Tests try to use Atlas**  
They should not. Test mode ignores `.env` and rejects non-local URIs. If a test reports that refusal, it is protecting a shared database.

**The first test run is slow**  
`mongodb-memory-server` downloads a MongoDB binary on first use. Later runs reuse it.

## Phase 1 boundary

Mentor verification, venture editing, messaging, and AI research are described in [docs/ROADMAP.md](docs/ROADMAP.md). They are not implemented. Progress that has actually been exercised is recorded in [docs/PHASE_PROGRESS.md](docs/PHASE_PROGRESS.md).
