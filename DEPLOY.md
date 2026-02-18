# How to push CheapEats to production (step-by-step)

You’ll use **Render** (a free, easy host for Node.js apps). You don’t need to connect your GoDaddy domain yet; you can do that later.

---

## What you need first

1. Your code in **GitHub** (create a repo and push this folder).
2. A free account at **Render**: [https://render.com](https://render.com) → Sign up (e.g. with GitHub).

---

## Step 1: Put your project on GitHub

1. Go to [https://github.com/new](https://github.com/new).
2. Create a new repository (e.g. name: `cheapeats` or `polaris-app`). Don’t add a README (you already have one).
3. Open **PowerShell** (or Terminal) on your computer.
4. Go to your project folder:
   ```powershell
   cd "C:\Users\raymo\OneDrive\Desktop\polaris_app"
   ```
5. Turn the folder into a git repo and push (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
   If GitHub asks you to log in, use the browser or a personal access token.

---

## Step 2: Create the app on Render

1. Log in at [https://dashboard.render.com](https://dashboard.render.com).
2. Click **“New +”** → **“Web Service”**.
3. Connect GitHub if asked, then choose the repository you just pushed (e.g. `cheapeats` or `polaris_app`).
4. Use these settings exactly:

   | Setting        | Value |
   |----------------|--------|
   | **Name**       | Anything you like (e.g. `cheapeats`) |
   | **Region**     | Pick one close to you |
   | **Branch**     | `main` |
   | **Runtime**    | **Node** |
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type**  | **Free** (if you want the free tier) |

5. Click **“Create Web Service”**.

Render will install dependencies, run the build (which builds the frontend and backend), then start the app. Wait a few minutes.

---

## Step 3: Open your live app

When the deploy finishes, Render shows a URL like:

**https://cheapeats-xxxx.onrender.com**

Click it. You should see your CheapEats app. The same URL serves both the website and the API (no extra setup).

---

## If something goes wrong

- **Build fails:** On Render, open your service → **“Logs”**. Check the error. Often it’s “npm run build” failing: make sure you pushed the latest code and that both `frontend` and `backend` have a `package.json`.
- **Blank page or errors:** Open the browser’s Developer Tools (F12) → **Console** tab and see if there are red errors. Check the **“Logs”** tab on Render for server errors.
- **“Application failed to respond”:** On the free tier, the app can “sleep” after 15 minutes of no use. The first visit after that may take 30–60 seconds to wake up; that’s normal.

---

## Summary

- **Stack:** Node.js (Express) backend + React (Vite) frontend. One server serves both in production.
- **Host:** Render (free tier, no credit card for Web Services).
- **What you did:** Pushed code to GitHub → created a Render Web Service linked to that repo → Render runs `npm install && npm run build` then `npm start`. Your app is live at the URL Render gives you.
- **Domain:** When you’re ready to use your GoDaddy domain, you’ll add it in Render’s dashboard and point the domain at Render (we can do that in a separate set of steps).

You’re done for “push to production.” Connect the domain whenever you’re ready.
