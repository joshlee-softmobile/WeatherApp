const LOCATIONS = [
  {"name":"台北北投","lat":"25.1167","lon":"121.5167"},
  {"name":"新北汐止","lat":"25.0667","lon":"121.6333"},
  {"name":"嘉義太保","lat":"23.4667","lon":"120.3333"},
  {"name":"台北中山","lat":"25.0667","lon":"121.5333"},
  {"name":"台北南港","lat":"25.0500","lon":"121.6000"},
  {"name":"新北三重","lat":"25.0667","lon":"121.4667"},
  {"name":"桃園蘆竹","lat":"25.0500","lon":"121.3000"}
];

// Helper to fetch weather data from upstream api for all locations in parallel
async function fetchWeatherData(apiKey) {
  const promises = LOCATIONS.map(async (loc) => {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${loc.lat},${loc.lon}&days=1&aqi=yes&lang=zh`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch weather for ${loc.name}: ${res.statusText}`);
    }
    const data = await res.json();
    return { name: loc.name, data };
  });
  return Promise.all(promises);
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Ensure we are handling the /api/weather route
    if (url.pathname !== "/api/weather") {
      return new Response("Not Found", { status: 404 });
    }

    // Validate API Key secret configuration
    const apiKey = env.WEATHER_API_KEY;
    console.log(`[Worker] Handling ${request.method} request for ${url.pathname}`);
    console.log(`[Worker] WEATHER_API_KEY configured: ${!!apiKey}`);

    if (!apiKey) {
      console.log(`[Worker] Error: WEATHER_API_KEY is not configured!`);
      return new Response(
        JSON.stringify({
          error: "WEATHER_API_KEY is not configured on the Worker. Please set it using 'npx wrangler secret put WEATHER_API_KEY'."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    const kv = env.WEATHER_APP_KV;
    console.log(`[Worker] KV Namespace bound: ${!!kv}`);

    // --- GET Endpoint: Return cached data from KV (or live if empty) ---
    if (request.method === "GET") {
      let cachedData = null;
      if (kv) {
        console.log(`[Worker] Checking KV cache for "weather_data"...`);
        cachedData = await kv.get("weather_data");
      }

      if (cachedData) {
        console.log(`[Worker] Cache hit! Returning cached weather data.`);
        return new Response(cachedData, {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      console.log(`[Worker] Cache miss or KV not configured. Performing live fetch from WeatherAPI...`);
      // If KV cache is empty (e.g. first deploy), perform a live fetch
      try {
        console.log(`[Worker] Fetching live weather data for ${LOCATIONS.length} locations...`);
        const freshData = await fetchWeatherData(apiKey);
        console.log(`[Worker] Live fetch complete!`);
        const body = JSON.stringify(freshData);
        if (kv) {
          console.log(`[Worker] Caching fresh data to KV...`);
          // cache it asynchronously
          ctx.waitUntil(
            Promise.all([
              kv.put("weather_data", body),
              kv.put("last_update_time", Date.now().toString())
            ])
          );
        }
        return new Response(body, {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error(`[Worker] Live fetch error:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    // --- POST Endpoint: Force live refresh (with cooldown protection) ---
    if (request.method === "POST") {
      if (!kv) {
        console.log(`[Worker] Error: KV Namespace binding is not set up during POST.`);
        return new Response(
          JSON.stringify({ error: "KV Namespace binding is not set up." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
      }

      // Cooldown implementation: 5 minutes (300,000 milliseconds)
      const COOLDOWN_MS = 5 * 60 * 1000;
      console.log(`[Worker] Checking cooldown...`);
      const lastUpdateStr = await kv.get("last_update_time");
      const now = Date.now();

      if (lastUpdateStr) {
        const lastUpdate = parseInt(lastUpdateStr, 10);
        if (now - lastUpdate < COOLDOWN_MS) {
          console.log(`[Worker] Cooldown active. Returning cached weather data.`);
          // Cooldown active: Return cached data instead of executing a new fetch (good UX)
          const cachedData = await kv.get("weather_data");
          if (cachedData) {
            return new Response(cachedData, {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
                "X-Weather-Cached": "true"
              }
            });
          }
        }
      }

      // Fetch fresh data and write to KV
      try {
        console.log(`[Worker] Cooldown expired. Fetching fresh live weather data...`);
        const freshData = await fetchWeatherData(apiKey);
        const body = JSON.stringify(freshData);
        await kv.put("weather_data", body);
        await kv.put("last_update_time", now.toString());
        console.log(`[Worker] Fresh data cached. Returning response.`);

        return new Response(body, {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (error) {
        console.error(`[Worker] Live refresh error during POST:`, error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  },

  // --- Cron Trigger Handler ---
  async scheduled(event, env, ctx) {
    const apiKey = env.WEATHER_API_KEY;
    if (!apiKey) {
      console.error("WEATHER_API_KEY is not configured.");
      return;
    }
    const kv = env.WEATHER_APP_KV;
    if (!kv) {
      console.error("WEATHER_APP_KV namespace is not bound.");
      return;
    }

    try {
      const freshData = await fetchWeatherData(apiKey);
      await kv.put("weather_data", JSON.stringify(freshData));
      await kv.put("last_update_time", Date.now().toString());
      console.log("Weather data successfully updated via cron trigger.");
    } catch (error) {
      console.error("Failed to update weather data in cron job:", error);
    }
  }
};
