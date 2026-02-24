# CheapEats

A mobile-first web app that aggregates restaurant and fast-food discounts and deals. Browse the best savings near you, filter by cuisine or deal type, and get directions or app links in one tap.

---

## Features

- **Deal discovery** -- deals sorted by highest savings percentage
- **Location-aware** -- uses your browser's geolocation to show nearby deals with distance
- **Filters** -- cuisine type (Mexican, Pizza, Fast Food, etc.), deal type (BOGO, Happy Hour, Kids Eat Free, etc.), and adjustable search radius (0.1--25 miles)
- **Deal cards** -- each card shows restaurant name, cuisine, savings, distance, expiration date, and a food image
- **Deal actions modal** -- tap a card to open the restaurant website, download their app (App Store / Play Store), or get Google Maps directions
- **Live deals pipeline** -- pull deals from an external JSON feed, the OpenMenu API, a built-in web scraper, or the static catalog (120+ deals)
- **Auto-expiration** -- expired deals are automatically hidden
- **Refresh** -- manual refresh button and 15-minute cache TTL for live sources
- **Responsive design** -- looks great on phones, tablets, and desktops

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 18, Vite 5, plain CSS        |
| Backend  | Node.js, Express, ES modules       |
| Scraping | Cheerio (HTML parsing)              |
| APIs     | OpenMenu, Geolocation, Google Maps  |
| Database | None -- in-memory cache and static data files |

---

## Project Structure

```
polaris_app/
├── backend/
│   ├── data/
│   │   ├── deals.js                 # 120+ deal catalog
│   │   ├── restaurantLogos.js       # Logo URL mappings
│   │   └── restaurantFoodImages.js  # Food image mappings
│   ├── routes/
│   │   └── deals.js                 # API endpoints
│   ├── services/
│   │   ├── liveDealsService.js      # Feed / OpenMenu / scraper pipeline
│   │   ├── dealScraper.js           # Web scraper for deal pages
│   │   └── websiteImageService.js   # Restaurant image extraction
│   ├── server.js                    # Express entry point
│   ├── .env.example                 # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── public/images/               # Fallback food images
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx              # Main app with location & filters
│   │   │   ├── DealCard.jsx         # Individual deal card
│   │   │   ├── DealActionModal.jsx  # Website / app / directions modal
│   │   │   ├── CuisineFilter.jsx    # Cuisine filter pills
│   │   │   ├── DealTypeFilter.jsx   # Deal type filter pills
│   │   │   └── RangeFilter.jsx      # Radius slider
│   │   ├── api.js                   # API client
│   │   ├── restaurantLinks.js       # Restaurant URLs & app store links
│   │   └── main.jsx                 # React entry point
│   ├── vite.config.js               # Proxies /api to backend
│   └── package.json
│
├── package.json                     # Root scripts (dev, build, start)
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)

---

## Quick Start

### One command (recommended)

From the project root:

```bash
npm run dev
```

This installs all dependencies and starts both the backend and frontend concurrently.

- **Backend** runs at `http://localhost:3001`
- **Frontend** runs at `http://localhost:5173`

Open **http://localhost:5173** in your browser.

### Manual setup (two terminals)

**Terminal 1 -- Backend:**

```bash
cd backend
npm install
npm run dev
```

**Terminal 2 -- Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

---

## Environment Variables

Copy the template and edit as needed:

```bash
cp backend/.env.example backend/.env
```

