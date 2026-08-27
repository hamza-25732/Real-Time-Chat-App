# CLAUDE.md — Real-Time Chat Application

Project guidelines for Claude Code. Read this before writing or changing code in this
repository. These rules are binding for **both** the frontend and the backend.

---

## 1. Project overview

A real-time chat application: authenticated users join conversations and exchange
messages that are delivered instantly over WebSockets, with full history persisted in
MongoDB.

**Repository layout — npm workspaces monorepo:**

```
/                       root workspace: shared config, scripts, docs
├── client/             React + Vite single-page app
├── server/             Express.js + Socket.IO API
├── CLAUDE.md           this file
├── package.json        workspace definitions + cross-package scripts
├── tsconfig.base.json  shared strict TypeScript config (both packages extend it)
├── .editorconfig
└── .gitignore
```

Run everything from the repo root: `npm run dev`, `npm run build`, `npm run typecheck`,
`npm run lint`, `npm run test`. Each delegates to the workspaces via `--if-present`.
Never `cd` into a workspace to install — use `npm install <pkg> --workspace client|server`
so the root lockfile stays authoritative.

## 2. Stack

The stack is **MERN + Socket.IO**. Do not introduce an alternative to any of these
without asking first.

| Layer      | Technology                                                             |
| ---------- | ---------------------------------------------------------------------- |
| Database   | **MongoDB Atlas** (cloud-hosted), accessed via Mongoose ODM            |
| API server | **Express.js** on Node.js (LTS >= 20), ES modules                      |
| Real-time  | **Socket.IO** (server + `socket.io-client`) for chat, presence, typing |
| Frontend   | **React** built and served with **Vite**                               |
| Styling    | **Tailwind CSS** (v3, PostCSS + autoprefixer), **lucide-react** icons  |
| Language   | **TypeScript** everywhere — client and server                          |

Rules that follow from the stack:

- **MongoDB Atlas only.** Connection strings live in `.env` (`MONGODB_URI`) and are never
  committed or hardcoded. Every collection is defined by a typed Mongoose schema; no
  ad-hoc or untyped documents.
- **Socket.IO owns real-time; REST owns everything else.** Message delivery, presence,
  typing indicators, and read receipts go over sockets. Auth, history pagination, user
  profiles, and conversation CRUD go over REST. Do not duplicate an operation in both.
- **Socket event names are shared constants**, not inline string literals, and every event
  payload has a declared TypeScript type. Keep the client and server definitions in sync —
  when one changes, change the other in the same edit.
- **Vite env vars** exposed to the browser must be prefixed `VITE_` and must never carry
  secrets. Anything sensitive stays server-side.
- **Style with Tailwind utilities in the markup.** No component CSS files. Shared design
  values (brand colours, shadows, fonts) belong in `tailwind.config.js` under
  `theme.extend`, not repeated as arbitrary values. Icons come from `lucide-react`.

## 3. Strict typing

