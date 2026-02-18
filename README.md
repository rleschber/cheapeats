# CheapEats

A mobile-first app that consolidates restaurant and fast food discounts and deals. The home page shows the **best deals by savings**, and you can **filter by cuisine**.

## What’s included

- **Backend** (Node.js + Express): REST API for deals and cuisine list, with seed data.
- **Frontend** (React + Vite): Responsive UI that works great on phones and desktops.

## Quick start

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

API runs at **http://localhost:3001**. Endpoints:

- `GET /api/deals` – list deals (best savings first). Optional: `?cuisine=Mexican`, `?sort=newest`
- `GET /api/deals/cuisines` – list of cuisine types for the filter

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. Vite proxies `/api` to the backend, so the app works without CORS issues.

### 3. Use the app

- Open **http://localhost:5173** in your browser (or on your phone on the same Wi‑Fi by using your PC’s IP and port 5173).
- Home page shows deals sorted by best savings.
- Use the **Cuisine** dropdown to filter (e.g. Mexican, Pizza, Fast Food).

## Data

Deals are in **`backend/data/deals.js`**. The app ships with **120+ deals** across many chains: BOGO, daily specials, happy hour, kids eat free, app-only offers, and more. You can:

- Edit or add deals there (restaurant, cuisine, title, description, savings, validUntil, etc.).
- To make the app **location-discovered** (real restaurants near the user): integrate **Google Places API** (or Yelp/Foursquare) to fetch nearby restaurants by lat/lng, then match or merge with deal data from your own DB, partner feeds, or scraping pipelines.

## Optional: run both with one command

From the project root:

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173.

## Tech stack

- **Backend:** Express, CORS, ES modules
- **Frontend:** React 18, Vite, CSS (no UI framework; mobile-first layout)
