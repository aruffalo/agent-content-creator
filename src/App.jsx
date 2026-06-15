import { useState, useEffect } from "react";

// ─── BRAND TOKENS ─────────────────────────────────────────────────────────────
const B = {
  black:       "#FFFFFF",
  charcoal:    "#F8F9FA",
  card:        "#FFFFFF",
  border:      "rgba(0,0,0,0.08)",
  borderGold:  "rgba(26,26,26,0.18)",
  white:       "#1A1A1A",
  offWhite:    "#1A1A1A",
  warmGray:    "#3D3D3D",
  midGray:     "#888888",
  lightGray:   "#AAAAAA",
  gold:        "#2D2D2D",
  goldLight:   "#555555",
  goldDim:     "rgba(0,0,0,0.04)",
  goldDim2:    "rgba(0,0,0,0.09)",
  red:         "rgba(200,70,70,0.08)",
  redBorder:   "rgba(200,70,70,0.25)",
  redText:     "#C0392B",
  pageBg:      "#F4F5F7",
  accent:      "#1A1A1A",
  accentDim:   "rgba(26,26,26,0.07)",
  accentDim2:  "rgba(26,26,26,0.12)",
  teal:        "#0891B2",
  tealDim:     "rgba(8,145,178,0.08)",
  tealBorder:  "rgba(8,145,178,0.25)",
};

// ─── STORAGE (localStorage) ───────────────────────────────────────────────────
const PROFILE_KEY = "resh_agent_profile";
const HISTORY_KEY = "resh_content_history";
const MAX_HISTORY = 100;

function loadProfile() {
  try { const v = localStorage.getItem(PROFILE_KEY); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}
function loadHistory() {
  try { const v = localStorage.getItem(HISTORY_KEY); return v ? JSON.parse(v) : []; }
  catch { return []; }
}
function saveHistory(history) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const FORMAT_OPTIONS = [
  { id: "reel",     label: "Reel",     icon: "🎬", desc: "Hook · B-roll · Voiceover · Caption" },
  { id: "carousel", label: "Carousel", icon: "🖼️", desc: "5–7 slides with hooks, copy & CTA" },
  { id: "static",   label: "Static",   icon: "✦",  desc: "Single-image overlay — screenshot & post" },
];

const CONTENT_TYPES = [
  { id: "social",    label: "Social Post",  icon: "📱", desc: "Reel, Carousel, or Static for Instagram" },
  { id: "pinterest", label: "Pinterest Pin", icon: "📌", desc: "Evergreen, search-optimized pin" },
];

const PILLAR_OPTIONS = [
  { id: "neighborhood", label: "Neighborhood",    icon: "🏘️" },
  { id: "buyer",        label: "Buyer Education",  icon: "🔑" },
  { id: "seller",       label: "Seller Truth",     icon: "📈" },
  { id: "market",       label: "Market Intel",     icon: "📊" },
  { id: "lifestyle",    label: "Local Life",       icon: "☀️" },
  { id: "trust",        label: "Agent POV",        icon: "💬" },
];

const VOICE_TAGS = [
  "warm & approachable", "no-nonsense", "educational", "peer-authority",
  "luxury lifestyle", "first-time buyer focused", "relatable", "data-driven",
  "conversational", "bold & direct", "storyteller", "community-first",
];

// ─── API ──────────────────────────────────────────────────────────────────────
async function generateContent({ topic, format, pillar, profile }) {
  const formatInstructions = {
    reel: `Return a JSON object with:
- hook (string): punchy verbal/text hook under 10 words
- onscreen (array of 2-3 strings): bold text overlays shown on screen
- broll (array of 3-5 strings): specific B-roll shot descriptions for their market, short and actionable
- voiceover (string): 40-60 word casual voiceover script in their voice
- caption (string): full Instagram caption 60-100 words, ends with keyword CTA like 'Comment X for Y'`,
    carousel: `Return a JSON object with:
- hook (string): slide 1 hook under 10 words
- slides (array of 5-7 objects), each with: label (string), headline (string), body (string, 1-2 sentences)
- cta_slide (object with headline and body strings)
- caption (string): Instagram caption 60-100 words`,
    static: `Return a JSON object with:
- hook (string): single punchy headline under 10 words
- onscreen (array of 2-3 strings): text overlay lines for the graphic
- subtext (string): 1 short supporting line in smaller text
- caption (string): Instagram caption 50-80 words with CTA`,
    pinterest: `Return a JSON object with:
- pin_title (string): search-optimized pin title under 100 characters, front-load keywords (location, topic, buyer/seller intent)
- onscreen (array of 2-3 strings): text overlay lines for a tall vertical pin graphic (1000x1500)
- description (string): 150-300 character pin description packed with searchable keywords — neighborhood names, city, price ranges, buyer/seller search phrases. Written naturally, not keyword-stuffed.
- board_suggestion (string): a Pinterest board name this pin would fit on, e.g. "[City] Neighborhood Guides" or "First-Time Buyer Tips"`,
  };

  const voiceDesc       = profile.voiceTags?.length   ? `Voice descriptors: ${profile.voiceTags.join(", ")}.` : "";
  const sampleCaptions  = profile.sampleCaptions?.trim() ? `Here are sample captions in their voice for reference:\n${profile.sampleCaptions}` : "";
  const neighborhoods   = profile.neighborhoods?.trim() ? `Key neighborhoods/areas they cover: ${profile.neighborhoods}.` : "";
  const niche           = profile.niche?.trim()          ? `Their niche/specialty: ${profile.niche}.` : "";

  const systemPrompt = `You are a real estate content strategist writing social media content for a real estate agent. Write in their voice as if you ARE them — not describing them.

AGENT PROFILE:
Name: ${profile.name || "the agent"}
Brokerage: ${profile.brokerage || ""}
Market: ${profile.market || "their local market"}
${neighborhoods}
${niche}
${voiceDesc}
${sampleCaptions}

Content pillar: ${pillar}
Format: ${format}

${formatInstructions[format]}

CRITICAL: Return ONLY valid JSON. No markdown, no backticks, no preamble. Pure JSON object only.
Write all content as if the agent is speaking directly — use "I", "my", "we" naturally.
Reference their specific market, neighborhoods, and price ranges where relevant.${format === "pinterest" ? "\nThis content is for Pinterest — write for evergreen, search-driven discovery rather than a timely social feed. Prioritize clear, descriptive, keyword-natural language over punchy social hooks." : ""}`;

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing API key — check your Vercel environment variables.");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: `Topic: ${topic}` }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();

  // Collect all text blocks
  const text = (data.content || [])
    .filter(b => b.type === "text")
    .map(b => b.text || "")
    .join("");

  if (!text) throw new Error("Empty response — please try again.");

  // Strip markdown fences if present
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last  = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1) throw new Error("Could not parse content — please try again.");

  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    throw new Error("Content formatting error — please try again.");
  }
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "11px 13px",
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 8, fontSize: 13, color: B.white,
  outline: "none", fontFamily: "sans-serif",
  boxSizing: "border-box",
};

