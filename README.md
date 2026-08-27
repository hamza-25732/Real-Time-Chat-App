# Real-Time Chat App

MERN + Socket.IO real-time chat, organized as an npm workspaces monorepo.

- `client/` — React + Vite frontend (TypeScript, Tailwind)
- `server/` — Express.js + Socket.IO API (TypeScript, MongoDB Atlas)

See [CLAUDE.md](./CLAUDE.md) for the stack, structure, and coding conventions.

## Getting started

```bash
npm install
```

Copy the env templates and fill them in:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

| Variable             | Where    | Purpose                                                     |
| -------------------- | -------- | ----------------------------------------------------------- |
| `MONGODB_URI`        | `server` | MongoDB Atlas connection string (required)                  |
| `JWT_SECRET`         | `server` | Signing key for session tokens (required)                   |
| `JWT_EXPIRES_IN`     | `server` | Token lifetime, default `7d`                                |
| `PORT`               | `server` | HTTP + Socket.IO port, default `5000`                       |
| `CLIENT_ORIGIN`      | `server` | Comma-separated CORS allowlist; localhost is always allowed |
| `BCRYPT_SALT_ROUNDS` | `server` | Password hashing cost, default `12`                         |
| `GEMINI_API_KEY`     | `server` | Google Gemini key; blank disables the AI assistant          |
| `GEMINI_MODEL`       | `server` | Model id, default `gemini-3.6-flash`                        |
| `VITE_SERVER_URL`    | `client` | Backend URL the app calls and connects to                   |
| `VITE_BASE_PATH`     | `client` | Sub-path the app is served from, default `/`                |

## Running it

```bash
npm run dev
```

Runs both workspaces together via `concurrently`. The API and the WebSocket share
`http://localhost:5000`; the app is served at `http://localhost:5173`. Open it in
two tabs to watch messages arrive in both.

To run just one side: `npm run dev:server` or `npm run dev:client`.

## Chat modes

The app has two conversations, switched with the toggle above the message log:

- **Global Room** — public. Every signed-in user sees every message.
- **AI Assistant** — private per user, stored under `ai_<userId>`. Messages go
  to Google Gemini and the reply is saved with `isBot: true` and echoed back to
  that user's socket only.

Clients send a *mode* (`global` / `ai`), never a raw conversation id; the server
resolves `ai` against the authenticated user, so one user cannot read another's
assistant thread.

Without `GEMINI_API_KEY` the app still runs — global chat is unaffected and AI
mode reports that the assistant is not configured.

## Checks

```bash
npm run typecheck && npm run lint && npm run build
```

## Deployment

The two halves deploy separately: the API to Render, the static frontend to
GitHub Pages. Deploy the backend first — the frontend needs its URL at build
time, and the backend needs the frontend's origin for CORS.

### Backend on Render

Create a Web Service pointing at this repo:

| Setting         | Value                                     |
| --------------- | ----------------------------------------- |
| Root directory  | `server`                                  |
| Build command   | `npm install && npm run build`            |
| Start command   | `npm start`                               |

`npm start` runs `node dist/server.js`. The server reads `PORT` from the
environment, which Render sets — do not hardcode it.

Set these environment variables in the Render dashboard:

- `MONGODB_URI` — your Atlas connection string
- `JWT_SECRET` — generate with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `CLIENT_ORIGIN` — `https://<user>.github.io`
- `GEMINI_API_KEY` — required for the AI assistant mode
- `NODE_ENV` — `production`

Atlas rejects connections from unknown IPs, so allow Render's egress addresses in
Atlas → Network Access before the first deploy.

### Frontend on GitHub Pages

Point the client at the deployed API and set the repository sub-path, then
deploy:

```bash
VITE_SERVER_URL=https://<your-service>.onrender.com VITE_BASE_PATH=/<repo>/ npm run deploy --workspace client
```

`predeploy` builds first, and `deploy` pushes `dist/` to the `gh-pages` branch.
Enable Pages for that branch in the repository settings.

`VITE_BASE_PATH` must be `/<repo>/` for a project site
(`https://<user>.github.io/<repo>/`) so asset URLs resolve. Leave it unset for a
user or organisation site served from the domain root.

Both `VITE_` values are baked in at build time, so a change to either needs a
rebuild and redeploy.