- **TypeScript strict mode is non-negotiable.** Both workspaces extend
  `tsconfig.base.json`, which enables `strict` plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitReturns`, `noUnusedLocals`, and
  `noUnusedParameters`. Do not weaken these flags to make code compile.
- **`any` is banned.** Use a precise type, a generic, or `unknown` followed by a narrowing
  check. `@ts-ignore` is banned; `@ts-expect-error` is allowed only with a comment
  explaining why and a plan to remove it.
- **Non-null assertions (`!`) are banned.** Narrow explicitly instead.
- **Validate at every boundary.** HTTP request bodies, socket event payloads, and
  `process.env` are untrusted input: parse and narrow them before use, and derive the
  TypeScript type from the parse — never hand-write a type that merely asserts the shape.
  `config/env.ts` is the reference pattern. A schema library (Zod) may replace the
  hand-rolled helpers once request validation lands — ask before adding it.
- **Type every export.** Public functions get explicit parameter and return types; React
  components get typed props. Inference is fine for locals.
- **Prefer discriminated unions** over optional-field grab-bags for state that has modes
  (connection status, message send state, and similar).
- `npm run typecheck` must pass before any change is considered done.

## 4. Modular file structure

Keep modules small and single-purpose. A file that does two unrelated things gets split.
**Soft cap: ~200 lines per file, ~50 lines per function** — exceed it only with a reason.

**Server — layered, one responsibility per layer:**

```
server/
├── config/       env parsing, db connection, app constants
├── models/       Mongoose schemas + document types
├── routes/       Express routers — URL wiring only
├── controllers/  HTTP request/response handling, no business logic
├── services/     business logic; the only layer that touches models
├── sockets/      Socket.IO namespaces, handlers, event registration
├── middleware/   auth, validation, error handling
├── validators/   request and socket payload validation schemas
├── types/        shared TypeScript types and interfaces
├── utils/        pure, dependency-free helpers
├── app.ts        Express app assembly (middleware + routes, no listen)
└── server.ts     process entry: connect DB, start HTTP + Socket.IO
```

Server source sits at the workspace root, not under `src/`. `app.ts` builds the
Express app and never listens; `server.ts` owns process concerns (DB connect, listen,
graceful shutdown) and creates the bare `http.Server` that Socket.IO attaches to.

Dependencies flow one way: `routes -> controllers -> services -> models`. A controller
must never query a model directly, and a service must never touch `req`/`res`.

**Client — feature-first, not type-first:**

```
client/src/
├── components/  reusable presentational components (feature-agnostic)
├── features/    one folder per feature (auth, chat, conversations, presence),
│                each owning its components, hooks, and types
├── hooks/       shared custom hooks
├── context/     React context providers (auth, socket)
├── services/    API clients and the Socket.IO client wrapper
├── types/       shared TypeScript types
├── utils/       pure helpers
├── pages/       route-level components
├── App.tsx
└── main.tsx
```

- **One socket connection for the whole app**, created once in a provider and consumed
  through a hook. Never call `io()` inside a component.
- **Components render; hooks hold logic.** Data fetching, socket subscriptions, and
  derived state belong in hooks, not in JSX bodies.
- **Every socket subscription is cleaned up** in its effect teardown. Leaked listeners are
  the number-one bug class in this app — treat a missing cleanup as a defect.
- No cross-feature imports of internals: features talk through shared `types/`,
  `services/`, or `hooks/`.

## 5. Naming conventions

Applied identically on both sides of the stack.

| Thing                      | Convention                        | Example                                                                       |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| Directories                | `kebab-case`                      | `features/chat-window/`                                                       |
| React component files      | `PascalCase.tsx`                  | `MessageBubble.tsx`                                                           |
| All other TS files         | `camelCase.ts`                    | `socketService.ts`                                                            |
| Server layer files         | `camelCase.<layer>.ts`            | `message.service.ts`, `auth.controller.ts`, `user.model.ts`, `chat.routes.ts` |
| Variables, functions       | `camelCase`                       | `sendMessage`                                                                 |
| Types, interfaces, classes | `PascalCase`                      | `ChatMessage`, `SocketPayload`                                                |
| Constants / enum members   | `SCREAMING_SNAKE_CASE`            | `MAX_MESSAGE_LENGTH`                                                          |
| Env variables              | `SCREAMING_SNAKE_CASE`            | `MONGODB_URI`, `VITE_API_URL`                                                 |
| Custom hooks               | `use` + `PascalCase`              | `useSocket`, `useConversation`                                                |
| Booleans                   | `is` / `has` / `should` prefix    | `isConnected`, `hasUnread`                                                    |
| Async functions            | verb-first                        | `fetchMessages`, `createRoom`                                                 |
| Mongoose models            | singular `PascalCase`             | `User`, `Message`, `Conversation`                                             |
| MongoDB collections        | plural `lowercase`                | `users`, `messages`                                                           |
| REST routes                | plural `kebab-case`               | `GET /api/conversations/:id/messages`                                         |
| Socket events              | `namespace:action`, `camelCase`   | `message:send`, `message:received`, `user:typing`, `presence:update`          |

- No abbreviations beyond well-known ones (`id`, `url`, `api`, `db`).
- Name by meaning, not by type: `messages`, not `messageArray`.
- Do not prefix interfaces with `I`.

## 6. Working rules for Claude

- **Match the surrounding code.** Follow the patterns already in the file over the generic
  form of a pattern.
- **Change what was asked.** No opportunistic refactors, renames, or dependency additions
  bundled into an unrelated change.
- **Ask before adding a dependency**, changing the data model, or altering the socket event
  contract — each has ripple effects across both workspaces.
- **Never commit secrets.** New env vars get added to `.env.example` with a placeholder
  value and documented in the relevant README.
- **Errors are handled, not swallowed.** Server errors go through the central error
  middleware; socket handlers wrap async work in try/catch and emit a typed error event.
  Never catch and discard silently.
- **Before calling work done:** `npm run typecheck` and `npm run lint` pass from the root,
  and the change was actually exercised (test or manual run) — say so honestly if it was
  not.
- Keep this file current: when a convention here stops matching reality, update the file in
  the same change.
