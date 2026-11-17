# manhattanreasoning-app

The Manhattan Reasoning user dashboard, served at `app.manhattanreasoning.com`.

A static single-page app. It has no server code, no secrets and no data of its
own: every page calls the Manhattan Reasoning API from the browser with
`credentials: "include"`, and the API identifies the user by an HttpOnly
session cookie that this code can never read.

Vite + React + TypeScript, hash routing (`/#/builds/<id>`) so GitHub Pages
needs no rewrite rules. Runtime dependencies: `react`, `react-dom`,
`react-router-dom`.

## Pages

| Route | What it shows |
| --- | --- |
| signed out | "Sign in with GitHub", plus an explanation when a sign-in failed |
| `/#/` | Usage meter, membership status, recent builds; a warning only when the next build would be refused |
| `/#/builds` | Projects and the latest builds |
| `/#/builds/<id>` | Pipeline stages, timings and the live log of one build |
| `/#/membership` | Membership status, Subscribe / Manage billing, and the return from checkout |

## Local development

Needs Node 20+.

```sh
npm install
VITE_API_URL=http://localhost:8010 npm run dev    # http://localhost:5173
```

`VITE_API_URL` is the API to talk to; without it the app uses
`https://api.manhattanreasoning.com`. Open the app as `http://localhost:5173`
and point it at `http://localhost:<port>` (not `127.0.0.1`): the session
cookie is per-site, and the two names are different sites.

**Signing in locally.** `npm run dev` adds a "Developer sign-in" form under the
GitHub button. Paste an API key for the local API and it calls
`POST /auth/session` to get a session cookie, so you do not need a GitHub OAuth
app for local work. The form is compiled in only when `import.meta.env.DEV` is
true; the production build does not contain it, and CI fails if it ever does.

```sh
npm test            # unit tests (vitest)
npm run typecheck
npm run build       # typecheck + static build into dist/
```

## How it talks to the API

Everything goes through `src/api.ts`.

- `GET /auth/github/login?return_to=<path>`: plain navigation to start sign-in.
  The API returns the browser to `<app origin><return_to>` with the cookie set,
  or to `/?login_error=<code>` on failure (`src/messages.ts` explains each code).
- `GET /auth/me`, `DELETE /auth/session`
- `GET /usage`
- `GET /dashboard/overview`, `GET /dashboard/projects`, `GET /dashboard/jobs/{id}`
- `POST /dashboard/jobs/{id}/stream-ticket`, then
  `GET /dashboard/jobs/{id}/logs/stream?ticket=<ticket>` (server-sent events;
  the ticket is single-use, so a dropped stream asks for a new one)
- `POST /billing/checkout`, `POST /billing/portal`: each returns `{url}` and the
  browser is sent there. `webBillingRequest()` in `src/api.ts` is the one place
  that marks these requests as coming from the dashboard (a `?source=web`
  query parameter, no body), so Stripe returns to `/#/membership` here.

A `401` from any call while signed in drops back to the sign-in screen, which
returns the user to the page they were on.

The rule for "would the next build be refused" lives in `src/membership.ts` and
mirrors `membership_action` in the SDK, so the CLI and the dashboard agree.

## Deployment

`.github/workflows/deploy.yml` builds and tests every pull request. On a push
to `main` it also publishes `dist/` to GitHub Pages. `public/CNAME` sets the
custom domain.

The API must allow the app's origin with credentials (CORS) and set its session
cookie for a parent domain shared with the app.

### One-time steps for a person

These are not done by the workflow and have not been done yet:

1. **Make Pages available.** On GitHub's free plan for organisations, Pages
   only works for public repositories. Either make this repository public
   (it contains no secrets) or move the organisation to a paid plan.
2. **Enable Pages.** Settings → Pages → Source: **GitHub Actions**.
3. **Add DNS.** A `CNAME` record for `app` pointing at `<org>.github.io`.
4. In Settings → Pages, confirm the custom domain and tick **Enforce HTTPS**
   once the certificate is issued.
5. Re-run the workflow on `main`.

Until step 2, the `deploy` job on `main` fails; the `build` job is unaffected.