const navBtnStyle = {
  padding: "6px 12px", borderRadius: 7, fontSize: 10, fontWeight: 700,
  border: "1px solid rgba(0,0,0,0.1)", background: "#FFFFFF",
  color: "#888888", cursor: "pointer", letterSpacing: "0.06em",
  fontFamily: "sans-serif",
};

function GoldLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
      color: "#555555", textTransform: "uppercase", marginBottom: 8,
      fontFamily: "sans-serif", ...style,
    }}>{children}</div>
  );
}

function Block({ children, style = {} }) {
  return (
    <div style={{
      background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 10, padding: "13px 15px",
      fontSize: 13, color: "#1A1A1A", lineHeight: 1.75,
      fontFamily: "sans-serif", ...style,
    }}>{children}</div>
  );
}

function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => {
      navigator.clipboard?.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }} style={{
      padding: "4px 11px", borderRadius: 6, fontSize: 10,
      border: `1px solid ${done ? B.gold : "rgba(255,255,255,0.12)"}`,
      background: done ? B.goldDim : "transparent",
      color: done ? B.gold : B.midGray,
      cursor: "pointer", fontWeight: 700, fontFamily: "sans-serif",
      transition: "all 0.2s",
    }}>{done ? "✓ Copied" : "Copy"}</button>
  );
}

function Tag({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      border: `1px solid ${active ? B.gold : "rgba(255,255,255,0.1)"}`,
      background: active ? B.goldDim2 : "transparent",
      color: active ? B.gold : B.midGray,
      cursor: "pointer", letterSpacing: "0.03em", fontFamily: "sans-serif",
      transition: "all 0.15s",
    }}>{children}</button>
  );
}

function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "18px 22px 16px" }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: "transparent", border: "none", color: "#888888",
          fontSize: 11, fontWeight: 700, cursor: "pointer",
          letterSpacing: "0.07em", fontFamily: "sans-serif",
          marginBottom: 10, padding: 0, display: "block",
        }}>← BACK</button>
      )}
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1A1A1A" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 12, color: "#888888", margin: "3px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

// ─── CANVA HELPER ─────────────────────────────────────────────────────────────
const CANVA_FONTS = {
  "warm & approachable":      { heading: "Playfair Display", body: "Lato" },
  "no-nonsense":              { heading: "Montserrat", body: "Open Sans" },
  "educational":              { heading: "Merriweather", body: "Source Sans Pro" },
  "peer-authority":           { heading: "Cormorant Garamond", body: "Raleway" },
  "luxury lifestyle":         { heading: "Cormorant Garamond", body: "Raleway" },
  "first-time buyer focused": { heading: "Nunito", body: "Lato" },
  "relatable":                { heading: "Nunito", body: "Open Sans" },
  "data-driven":              { heading: "Montserrat", body: "Roboto" },
  "conversational":           { heading: "Poppins", body: "Lato" },
  "bold & direct":            { heading: "Oswald", body: "Open Sans" },
  "storyteller":              { heading: "Playfair Display", body: "Georgia" },
  "community-first":          { heading: "Nunito", body: "Lato" },
};

const CANVA_URLS = {
  reel:      "https://www.canva.com/design/DANew/new?type=MobileVideo&ratio=9:16",
  carousel:  "https://www.canva.com/design/DANew/new?type=Presentation",
  static:    "https://www.canva.com/design/DANew/new?type=SocialMedia",
  pinterest: "https://www.canva.com/design/DANew/new?type=Pin",
};

const CANVA_SEARCHES = {
  reel:      "real estate reel 9x16",
  carousel:  "real estate carousel instagram",
  static:    "real estate instagram post",
  pinterest: "real estate pinterest pin",
};

