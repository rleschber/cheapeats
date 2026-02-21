# How to push CheapEats to production (step-by-step)

**You asked:** What stack is this? What’s the easiest way to push to production? Is there a standard, easy host? I have a domain from GoDaddy; for now I only want to push to production and will connect the domain later. I want frontend and backend on one platform, and my school is paying (no free tier).

**Short answers:**

- **Stack:** Backend = **Node.js + Express** (API). Frontend = **React + Vite**. In production, the backend serves the built frontend too, so it’s **one app on one server**.
- **Easiest way to production:** Put the code on GitHub, then deploy that repo on **Railway**. One platform, one deploy — no separate frontend or backend hosting.
- **Standard, easy host for this stack:** **Railway** is a common choice for Node/React apps: simple setup, one place for frontend + backend, pay-as-you-go (your school can pay). No free-tier needed.

You’ll connect your GoDaddy domain later; these steps only get the app live on a Railway URL.

---

## What you need first

1. Your code in a **GitHub** repository (create one and push this folder).
2. A **Railway** account: [https://railway.app](https://railway.app) — sign in with **GitHub**.

---

## Step 1: Put your project on GitHub

1. In your browser, go to [https://github.com/new](https://github.com/new).
2. Create a **new repository** (e.g. name: `cheapeats` or `polaris-app`). Leave “Add a README” **unchecked** (you already have one in the project).
3. On your computer, open **PowerShell** (search “PowerShell” in the Start menu).
4. Go to your project folder by typing (then press Enter):
   ```powershell
   cd "C:\Users\raymo\OneDrive\Desktop\polaris_app"
   ```
5. Run these commands **one at a time** (replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPO` with the repo name you chose in step 2):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
   If GitHub asks you to sign in, do it in the browser or use a personal access token when prompted.

When this is done, your full project (frontend + backend) is on GitHub.

---

## Step 2: Deploy on Railway (one platform for frontend + backend)

1. In your browser, go to [https://railway.app](https://railway.app) and sign in with **GitHub**.
2. Click **“New Project”**.
3. Choose **“Deploy from GitHub repo”**. Select the repository you just pushed (e.g. `cheapeats` or `polaris_app`). Authorize Railway to access GitHub if it asks.
4. Railway will create a **service** from that repo. Click that service to open it.
5. In the service, open the **Settings** (or **Variables**) section and set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** leave blank (so it uses the repo root).
6. In **Settings**, find **Networking** / **Public Networking** and click **“Generate Domain”** (or similar). Railway will assign a public URL like **https://your-app-name.up.railway.app**.
7. Add a **payment method** (Railway is pay-as-you-go; your school can pay — typically **about $5–10/month** for this app). The app needs this to run (no free tier required).
8. Wait for the **deploy** to finish (watch the **Deployments** tab). When it says the deploy succeeded, open the URL Railway gave you.

You should see your CheapEats app in the browser. That **one URL** serves both the website (frontend) and the API (backend) — everything on one platform.

---

## Step 3: After deploy is "online" — next steps

### 1. Test the app

1. In Railway, find your **public URL** (e.g. **https://your-app-name.up.railway.app**). It’s in your service under **Settings** → **Networking** / **Domains**, or on the service overview.
2. **Click the URL** (or copy it into your browser). The CheapEats home page should load.
3. Check that **deals show up** and the **Cuisine** (or other) filter works. If that works, your app is live and working.

You can share this link with anyone; no other step is required for the app to be public.

---

### 2. (Optional) Connect your GoDaddy domain

When you want the app to be at **your domain** (e.g. `www.cheapeats.com`) instead of the Railway URL:

**A. In Railway**

1. Open your project → click your **service**.
2. Go to **Settings** → **Networking** (or **Domains**).
3. Click **Custom Domain** (or **Add domain**).
4. Enter your domain, e.g. `www.yourdomain.com` or `yourdomain.com` (Railway will show which they support).
5. Railway will show you a **CNAME target** (e.g. `your-app.up.railway.app`) or **A record** instructions. **Leave this tab open** — you’ll use it in GoDaddy.

**B. In GoDaddy**

1. Log in at [https://godaddy.com](https://godaddy.com) → **My Products** → click your **domain**.
2. Open **DNS** or **Manage DNS** (for that domain).
3. Add or edit a record as Railway says:
   - For **www** (e.g. `www.yourdomain.com`): Add a **CNAME** record: **Name** = `www`, **Value** = the Railway CNAME target (e.g. `your-app.up.railway.app`). Save.
   - For **root** (e.g. `yourdomain.com` with no www): Railway may give you an **A record** with an IP, or tell you to use a CNAME. Follow what Railway shows.
4. Save. DNS can take **5–60 minutes** to update. After that, opening `https://www.yourdomain.com` (or your domain) should show your app.

**C. HTTPS**

Railway usually provides HTTPS for your custom domain once the domain points to them. If Railway asks you to add a CNAME for verification, add it in GoDaddy the same way as above.

---

## If something goes wrong

- **Build fails:** In Railway, open your service → **Deployments** → click the latest deploy → check **Logs**. The error message usually says what failed (e.g. missing dependency). Make sure you pushed the latest code and that both `frontend` and `backend` folders and their `package.json` files are in the repo.
- **Blank or broken page:** In your browser, press **F12** → open the **Console** tab and look for red errors. In Railway, check **Logs** for the running app to see any server errors.

---

## Summary

| Question | Answer |
|----------|--------|
| **What stack?** | Node.js (Express) backend + React (Vite) frontend. In production, one Node server serves both. |
| **Easiest way to production?** | Push code to GitHub → deploy that repo on Railway with the build/start commands above. |
| **Standard, easy host?** | Railway — one platform, frontend and backend together, simple setup, pay-as-you-go (school can pay). |
| **Domain (GoDaddy)?** | Not in this guide. When you’re ready, you’ll add the domain in Railway’s dashboard and point your GoDaddy domain to Railway; we can do that in a separate set of steps. |

You’re done for “push to production.” Connect your GoDaddy domain whenever you want to.
