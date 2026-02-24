# Run CheapEats – do everything in one go

## One-time setup + run (from project root)

```bash
npm run dev
```

This will:

1. Install backend dependencies (Express, cheerio, dotenv, cors)
2. Install frontend dependencies (React, Vite, etc.)
3. Start the **backend** at http://localhost:3001 (API + scraper)
4. Start the **frontend** at http://localhost:5173 (proxies /api to backend)

Then open **http://localhost:5173** in your browser.

---

## If you don’t use the root `dev` script

**Terminal 1 – backend**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 – frontend**

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

---

## What’s already done for you

- **Backend `.env`** – Created from `.env.example`. Add `OPENMENU_API_KEY` when you have it.
- **Scraper URLs** – All 35 “Go to website” restaurant URLs are built into the backend; no config needed.
- **Single command** – From the project root, `npm run dev` installs everything and starts both servers.

## "Deals can't be loaded" / ECONNREFUSED

The backend is not running. Start it in a separate terminal: `cd backend` then `npm install` then `npm run dev`. You should see `CheapEats API running at http://localhost:3001`. Keep that terminal open and use http://localhost:5173. Or run `npm run dev` from the project root to start both backend and frontend.

---

## Production (single server)

```bash
npm run build
npm start
```

Serves the built frontend and API from the backend on `PORT` (default 3001).
