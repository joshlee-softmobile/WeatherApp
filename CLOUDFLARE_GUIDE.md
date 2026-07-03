# Cloudflare Deployment & Local Dev Guide

This guide covers both **local development testing** (running worker + page on your machine) and **production deployment** to Cloudflare Workers + Pages.

---

## Prerequisites

Ensure the following are installed:
- **Node.js** (v18+) and **npm**
- **Wrangler CLI** — `npx wrangler --version` (no global install needed)
- A [WeatherAPI.com](https://www.weatherapi.com/) API key

---

## Part A — Local Development

This is the correct local dev workflow. You run **two separate processes** side by side in two terminals:

| Terminal | What runs | Port |
|---|---|---|
| Terminal 1 | `wrangler dev` (your Cloudflare Worker) | `http://127.0.0.1:8787` |
| Terminal 2 | `npm run dev` (your Vite frontend) | `http://localhost:3000` |

The Vite dev server is configured (in [`vite.config.js`](./page/vite.config.js)) to **proxy** any `/api/*` request to the local Worker — so your frontend code never needs to know where the Worker is.

---

### Step A1 — Set up the Worker local secrets

The Worker reads your WeatherAPI.com key from `env.WEATHER_API_KEY`. In production this is a Cloudflare secret, but **locally** Wrangler reads it from a special file called `.dev.vars`.

The file already exists at [`worker/.dev.vars`](./worker/.dev.vars). Confirm it looks like this:

```ini
# worker/.dev.vars
WEATHER_API_KEY=your_actual_api_key_here
```

> [!IMPORTANT]
> `.dev.vars` is in `.gitignore` and must **never** be committed. It is your local-only secret store.

---

### Step A2 — Verify `wrangler.toml` has `preview_id`

For `wrangler dev` to bind the KV namespace locally, the `[[kv_namespaces]]` block must include a `preview_id`. Open [`worker/wrangler.toml`](./worker/wrangler.toml) and confirm:

```toml
[[kv_namespaces]]
binding = "WEATHER_APP_KV"
id = "23b17026bf844dccb453adfe5c24eb09"
preview_id = "23b17026bf844dccb453adfe5c24eb09"  # same ID — required for wrangler dev
```

> [!NOTE]
> Without `preview_id`, Wrangler still starts but `env.WEATHER_APP_KV` will be `undefined` inside the Worker. This means every GET request will skip the cache and call WeatherAPI.com directly — it still works, but consumes API quota on every page load.

---

### Step A3 — Start the Worker (Terminal 1)

Open a terminal, navigate to the `worker` directory, and start Wrangler's local dev server:

```bash
cd worker
npx wrangler dev
```

**Expected output:**
```text
⛅️ wrangler 3.x.x
--------------------
Your worker has access to the following bindings:
- KV Namespaces:
  - WEATHER_APP_KV: 23b17026bf844dccb453adfe5c24eb09
- Vars:
  - WEATHER_API_KEY: "(hidden)"

[mf:inf] Ready on http://127.0.0.1:8787
```

**Quick smoke test** — with the Worker running, open a new terminal tab and run:

```bash
curl http://127.0.0.1:8787/api/weather
```

You should get a JSON array of weather data for all locations. If you see an error, check:
- Is `WEATHER_API_KEY` set in `.dev.vars`?
- Is the `preview_id` present in `wrangler.toml`?

---

### Step A4 — Start the Frontend (Terminal 2)

Open a **second** terminal, navigate to `page`, install deps (first time only), and start Vite:

```bash
cd page
npm install       # only needed once
npm run dev
```

**Expected output:**
```text
  VITE v8.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open **`http://localhost:3000`** in your browser. The frontend will call `/api/weather` which Vite proxies to `http://127.0.0.1:8787/api/weather` (your local Worker).

> [!TIP]
> The proxy target is defined in [`page/.env.development`](./page/.env.development):
> ```ini
> VITE_API_ENDPOINT=/api/weather
> VITE_API_PROXY_TARGET=http://127.0.0.1:8787
> ```
> You never need to change these for local dev.

---

### Step A5 — Test the Cron Trigger locally (optional)

The Worker has a scheduled cron (`*/10 * * * *`) that pre-fetches weather data into KV. You can simulate a cron trigger manually without waiting:

```bash
# In a third terminal (Worker must be running):
curl -X POST "http://127.0.0.1:8787/__scheduled?cron=*+*+*+*+*"
```

Or use Wrangler's built-in trigger endpoint:
```bash
curl "http://127.0.0.1:8787/__scheduled"
```

> [!NOTE]
> This is a Wrangler local dev feature — it only works when `wrangler dev` is running. The `/__scheduled` route is automatically available and maps to your `scheduled()` handler.

---

### Local Dev Architecture Summary

```
Browser (localhost:3000)
  │  GET /api/weather
  ▼
Vite Dev Server (:3000)
  │  proxy → 127.0.0.1:8787
  ▼
wrangler dev (:8787)  ← reads .dev.vars for WEATHER_API_KEY
  │  GET /api/weather
  ├── Check KV (local preview binding)
  │     cache hit  → return JSON
  │     cache miss → fetch WeatherAPI.com → store in KV → return JSON
  └── return JSON to Vite proxy → Browser
```

---

## Part B — Production Deployment

### Step B1 — Log in to Cloudflare

```bash
npx wrangler login
```

*Opens a browser window to authorize Wrangler with your Cloudflare account.*

---

### Step B2 — Create KV Namespace (first time only)

```bash
cd worker
npx wrangler kv namespace create WEATHER_KV
```

**Example output:**
```text
✨ Success! Created KV Namespace weather-worker-WEATHER_KV
[[kv_namespaces]]
binding = "WEATHER_APP_KV"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

Copy the generated `id` and update both `id` and `preview_id` in [`worker/wrangler.toml`](./worker/wrangler.toml).

---

### Step B3 — Upload the API Key as a Cloudflare Secret

```bash
cd worker
npx wrangler secret put WEATHER_API_KEY
```

Paste your WeatherAPI.com key when prompted. This encrypts it into Cloudflare's vault — it is **never** stored in your code or config files.

---

### Step B4 — Deploy the Worker

```bash
cd worker
npx wrangler deploy
```

**Example output:**
```text
✨ Success! Deployed weather-worker
  https://weather-worker.yoursubdomain.workers.dev
```

Note the Worker URL — you'll need it for the frontend env file.

---

### Step B5 — Configure the Frontend Production Endpoint

Open [`page/.env.production`](./page/.env.production) and set your Worker URL:

```ini
VITE_API_ENDPOINT=https://weather-worker.yoursubdomain.workers.dev/api/weather
```

> [!NOTE]
> If your Pages project and Worker share the same custom domain with a route mapping `/api/*` → Worker, you can use the relative path `/api/weather` here too — avoiding CORS entirely.

---

### Step B6 — Build and Deploy the Frontend

```bash
cd page
npm install
npm run build
npx wrangler pages deploy dist --project-name=josh-weather-app
```

Your app will be live at `https://josh-weather-app.pages.dev`.

---

## Step B7 (Highly Recommended) — Protect the API with WAF Rate Limiting

To prevent bots from hammering your Worker and consuming your quota:

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **Websites** → your domain → **Security** → **WAF** → **Rate limiting rules**.
3. Click **Create rate limiting rule** with these settings:
   - **Rule name**: `Rate Limit Weather API`
   - **If incoming requests match**:
     - *Field*: `URI Path`
     - *Operator*: `starts with`
     - *Value*: `/api/weather`
   - **Then**: `Block` — `10` requests per `1 Minute`
4. Click **Deploy**.

This blocks abusive IPs at the Cloudflare edge before they ever reach your Worker.