function CanvaSection({ format, data, profile }) {
  const [open, setOpen] = useState(false);
  const voiceTag = (profile?.voiceTags || [])[0] || "warm & approachable";
  const fonts = CANVA_FONTS[voiceTag] || { heading: "Playfair Display", body: "Lato" };

  // Build copy text per format
  let copyText = "";
  if (format === "reel") {
    copyText = [
      `HOOK:\n"${data.hook}"`,
      `ON-SCREEN TEXT:\n${(data.onscreen || []).map((l, i) => `${i + 1}. ${l}`).join("\n")}`,
      `VOICEOVER:\n${data.voiceover}`,
      `CAPTION:\n${data.caption}`,
    ].join("\n\n");
  } else if (format === "carousel") {
    const allSlides = [...(data.slides || []), ...(data.cta_slide ? [{ label: "CTA", headline: data.cta_slide.headline, body: data.cta_slide.body }] : [])];
    copyText = [
      `COVER HOOK:\n"${data.hook}"`,
      ...allSlides.map((s, i) => `SLIDE ${i + 1} — ${s.label}\nHeadline: ${s.headline}\nBody: ${s.body}`),
      `CAPTION:\n${data.caption}`,
    ].join("\n\n");
  } else if (format === "static") {
    copyText = [
      `HEADLINE (large text):\n${data.onscreen?.[0] || ""}`,
      `SUPPORTING LINE:\n${data.onscreen?.[1] || ""}`,
      `SUBTEXT (small):\n${data.subtext || ""}`,
      `CAPTION:\n${data.caption}`,
    ].join("\n\n");
  } else if (format === "pinterest") {
    copyText = [
      `PIN TITLE:\n${data.pin_title || ""}`,
      `ON-SCREEN TEXT:\n${(data.onscreen || []).map((l, i) => `${i + 1}. ${l}`).join("\n")}`,
      `PIN DESCRIPTION:\n${data.description || ""}`,
      `SUGGESTED BOARD:\n${data.board_suggestion || ""}`,
    ].join("\n\n");
  }

  return (
    <div style={{
      background: "#FFFFFF",
      border: `1px solid ${open ? B.tealBorder : "rgba(8,145,178,0.15)"}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      borderRadius: 12, overflow: "hidden",
      marginTop: 4, transition: "border-color 0.2s",
    }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", padding: "14px 16px",
        background: "transparent", border: "none",
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer", textAlign: "left",
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: "linear-gradient(135deg, #0891B2, #0E7490)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0891B2", fontFamily: "sans-serif", letterSpacing: "0.05em" }}>
            DESIGN IN CANVA
          </div>
          <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", marginTop: 1 }}>
            Canva-ready text, templates & design tips
          </div>
        </div>
        <span style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Step 1 — Open Canva */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C4CC", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>
              STEP 1 — OPEN YOUR CANVAS
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={CANVA_URLS[format]} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: "10px 14px", borderRadius: 8, textAlign: "center",
                background: "rgba(8,145,178,0.07)",
                border: "1px solid rgba(8,145,178,0.25)",
                color: "#0891B2", fontSize: 11, fontWeight: 700,
                textDecoration: "none", fontFamily: "sans-serif",
                letterSpacing: "0.06em", display: "block",
              }}>
                {format === "reel" ? "📱 Open 1080×1920 Blank" : format === "pinterest" ? "📌 Open 1000×1500 Pin" : "🖼️ Open 1080×1080 Blank"}
              </a>
              <a href={`https://www.canva.com/search/templates?q=${encodeURIComponent(CANVA_SEARCHES[format])}`}
                target="_blank" rel="noopener noreferrer" style={{
                  flex: 1, padding: "10px 14px", borderRadius: 8, textAlign: "center",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: B.lightGray, fontSize: 11, fontWeight: 700,
                  textDecoration: "none", fontFamily: "sans-serif",
                  letterSpacing: "0.06em", display: "block",
                }}>
                🔍 Browse Templates
              </a>
            </div>
          </div>

          {/* Step 2 — Copy All Text */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C4CC", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>
              STEP 2 — COPY YOUR TEXT
            </div>
            <div style={{
              background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8, padding: "12px 14px",
              fontSize: 11, color: B.warmGray, lineHeight: 1.8,
              fontFamily: "monospace", whiteSpace: "pre-wrap",
              maxHeight: 180, overflowY: "auto",
            }}>{copyText}</div>
            <CopyBtn text={copyText} />
          </div>

          {/* Step 3 — Font Pairing */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C4CC", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>
              STEP 3 — FONT PAIRING FOR YOUR VOICE
            </div>
            <div style={{
              background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 8, padding: "12px 14px",
              display: "flex", gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "sans-serif" }}>HEADING</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", fontFamily: "sans-serif" }}>{fonts.heading}</div>
              </div>
              <div style={{ width: 1, background: B.border }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "sans-serif" }}>BODY</div>
                <div style={{ fontSize: 13, color: B.warmGray, fontFamily: "sans-serif" }}>{fonts.body}</div>
              </div>
            </div>
            <p style={{ fontSize: 10, color: "#888888", margin: "6px 0 0", fontFamily: "sans-serif", lineHeight: 1.5 }}>
              Search these in Canva's font selector — both are free on all plans.
            </p>
          </div>

          {/* Step 4 — Design Tips */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#00C4CC", letterSpacing: "0.1em", marginBottom: 8, fontFamily: "sans-serif" }}>
              STEP 4 — QUICK DESIGN TIPS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(format === "reel" ? [
                "Place your hook text in the top third of the frame — that's the first thing viewers see",
                "Use a semi-transparent dark overlay behind text so it reads over any B-roll footage",
                "Keep on-screen text to one line per frame — don't show all at once",
                "Add your name/handle in the bottom corner on every slide",
              ] : format === "carousel" ? [
                "Slide 1 is your scroll-stopper — make the hook text as large as it can go",
                "Keep each slide to ONE headline + 2-3 lines max — white space is your friend",
                "Use the same background color or texture across all slides for brand consistency",
                "End card (CTA slide) should have your headshot + contact info",
              ] : format === "pinterest" ? [
                "Use a tall vertical layout (2:3 ratio) — Pinterest favors this aspect ratio in feeds",
                "Put your boldest text in the top half — that's what shows in grid view before someone clicks",
                "Add your logo or name small in a bottom corner — pins get saved and re-shared widely",
                "Use bright, high-contrast colors — Pinterest is a visually competitive, scroll-heavy feed",
              ] : [
                "Your headline should be the largest element — at least 50% of the visual weight",
                "Add your headshot in a corner circle for brand recognition",
                "Use a solid or gradient background so text pops — avoid busy photo backgrounds",
                "Include your handle and market name in small text at the bottom",
              ]).map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 9 }}>
                  <span style={{ color: "#0891B2", fontSize: 11, flexShrink: 0, paddingTop: 2, fontFamily: "sans-serif" }}>✦</span>
                  <span style={{ fontSize: 11, color: "#888888", lineHeight: 1.6, fontFamily: "sans-serif" }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// ─── RESULT RENDERERS ─────────────────────────────────────────────────────────
function ReelResult({ data, profile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <GoldLabel>🎯 Hook</GoldLabel>
        <div style={{
          background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 10, padding: "14px 18px",
          fontSize: 17, fontWeight: 700,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          color: "#1A1A1A", lineHeight: 1.35,
        }}>"{data.hook}"</div>
      </div>
      <div>
        <GoldLabel>📝 On-Screen Text</GoldLabel>
        {(data.onscreen || []).map((line, i) => (
          <div key={i} style={{
            background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 6,
            fontSize: 13, fontWeight: 700, color: "#1A1A1A",
            fontFamily: "Georgia, serif",
          }}>{line}</div>
        ))}
      </div>
      <div>
        <GoldLabel>🎬 B-Roll Shot List</GoldLabel>
        {(data.broll || []).map((shot, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            <span style={{ color: "#2D2D2D", fontSize: 12, fontWeight: 700, minWidth: 18, fontFamily: "sans-serif", paddingTop: 2 }}>{i + 1}.</span>
            <span style={{ fontSize: 13, color: B.offWhite, lineHeight: 1.6, fontFamily: "sans-serif" }}>{shot}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <GoldLabel style={{ marginBottom: 0 }}>🎙️ Voiceover Script</GoldLabel>
          <CopyBtn text={data.voiceover} />
        </div>
        <Block style={{ fontStyle: "italic", borderLeft: "3px solid #DDDDDD" }}>{data.voiceover}</Block>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <GoldLabel style={{ marginBottom: 0 }}>✍️ Caption</GoldLabel>
          <CopyBtn text={data.caption} />
        </div>
        <Block>{data.caption}</Block>
      </div>
      <CanvaSection format="reel" data={data} profile={profile} />
    </div>
  );
}

function CarouselResult({ data }) {
  const [active, setActive] = useState(0);
  const allSlides = [
    ...(data.slides || []),
    ...(data.cta_slide ? [{ label: "CTA", headline: data.cta_slide.headline, body: data.cta_slide.body }] : []),
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <GoldLabel>🎯 Cover Hook</GoldLabel>
        <div style={{
          background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 10, padding: "14px 18px",
          fontSize: 17, fontWeight: 700,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          color: "#1A1A1A", lineHeight: 1.35,
        }}>"{data.hook}"</div>
      </div>
      <div>
        <GoldLabel>🖼️ Slides</GoldLabel>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {allSlides.map((s, i) => (
            <button key={i} onClick={() => setActive(i)} style={{
              padding: "4px 11px", borderRadius: 6, fontSize: 10, fontWeight: 700,
              border: `1px solid ${active === i ? B.gold : "rgba(255,255,255,0.1)"}`,
              background: active === i ? B.goldDim2 : "transparent",
              color: active === i ? B.gold : B.midGray,
              cursor: "pointer", fontFamily: "sans-serif",
            }}>{s.label || `Slide ${i + 1}`}</button>
          ))}
        </div>
        {allSlides[active] && (
          <div style={{
            background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 12, padding: "20px",
            borderLeft: "3px solid #1A1A1A",
          }}>
            <div style={{ fontSize: 10, color: "#888888", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10, fontFamily: "sans-serif" }}>{allSlides[active].label}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.35, marginBottom: 10, fontFamily: "Georgia, serif", fontStyle: "italic" }}>{allSlides[active].headline}</div>
            <div style={{ fontSize: 13, color: B.warmGray, lineHeight: 1.7, fontFamily: "sans-serif" }}>{allSlides[active].body}</div>
          </div>
        )}
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <GoldLabel style={{ marginBottom: 0 }}>✍️ Caption</GoldLabel>
          <CopyBtn text={data.caption} />
        </div>
        <Block>{data.caption}</Block>
      </div>
      <CanvaSection format="carousel" data={data} profile={{}} />
    </div>
  );
}

function StaticResult({ data, profile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <GoldLabel>👁️ Post Preview</GoldLabel>
        <div style={{
          aspectRatio: "1/1", maxHeight: 280,
          background: "#1A1A1A",
          border: `1px solid ${B.border}`,
          borderRadius: 12,
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          padding: 32, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: 80, background: B.gold }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 3, background: B.gold }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 3, height: 80, background: `${B.gold}44` }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 80, height: 3, background: `${B.gold}44` }} />
          {(data.onscreen || []).map((line, i) => (
            <div key={i} style={{
              fontSize: i === 0 ? 18 : 13,
              fontWeight: i === 0 ? 700 : 400,
              color: i === 0 ? B.white : B.warmGray,
              fontFamily: i === 0 ? "Georgia, serif" : "sans-serif",
              fontStyle: i === 0 ? "italic" : "normal",
              textAlign: "center", marginBottom: 10, lineHeight: 1.3,
            }}>{line}</div>
          ))}
          {data.subtext && (
            <div style={{ fontSize: 11, color: "#888888", textAlign: "center", fontFamily: "sans-serif", marginTop: 4 }}>{data.subtext}</div>
          )}
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 18px" }}>
            <span style={{ fontSize: 9, color: "#2D2D2D", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
              {profile?.name || "YOUR NAME"}
            </span>
            <span style={{ fontSize: 9, color: "#888888", fontFamily: "sans-serif" }}>{profile?.market || ""}</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <GoldLabel style={{ marginBottom: 0 }}>✍️ Caption</GoldLabel>
          <CopyBtn text={data.caption} />
        </div>
        <Block>{data.caption}</Block>
      </div>
      <CanvaSection format="static" data={data} profile={profile} />
    </div>
  );
}

function PinterestResult({ data, profile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <GoldLabel>📌 Pin Title</GoldLabel>
        <div style={{
          background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 10, padding: "14px 18px",
          fontSize: 17, fontWeight: 700,
          fontFamily: "Georgia, serif", fontStyle: "italic",
          color: "#1A1A1A", lineHeight: 1.35,
        }}>{data.pin_title}</div>
      </div>
      <div>
        <GoldLabel>👁️ Pin Preview</GoldLabel>
        <div style={{
          aspectRatio: "2/3", maxHeight: 340,
          background: "#1A1A1A",
          border: `1px solid ${B.border}`,
          borderRadius: 12,
          display: "flex", flexDirection: "column",
          justifyContent: "center", alignItems: "center",
          padding: 32, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: 80, background: "#0891B2" }} />
          <div style={{ position: "absolute", top: 0, left: 0, width: 80, height: 3, background: "#0891B2" }} />
          {(data.onscreen || []).map((line, i) => (
            <div key={i} style={{
              fontSize: i === 0 ? 19 : 14,
              fontWeight: i === 0 ? 700 : 400,
              color: i === 0 ? B.white : B.warmGray,
              fontFamily: i === 0 ? "Georgia, serif" : "sans-serif",
              fontStyle: i === 0 ? "italic" : "normal",
              textAlign: "center", marginBottom: 12, lineHeight: 1.3,
            }}>{line}</div>
          ))}
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 18px" }}>
            <span style={{ fontSize: 9, color: "#0891B2", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>
              {profile?.name || "YOUR NAME"}
            </span>
            <span style={{ fontSize: 9, color: "#888888", fontFamily: "sans-serif" }}>{profile?.market || ""}</span>
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <GoldLabel style={{ marginBottom: 0 }}>📝 Pin Description</GoldLabel>
          <CopyBtn text={data.description} />
        </div>
        <Block>{data.description}</Block>
      </div>
      <div>
        <GoldLabel>🗂️ Suggested Board</GoldLabel>
        <Block style={{ borderLeft: "3px solid #0891B2", fontWeight: 600 }}>{data.board_suggestion}</Block>
      </div>
      <CanvaSection format="pinterest" data={data} profile={profile} />
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingScreen({ onComplete, existing }) {
  const [form, setForm] = useState(existing || {
    name: "", brokerage: "", market: "",
    neighborhoods: "", niche: "",
    voiceTags: [], sampleCaptions: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleTag = (tag) => {
    const cur = form.voiceTags || [];
    set("voiceTags", cur.includes(tag) ? cur.filter(t => t !== tag) : [...cur, tag]);
  };
  const canSave = form.name.trim() && form.market.trim() && agreed;

  return (
    <div style={{ minHeight: "100vh", background: B.pageBg, color: "#1A1A1A", fontFamily: "sans-serif" }}>
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "20px 22px 18px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1A1A1A" }}>
          {existing ? "Edit Your Profile" : "Set Up Your Profile"}
        </h1>
        <p style={{ fontSize: 12, color: "#888888", margin: "4px 0 0", lineHeight: 1.5 }}>
          {existing
            ? "Update your details — all future content will reflect the changes."
            : "Fill this out once and every piece of content will be written in your voice, for your market."}
        </p>
      </div>

      <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 22, maxWidth: 600 }}>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <GoldLabel>Your Name *</GoldLabel>
            <input value={form.name} onChange={e => set("name", e.target.value)}
              placeholder="e.g. Sarah Martinez" style={inputStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <GoldLabel>Brokerage</GoldLabel>
            <input value={form.brokerage} onChange={e => set("brokerage", e.target.value)}
              placeholder="e.g. Keller Williams" style={inputStyle} />
          </div>
        </div>

        <div>
          <GoldLabel>Your Market / City *</GoldLabel>
          <input value={form.market} onChange={e => set("market", e.target.value)}
            placeholder="e.g. Scottsdale, AZ · Greater Phoenix · Austin, TX" style={inputStyle} />
        </div>

        <div>
          <GoldLabel>Neighborhoods & Areas You Specialize In</GoldLabel>
          <input value={form.neighborhoods} onChange={e => set("neighborhoods", e.target.value)}
            placeholder="e.g. Old Town, Arcadia, Paradise Valley, North Scottsdale" style={inputStyle} />
          <p style={{ fontSize: 11, color: "#888888", margin: "5px 0 0" }}>The AI will reference these naturally in your content.</p>
        </div>

        <div>
          <GoldLabel>Who You Serve / Your Niche</GoldLabel>
          <input value={form.niche} onChange={e => set("niche", e.target.value)}
            placeholder="e.g. First-time buyers, move-up families, $500K–$1.2M range, relocations" style={inputStyle} />
        </div>

        <div>
          <GoldLabel>Your Voice — Pick Up To 4</GoldLabel>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {VOICE_TAGS.map(tag => (
              <Tag key={tag}
                active={(form.voiceTags || []).includes(tag)}
                onClick={() => (form.voiceTags || []).length < 4 || (form.voiceTags || []).includes(tag) ? toggleTag(tag) : null}>
                {tag}
              </Tag>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#888888", margin: "6px 0 0" }}>Selected: {(form.voiceTags || []).length}/4</p>
        </div>

        <div>
          <GoldLabel>Sample Captions You Love (Optional)</GoldLabel>
          <textarea value={form.sampleCaptions}
            onChange={e => set("sampleCaptions", e.target.value)}
            placeholder="Paste 1–2 captions you've written that really sound like you. The AI will match this energy."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }} />
        </div>

        {/* Disclosure */}
        <div style={{
          background: "#FFFFFF",
          border: `1px solid ${agreed ? B.borderGold : "rgba(255,255,255,0.1)"}`,
          borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s",
        }}>
          <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.offWhite, fontFamily: "sans-serif", marginBottom: 3, letterSpacing: "0.03em" }}>
                🔒 Data & Privacy Disclosure
              </div>
              <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", lineHeight: 1.55 }}>
                Please read before saving your profile.
              </div>
            </div>
            <button onClick={() => setDisclosureOpen(o => !o)} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700,
              color: "#888888", cursor: "pointer", fontFamily: "sans-serif",
              letterSpacing: "0.05em", whiteSpace: "nowrap", flexShrink: 0,
            }}>{disclosureOpen ? "HIDE ▲" : "READ ▼"}</button>
          </div>

          {disclosureOpen && (
            <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: "16px 16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: "📤",
                  title: "Your profile data is sent to Anthropic's API",
                  body: "When you generate content, the information you enter here — your name, market, niche, voice descriptors, and any sample captions — is included in the request sent to Claude (Anthropic's AI). This is what makes the content sound like you. Anthropic's privacy policy governs how that data is handled on their end.",
                },
                {
                  icon: "💾",
                  title: "Your history is stored locally in this tool",
                  body: "Your generated content history is saved in your browser's local storage on your device. It is not shared with third parties. You can clear your history at any time from your browser settings.",
                },
                {
                  icon: "🚫",
                  title: "Do not enter client or transaction data",
                  body: "This tool is designed for your personal brand content only. Please do not enter client names, property addresses, financial details, or any confidential transaction information into any field.",
                },
                {
                  icon: "📋",
                  title: "Content is your responsibility",
                  body: "All AI-generated content is a starting point, not a finished product. You are responsible for reviewing, editing, and ensuring any content you publish complies with your brokerage's policies, NAR guidelines, and applicable advertising laws in your state.",
                },
                {
                  icon: "✉️",
                  title: "Questions?",
                  body: "Reach out at realestatesolutionshub.com with any privacy questions or data deletion requests.",
                },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 11 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, paddingTop: 1 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", fontFamily: "sans-serif", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", lineHeight: 1.65 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "13px 16px",
            display: "flex", alignItems: "flex-start", gap: 11,
            background: agreed ? "rgba(26,26,26,0.04)" : "transparent",
            transition: "background 0.2s",
          }}>
            <div onClick={() => setAgreed(a => !a)} style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${agreed ? "#1A1A1A" : "rgba(0,0,0,0.2)"}`,
              background: agreed ? "#1A1A1A" : "transparent",
              cursor: "pointer", marginTop: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {agreed && <span style={{ fontSize: 11, color: "#FFFFFF", fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <label onClick={() => setAgreed(a => !a)} style={{
              fontSize: 12, color: agreed ? B.warmGray : B.midGray,
              fontFamily: "sans-serif", lineHeight: 1.6, cursor: "pointer", transition: "color 0.2s",
            }}>
              I understand that my profile information will be processed by Anthropic's API to generate content, and I agree not to enter client or confidential transaction data into this tool.
            </label>
          </div>
        </div>

        <button onClick={() => canSave && onComplete(form)} disabled={!canSave} style={{
          padding: "14px", borderRadius: 10,
          background: canSave ? "#1A1A1A" : "#E5E7EB",
          color: canSave ? "#FFFFFF" : "#AAAAAA",
          border: "none", fontSize: 12, fontWeight: 800,
          cursor: canSave ? "pointer" : "not-allowed",
          letterSpacing: "0.1em", fontFamily: "sans-serif",
          transition: "all 0.2s",
        }}>
          {existing ? "SAVE CHANGES ✦" : "SAVE & START CREATING ✦"}
        </button>

        {existing && (
          <button onClick={() => onComplete(null)} style={{
            padding: "10px", borderRadius: 10, background: "transparent",
            border: "1px solid rgba(0,0,0,0.1)", color: "#888888",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.06em", fontFamily: "sans-serif",
          }}>← CANCEL</button>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY SCREEN ───────────────────────────────────────────────────────────
function HistoryScreen({ history, onBack, onRestore }) {
  const [expanded, setExpanded] = useState(null);
  const fmtIcon = { reel: "🎬", carousel: "🖼️", static: "✦", pinterest: "📌" };
  const fmt = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (history.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: B.pageBg, color: "#1A1A1A" }}>
        <ScreenHeader title="Content History" subtitle="Your generated content will appear here." onBack={onBack} />
        <div style={{ padding: "40px 22px", textAlign: "center", color: "#888888", fontSize: 13, fontFamily: "sans-serif" }}>
          No history yet — generate your first piece of content to see it here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: B.pageBg, color: "#1A1A1A" }}>
      <ScreenHeader title="Content History" subtitle={`${history.length} piece${history.length !== 1 ? "s" : ""} saved`} onBack={onBack} />
      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[...history].reverse().map((item, i) => {
          const isOpen = expanded === i;
          const pillarObj = PILLAR_OPTIONS.find(p => p.id === item.pillar);
          return (
            <div key={i} style={{
              background: "#FFFFFF", border: `1px solid ${isOpen ? "rgba(26,26,26,0.25)" : "rgba(0,0,0,0.08)"}`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s",
            }}>
              <button onClick={() => setExpanded(isOpen ? null : i)} style={{
                width: "100%", padding: "14px 16px",
                background: "#FFFFFF", border: "none",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ fontSize: 16 }}>{fmtIcon[item.format] || "✦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", fontFamily: "sans-serif", marginBottom: 3 }}>{item.topic}</div>
                  <div style={{ fontSize: 10, color: "#888888", fontFamily: "sans-serif", letterSpacing: "0.05em" }}>
                    {pillarObj?.icon} {pillarObj?.label} · {item.format} · {fmt(item.timestamp)}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif" }}>{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${B.border}`, padding: "16px" }}>
                  <div style={{ marginBottom: 14 }}>
                    {item.format === "reel"      && <ReelResult     data={item.result} profile={item.profile} />}
                    {item.format === "carousel"  && <CarouselResult data={item.result} />}
                    {item.format === "static"    && <StaticResult   data={item.result} profile={item.profile} />}
                    {item.format === "pinterest" && <PinterestResult data={item.result} profile={item.profile} />}
                  </div>
                  <button onClick={() => onRestore(item)} style={{
                    width: "100%", padding: "10px",
                    background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: 8, color: "#1A1A1A",
                    fontSize: 11, fontWeight: 700, cursor: "pointer",
                    letterSpacing: "0.06em", fontFamily: "sans-serif",
                  }}>↗ RESTORE TO GENERATOR</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DUPLICATE WARNING ────────────────────────────────────────────────────────
function DuplicateWarning({ matches, onContinue, onViewOriginal }) {
  return (
    <div style={{ background: B.red, border: `1px solid ${B.redBorder}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: B.redText, marginBottom: 8, letterSpacing: "0.05em", fontFamily: "sans-serif" }}>
        ⚠️ SIMILAR TOPIC DETECTED
      </div>
      <div style={{ fontSize: 12, color: B.warmGray, marginBottom: 12, lineHeight: 1.6, fontFamily: "sans-serif" }}>
        You've already created content on a similar topic:
      </div>
      {matches.map((m, i) => (
        <div key={i} style={{
          background: "rgba(0,0,0,0.04)", borderRadius: 8, padding: "9px 12px",
          marginBottom: 8, fontSize: 12, color: B.offWhite, fontFamily: "sans-serif",
        }}>
          <span style={{ fontWeight: 700, color: "#1A1A1A" }}>{m.topic}</span>
          <span style={{ color: "#888888" }}> · {m.format} · {new Date(m.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={onContinue} style={{
          flex: 1, padding: "10px", borderRadius: 8,
          background: "#F4F5F7", border: "1px solid rgba(0,0,0,0.15)",
          color: "#1A1A1A", fontSize: 11, fontWeight: 700,
          cursor: "pointer", letterSpacing: "0.06em", fontFamily: "sans-serif",
        }}>GENERATE NEW ANGLE ✦</button>
        <button onClick={onViewOriginal} style={{
          flex: 1, padding: "10px", borderRadius: 8,
          background: "transparent", border: `1px solid ${B.redBorder}`,
          color: B.redText, fontSize: 11, fontWeight: 700,
          cursor: "pointer", letterSpacing: "0.06em", fontFamily: "sans-serif",
        }}>VIEW ORIGINAL</button>
      </div>
    </div>
  );
}

// ─── GENERATOR SCREEN ─────────────────────────────────────────────────────────
function GeneratorScreen({ profile, onEditProfile, onViewHistory, history, setHistory }) {
  const [topic,           setTopic]           = useState("");
  const [contentType,     setContentType]     = useState("social");
  const [format,          setFormat]          = useState("reel");
  const [pillar,          setPillar]          = useState("buyer");
  const [loading,         setLoading]         = useState(false);
  const [result,          setResult]          = useState(null);
  const [error,           setError]           = useState("");
  const [dupes,           setDupes]           = useState(null);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const selFmt    = contentType === "pinterest"
    ? { id: "pinterest", label: "Pinterest Pin", icon: "📌" }
    : FORMAT_OPTIONS.find(f => f.id === format);
  const selPillar = PILLAR_OPTIONS.find(p => p.id === pillar);

  function handleContentTypeChange(type) {
    setContentType(type);
    setFormat(type === "pinterest" ? "pinterest" : "reel");
    setResult(null);
    setError("");
  }

  function findDuplicates(topic) {
    const words = topic.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (!words.length) return [];
    return history.filter(item => {
      const itemWords = item.topic.toLowerCase().split(/\s+/);
      const overlap = words.filter(w => itemWords.some(iw => iw.includes(w) || w.includes(iw)));
      return overlap.length >= Math.min(2, words.length);
    });
  }

  async function doGenerate(angleNote = "") {
    setLoading(true);
    setResult(null);
    setError("");
    setDupes(null);
    try {
      const topicWithNote = angleNote
        ? `${topic} (IMPORTANT: generate a fresh, different angle — ${angleNote})`
        : topic;
      const data = await generateContent({ topic: topicWithNote, format, pillar, profile });
      setResult(data);
      const entry = {
        topic, format, pillar, result: data,
        profile: { name: profile.name, market: profile.market },
        timestamp: Date.now(),
      };
      const updated = [...history, entry].slice(-MAX_HISTORY);
      setHistory(updated);
      saveHistory(updated);
    } catch (e) {
      setError(e.message || "Generation failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    if (!topic.trim() || loading) return;
    const matches = findDuplicates(topic);
    if (matches.length > 0) { setDupes(matches); setPendingGenerate(true); }
    else doGenerate();
  }

  return (
    <div style={{ minHeight: "100vh", background: B.pageBg, color: "#1A1A1A", fontFamily: "sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: `1px solid ${B.border}`, padding: "16px 22px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Georgia, serif", fontStyle: "italic", color: "#1A1A1A" }}>
                The Content Ready Agent
              </h1>
              <span style={{ fontSize: 9, color: "#0891B2", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>by RESH</span>
            </div>
            <p style={{ fontSize: 11, color: "#888888", margin: "2px 0 0" }}>
              Writing as <span style={{ color: "#0891B2", fontWeight: 600 }}>{profile.name}</span> · {profile.market}
            </p>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <button onClick={onViewHistory} style={navBtnStyle}>
              History{history.length > 0 && <span style={{ color: "#2D2D2D", marginLeft: 3 }}>({history.length})</span>}
            </button>
            <button onClick={onEditProfile} style={navBtnStyle}>Profile</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Pillar */}
        <div>
          <GoldLabel>Content Pillar</GoldLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PILLAR_OPTIONS.map(p => (
              <Tag key={p.id} active={pillar === p.id} onClick={() => setPillar(p.id)}>
                {p.icon} {p.label}
              </Tag>
            ))}
          </div>
        </div>

        {/* Content Type Toggle */}
        <div>
          <GoldLabel>What Are You Creating?</GoldLabel>
          <div style={{ display: "flex", gap: 6 }}>
            {CONTENT_TYPES.map(c => (
              <button key={c.id} onClick={() => handleContentTypeChange(c.id)} style={{
                flex: 1, display: "flex", alignItems: "flex-start", gap: 10,
                padding: "11px 14px", borderRadius: 10, textAlign: "left",
                border: `1px solid ${contentType === c.id ? "#1A1A1A" : "rgba(0,0,0,0.08)"}`,
                background: contentType === c.id ? "rgba(26,26,26,0.06)" : "#FFFFFF",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 17, lineHeight: 1.2 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 2, fontFamily: "sans-serif" }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", lineHeight: 1.4 }}>{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Format — only shown for Social Posts */}
        {contentType === "social" && (
          <div>
            <GoldLabel>Format</GoldLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FORMAT_OPTIONS.map(f => (
                <button key={f.id} onClick={() => setFormat(f.id)} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  padding: "11px 14px", borderRadius: 10, textAlign: "left",
                  border: `1px solid ${format === f.id ? "#1A1A1A" : "rgba(0,0,0,0.08)"}`,
                  background: format === f.id ? "rgba(26,26,26,0.06)" : "#FFFFFF",
                  cursor: "pointer", transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 17, lineHeight: 1.2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: format === f.id ? B.gold : B.white, marginBottom: 2, fontFamily: "sans-serif" }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pinterest info note */}
        {contentType === "pinterest" && (
          <div style={{
            background: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.2)",
            borderRadius: 10, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0891B2", fontFamily: "sans-serif", marginBottom: 3 }}>
              📌 Pinterest Pin
            </div>
            <div style={{ fontSize: 11, color: "#888888", fontFamily: "sans-serif", lineHeight: 1.6 }}>
              You'll get a search-optimized pin title, vertical text overlay, keyword-rich description, and a board suggestion — built for long-term, evergreen discovery.
            </div>
          </div>
        )}

        {/* Topic */}
        <div>
          <GoldLabel>Your Topic</GoldLabel>
          <div style={{ display: "flex" }}>
            <input
              value={topic}
              onChange={e => { setTopic(e.target.value); setDupes(null); setPendingGenerate(false); }}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="e.g. why buyers lose bidding wars, down payment myths, Rincon Valley..."
              style={{
                flex: 1, padding: "12px 14px",
                background: "#FFFFFF",
                border: "1px solid #1A1A1A",
                borderRight: "none",
                borderRadius: "9px 0 0 9px",
                fontSize: 13, color: B.white, outline: "none", fontFamily: "sans-serif",
              }}
            />
            <button onClick={handleGenerate} disabled={loading || !topic.trim()} style={{
              padding: "12px 16px",
              background: loading ? "#E5E7EB" : "#1A1A1A",
              color: loading ? "#888888" : "#FFFFFF",
              border: "none", borderRadius: "0 9px 9px 0",
              fontSize: 11, fontWeight: 800,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              letterSpacing: "0.07em", fontFamily: "sans-serif",
              opacity: !topic.trim() && !loading ? 0.5 : 1,
              whiteSpace: "nowrap", transition: "all 0.2s",
            }}>{loading ? "WRITING…" : "GENERATE ✦"}</button>
          </div>
          <p style={{ fontSize: 11, color: "#888888", margin: "6px 0 0" }}>
            <span style={{ color: B.gold }}>{selPillar?.icon} {selPillar?.label}</span>
            {" · "}
            <span style={{ color: B.lightGray }}>{selFmt?.icon} {selFmt?.label}</span>
          </p>
        </div>

        {dupes && dupes.length > 0 && pendingGenerate && (
          <DuplicateWarning
            matches={dupes}
            onContinue={() => { setPendingGenerate(false); doGenerate("try an unexpected or contrarian angle"); }}
            onViewOriginal={() => { setDupes(null); setPendingGenerate(false); onViewHistory(); }}
          />
        )}

        {loading && (
          <div style={{ padding: "32px", textAlign: "center", background: B.card, borderRadius: 12, border: `1px solid ${B.border}` }}>
            <div style={{ fontSize: 22, marginBottom: 10, display: "inline-block", animation: "spin 3s linear infinite", color: "#1A1A1A" }}>✦</div>
            <div style={{ fontSize: 13, color: "#888888", fontFamily: "sans-serif" }}>
              Writing your {selFmt?.label} as {profile.name}…
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "13px 16px", background: B.red, border: `1px solid ${B.redBorder}`, borderRadius: 10, fontSize: 13, color: B.redText, fontFamily: "sans-serif" }}>
            {error}
          </div>
        )}

        {result && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${B.border}` }}>
              <div style={{ width: 3, height: 20, background: B.gold, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2D2D2D", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "sans-serif" }}>
                {selFmt?.label} — "{topic}"
              </span>
            </div>
            {format === "reel"      && <ReelResult     data={result} profile={profile} />}
            {format === "carousel"  && <CarouselResult data={result} />}
            {format === "static"    && <StaticResult   data={result} profile={profile} />}
            {format === "pinterest" && <PinterestResult data={result} profile={profile} />}
            <button onClick={() => doGenerate("generate a completely different angle or approach")} style={{
              marginTop: 18, width: "100%", padding: "11px",
              background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: 10, fontSize: 11, fontWeight: 700,
              color: "#888888", cursor: "pointer",
              letterSpacing: "0.06em", fontFamily: "sans-serif",
            }}>↺ REGENERATE WITH DIFFERENT ANGLE</button>
          </div>
        )}
      </div>
      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(0,0,0,0.07)",
        padding: "18px 22px",
        textAlign: "center",
        marginTop: 12,
      }}>
        <p style={{ fontSize: 11, color: "#AAAAAA", fontFamily: "sans-serif", lineHeight: 1.7, margin: 0 }}>
          Have a question or run into an issue?{" "}
          <a href="mailto:info@realestatesolutionshub.com" style={{ color: "#0891B2", textDecoration: "none", fontWeight: 600 }}>
            info@realestatesolutionshub.com
          </a>
        </p>
        <p style={{ fontSize: 10, color: "#CCCCCC", fontFamily: "sans-serif", margin: "4px 0 0", letterSpacing: "0.05em" }}>
          THE CONTENT READY AGENT · by Real Estate Solutions Hub
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,  setScreen]  = useState("loading");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const p = loadProfile();
    const h = loadHistory();
    setProfile(p);
    setHistory(h);
    setScreen(p ? "generator" : "onboarding");
  }, []);

  function handleProfileSave(newProfile) {
    if (!newProfile) { setScreen("generator"); return; }
    saveProfile(newProfile);
    setProfile(newProfile);
    setScreen("generator");
  }

  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: B.pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 13, color: "#888888", fontFamily: "sans-serif", letterSpacing: "0.1em" }}>LOADING…</div>
      </div>
    );
  }
  if (screen === "onboarding" || screen === "editProfile") {
    return <OnboardingScreen existing={screen === "editProfile" ? profile : null} onComplete={handleProfileSave} />;
  }
  if (screen === "history") {
    return (
      <HistoryScreen
        history={history}
        onBack={() => setScreen("generator")}
        onRestore={(item) => { setScreen("generator"); }}
      />
    );
  }
  return (
    <GeneratorScreen
      profile={profile}
      history={history}
      setHistory={setHistory}
      onEditProfile={() => setScreen("editProfile")}
      onViewHistory={() => setScreen("history")}
    />
  );
}