| Variable              | Required | Default     | Description                                                        |
| --------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `PORT`                | No       | `3001`      | Backend server port                                                |
| `DEALS_FEED_URL`      | No       | --          | URL returning a JSON array (or `{ "deals": [...] }`) of deals     |
| `OPENMENU_API_KEY`    | No       | --          | OpenMenu API key ([get one here](https://www.openmenu.com/platform/account/api.php)) |
| `OPENMENU_CITY`       | No       | --          | City for OpenMenu local deals                                     |
| `OPENMENU_COUNTRY`    | No       | `US`        | Country code for OpenMenu                                          |
| `OPENMENU_STATE`      | No       | --          | State for OpenMenu                                                 |
| `OPENMENU_POSTAL_CODE`| No       | --          | Postal code for OpenMenu                                           |
| `SCRAPER_URLS`        | No       | --          | Comma-separated URLs to scrape for deals                           |
| `SCRAPER_INTERVAL_MS` | No       | `3600000`   | Scraper refresh interval (milliseconds, default 1 hour)            |

**No environment variables are required.** Without any keys, the app uses the built-in catalog of 120+ deals.

---

## Data Sources

The backend tries each source in order and uses the first one that succeeds:

1. **JSON Feed** (`DEALS_FEED_URL`) -- any URL returning deal JSON
2. **OpenMenu API** (`OPENMENU_API_KEY`) -- restaurant deal aggregator
3. **Web Scraper** (`SCRAPER_URLS`) -- extracts deal-like text from web pages
4. **Static Catalog** (fallback) -- `backend/data/deals.js` with 120+ pre-loaded deals

You can try the live pipeline without external services by pointing the feed at itself:

```
DEALS_FEED_URL=http://localhost:3001/api/deals/feed
```

The UI shows **"Live - Updated ..."** when deals come from a live source, and **"Catalog deals"** when using the static fallback.

---

## API Endpoints

| Method | Endpoint                  | Description                                      |
| ------ | ------------------------- | ------------------------------------------------ |
| GET    | `/api/deals`              | List deals (supports query params below)         |
| GET    | `/api/deals/cuisines`     | Available cuisine types                          |
| GET    | `/api/deals/deal-types`   | Available deal types                             |
| GET    | `/api/deals/feed`         | Raw unexpired deals as JSON                      |
| POST   | `/api/deals/refresh`      | Force-refresh the live deals cache               |
| GET    | `/health`                 | Health check                                     |

**Query parameters for `/api/deals`:**

| Param      | Example              | Description                          |
| ---------- | -------------------- | ------------------------------------ |
| `cuisine`  | `?cuisine=Mexican`   | Filter by cuisine type               |
| `dealType` | `?dealType=BOGO`     | Filter by deal type                  |
| `sort`     | `?sort=newest`       | Sort order (`savings` or `newest`)   |
| `radius`   | `?radius=5`          | Max distance in miles                |
| `lat`      | `?lat=34.05`         | User latitude (for distance calc)    |
| `lng`      | `?lng=-118.24`       | User longitude (for distance calc)   |

---

## Using the App

1. **Allow location access** -- the app asks for your browser's geolocation so it can show distances and nearby deals.
2. **Browse deals** -- the home page shows deals sorted by best savings percentage. Each card displays the restaurant, deal description, how much you save, and how far away it is.
3. **Filter deals** -- use the cuisine pills (Mexican, Pizza, Fast Food, etc.), deal type pills (BOGO, Happy Hour, Kids Eat Free, etc.), or the radius slider to narrow results.
4. **Tap a deal** -- opens a modal with three actions:
   - **Go to website** -- opens the restaurant's site
   - **Get the app** -- links to the App Store or Google Play (detected by your device)
   - **Get directions** -- opens Google Maps with directions to the restaurant
5. **Refresh** -- tap the refresh button to pull the latest deals from the live source.

### Mobile access

To use the app on your phone while running locally, open `http://<your-pc-ip>:5173` on any device connected to the same Wi-Fi network.

---

## Production Build

Build the frontend and serve everything from the backend:

```bash
npm run build
npm start
```

The backend serves the built frontend and the API on a single port (default `3001`).

---

## Available Scripts

| Script            | Command              | Description                                      |
| ----------------- | -------------------- | ------------------------------------------------ |
| `npm run dev`     | Root                 | Install deps + start backend and frontend         |
| `npm run build`   | Root                 | Build frontend for production + install backend   |
| `npm start`       | Root                 | Start production server                           |
| `npm run backend` | Root                 | Start backend dev server only                     |
| `npm run frontend`| Root                 | Start frontend dev server only                    |
| `npm run install:all` | Root             | Install all dependencies                          |

---

## Troubleshooting

| Problem                             | Solution                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| "Deals can't be loaded" / ECONNREFUSED | The backend isn't running. Start it with `cd backend && npm install && npm run dev`, or run `npm run dev` from the project root. |
| Location not working                | Make sure you allow location access in your browser. Some browsers block it on `http://` -- try Chrome or Edge. |
| No deals showing                    | All deals may have expired. Check `backend/data/deals.js` and update `validUntil` dates, or connect a live source. |
| Port already in use                 | Change the port in `backend/.env` (`PORT=3002`) or kill the process using the port.              |
