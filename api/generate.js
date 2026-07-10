// ─── RATE LIMITER ─────────────────────────────────────────────────────────────
// Tracks requests per IP in memory. Resets every 60 minutes.
// Max 20 requests per IP per hour — plenty for real users, stops abuse cold.
const rateLimitMap = new Map();
const RATE_LIMIT_MAX      = 20;   // max requests per window
const RATE_LIMIT_WINDOW   = 60 * 60 * 1000; // 1 hour in ms

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, windowStart: now };

  // Reset window if expired
  if (now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.windowStart = now;
  }

  entry.count += 1;
  rateLimitMap.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

// ─── ALLOWED ORIGINS ──────────────────────────────────────────────────────────
// Matched by hostname (not exact string) so www/non-www variants and Vercel
// preview-deployment URLs for this project both work without maintaining
// an exact list of every possible URL.
const ALLOWED_HOSTNAMES = [
  "app.realestatesolutionshub.com",
  "www.app.realestatesolutionshub.com",
];

function isAllowedOrigin(origin) {
  if (!origin) return true; // no Origin header — let it through (e.g. some same-origin requests)
  let hostname;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }
  if (ALLOWED_HOSTNAMES.includes(hostname)) return true;
  // Any Vercel deployment of this project — production, preview, or branch URLs
  if (hostname.startsWith("agent-content-creator") && hostname.endsWith(".vercel.app")) return true;
  return false;
}

// ─── REQUEST VALIDATOR ────────────────────────────────────────────────────────
function isValidRequest(body) {
  if (!body || typeof body !== "object")           return false;
  if (body.model !== "claude-sonnet-4-6")          return false;
  if (typeof body.max_tokens !== "number")         return false;
  if (body.max_tokens > 2000)                      return false;
  if (!Array.isArray(body.messages))               return false;
  if (body.messages.length === 0)                  return false;
  if (typeof body.system !== "string")             return false;
  if (body.system.length > 8000)                   return false;
  return true;
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // 1. Method check
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Origin check — only allow requests from your own domains
  const origin = req.headers.origin || "";
  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 3. Rate limit check
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests — please wait before trying again." });
  }

  // 4. Request validation — must look like a real TCRA request
  if (!isValidRequest(req.body)) {
    return res.status(400).json({ error: "Invalid request format." });
  }

  // 5. API key check
  const apiKey = process.env.a1b2c3999;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error — API key missing." });
  }

  // 6. Forward to Anthropic
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Proxy error — please try again." });
  }
}
