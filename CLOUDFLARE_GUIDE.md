# Cloudflare Migration and Deployment Guide

This guide describes how to deploy the **WeatherApp** frontend to **Cloudflare Pages** and the backend API to a **Cloudflare Worker** using the terminal.

---

## Prerequisites
Ensure you have Node.js and `npm` installed on your machine. You will use `wrangler`, the Cloudflare Developer Platform CLI, to configure and deploy.

---

## Step 1: Log in to Cloudflare from Terminal

First, open your terminal, navigate to your project directory, and authenticate your local wrangler CLI with your Cloudflare account:

```bash
npx wrangler login
```
*This command will open a browser window asking you to authorize Wrangler to access your Cloudflare account.*

---

## Step 2: Create a Cloudflare KV Namespace

The Cloudflare Worker uses KV (Key-Value) storage to cache the weather data. Create a new KV namespace using wrangler:

```bash
npx wrangler kv namespace create WEATHER_KV
```

### Output Example:
The command will print output similar to this:
```text
🌀 Creating namespace with title "weather-worker-WEATHER_KV"
✨ Success! Created KV Namespace weather-worker-WEATHER_KV
✨ Add the following to your wrangler.toml file:
[[kv_namespaces]]
binding = "WEATHER_KV"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### Apply to Config:
Open [worker/wrangler.toml](/worker/wrangler.toml) and update the `id` and `preview_id` with your generated namespace ID:

```toml
[[kv_namespaces]]
binding = "WEATHER_KV"
id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"  # <-- Paste your ID here
preview_id = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" # <-- Paste your ID here
```

---

## Step 3: Configure Your Upstream WEATHER_API_KEY (Strictly Secret)

To protect your **WeatherAPI.com** key and ensure it is **never** committed to public repositories (such as GitHub), upload it directly to Cloudflare's secure secrets vault.

Run the following command from the `worker` directory:

```bash
cd worker
npx wrangler secret put WEATHER_API_KEY
```

**Prompt:**
When prompted, paste your API Key from WeatherAPI.com (leave no spaces/newlines) and press Enter. This secret will be securely encrypted and available only to your Worker environment at runtime under `env.WEATHER_API_KEY`.

---

## Step 4: Deploy the Cloudflare Worker

From inside the `worker` directory, run the deployment command:

```bash
npx wrangler deploy
```

### Output Example:
```text
✨ Success! Deployed weather-worker
  https://weather-worker.yoursubdomain.workers.dev
```

### Note Your Worker URL:
Copy the deployed Worker URL (e.g. `https://weather-worker.yoursubdomain.workers.dev`). You will need it in the next step.

---

## Step 5: Configure Frontend endpoint

Open the weather controller source file [weather-controller.js](./page/src/weather-controller.js) and configure the API endpoint to point to your new Worker:

```javascript
// Cloudflare Worker API endpoint
const API_ENDPOINT = 'https://weather-worker.yoursubdomain.workers.dev/api/weather';
```

*(Alternatively: if you intend to map the Worker to `/api/weather` under the same custom domain as your Pages project later in Cloudflare, you can leave it as relative `/api/weather`).*

---

## Step 6: Deploy the Frontend to Cloudflare Pages

First, navigate to the `page` directory, install dependencies, and build the project:

```bash
cd page
npm install
npm run build
```

Then, deploy your compiled static assets (located in `dist/`) to Cloudflare Pages:

```bash
npx wrangler pages deploy dist --project-name=josh-weather-app
```

*This command will bundle and upload your static assets to Cloudflare Pages. It will print a URL where your app is hosted (e.g., `https://josh-weather-app.pages.dev`).*

---

## Step 7 (Highly Recommended): Protect Your Cloudflare Worker from Bot Abuse
To prevent bots/crawlers from spamming your API, set up Cloudflare WAF Rate Limiting:
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Navigate to **Websites** -> click on your domain -> **Security** -> **WAF** -> **Rate limiting rules**.
3. Click **Create rate limiting rule**.
4. Set rule details:
   - **Rule name**: `Rate Limit Weather API`
   - **If incoming requests match**:
     - *Field*: `URI Path`
     - *Operator*: `equals` (or `starts with`)
     - *Value*: `/api/weather`
   - **Then...**:
     - *Choose action*: `Block` (or `JS Challenge`)
     - *With rate*: `10` requests per `1 Minute` (adjust as needed).
5. Click **Deploy**.

This blocks spamming IP addresses at the Cloudflare edge network, saving your Worker execution quota.
