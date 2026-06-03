# Agent Content Creator — by RESH

AI-powered social media content briefs written in your voice, for your market.

---

## Deploy to Vercel (Step-by-Step)

### What you'll need
- A free GitHub account (github.com)
- A free Vercel account (vercel.com)
- Your Anthropic API key (console.anthropic.com)

---

### Step 1 — Get your Anthropic API key

1. Go to **console.anthropic.com** and sign in (or create a free account)
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, give it a name like "content-creator"
4. Copy the key — it starts with `sk-ant-...`
5. Save it somewhere safe — you'll need it in Step 4

---

### Step 2 — Put the project on GitHub

1. Go to **github.com** and sign in
2. Click the **+** button (top right) → **New repository**
3. Name it `agent-content-creator`
4. Leave it **Private**, click **Create repository**
5. On your computer, open Terminal (Mac) or Command Prompt (Windows)
6. Run these commands one at a time:

```
cd path/to/this/folder
git init
git add .
git commit -m "initial build"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/agent-content-creator.git
git push -u origin main
```

*(Replace YOUR-USERNAME with your GitHub username)*

---

### Step 3 — Connect to Vercel

1. Go to **vercel.com** and sign in with your GitHub account
2. Click **Add New** → **Project**
3. Find `agent-content-creator` in the list and click **Import**
4. Leave all settings as default — Vercel will detect it's a Vite project automatically
5. **Don't click Deploy yet** — go to Step 4 first

---

### Step 4 — Add your API key (important!)

Before deploying, you need to add your Anthropic API key as an environment variable:

1. On the Vercel project setup page, scroll down to **Environment Variables**
2. In the **Name** field type: `VITE_ANTHROPIC_API_KEY`
3. In the **Value** field paste your API key (the `sk-ant-...` one from Step 1)
4. Click **Add**
5. Now click **Deploy**

---

### Step 5 — You're live!

Vercel will build and deploy in about 60 seconds.
You'll get a URL like `agent-content-creator.vercel.app` — bookmark it!

To connect your own domain (like `tool.realestatesolutionshub.com`):
1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your domain and follow the DNS instructions

---

## Making Updates

Any time you want to update the app:
1. Edit the files on your computer
2. Run `git add . && git commit -m "update" && git push`
3. Vercel automatically redeploys — usually live in under a minute

---

## Project Structure

```
agent-content-creator/
├── index.html          — App entry point
├── package.json        — Dependencies
├── vite.config.js      — Build config
└── src/
    ├── main.jsx        — React root
    └── App.jsx         — Full application
```

---

## Notes

- Agent profiles and history are saved in the browser's localStorage
- Each agent using the tool on their own device has their own separate data
- The Anthropic API key in Vercel is server-side and never exposed to users
- To update the contact email in the privacy disclosure, search for `realestatesolutionshub.com` in App.jsx and replace with your support email
