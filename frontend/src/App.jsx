import { useState, useEffect, useCallback } from "react";
import { getDeals, getCuisines, getDealTypes, refreshDeals } from "./api";
import DealCard from "./DealCard";
import CuisineFilter from "./CuisineFilter";
import DealTypeFilter from "./DealTypeFilter";
import RangeFilter from "./RangeFilter";
import "./App.css";

export default function App() {
  const [deals, setDeals] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDealTypes, setSelectedDealTypes] = useState([]);
  const [radius, setRadius] = useState(1);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("prompt");
  const [dealTypes, setDealTypes] = useState([]);

  const loadCuisines = async () => {
    try {
      const data = await getCuisines();
      setCuisines(data.cuisines || []);
    } catch (e) {
      console.warn("Could not load cuisines", e);
    }
  };

  const loadDealTypes = async () => {
    try {
      const data = await getDealTypes();
      setDealTypes(data.dealTypes || []);
    } catch (e) {
      console.warn("Could not load deal types", e);
    }
  };

  const [dealsMessage, setDealsMessage] = useState(null);
  const [dealsUpdatedAt, setDealsUpdatedAt] = useState(null);
  const [dealsSource, setDealsSource] = useState(null);

  const loadDeals = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setDealsMessage(null);
    try {
      if (forceRefresh) {
        await refreshDeals();
      }
      const data = await getDeals({
        cuisines: selectedCuisines,
        dealTypes: selectedDealTypes,
        radius,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
      setDeals(data.deals || []);
      setDealsMessage(data.message || null);
      setDealsUpdatedAt(data.fetchedAt ?? null);
      setDealsSource(data.source ?? null);
    } catch (e) {
      setError("Could not load deals. Is the server running?");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCuisines, selectedDealTypes, radius, userLocation]);

  useEffect(() => {
    loadCuisines();
    loadDealTypes();
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      return;
    }
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">CheapEats</h1>
        <p className="tagline">Best restaurant & fast food deals near you</p>
        <p className="tagline-note">Locations are approximate. Use Directions to open in Maps for the nearest store.</p>
        {locationStatus === "loading" && (
          <p className="location-status location-status--loading">Getting your location…</p>
        )}
        {locationStatus === "granted" && userLocation && (
          <p className="location-status location-status--granted">Using your location for nearby deals</p>
        )}
        {(locationStatus === "denied" || locationStatus === "prompt") && (
          <div className="location-row">
            <p className="location-status location-status--denied">
              Share location to see deals by distance
            </p>
            <button type="button" className="location-btn" onClick={requestLocation}>
              Use my location
            </button>
          </div>
        )}
        {locationStatus === "unsupported" && (
          <p className="location-status">Location not supported in this browser.</p>
        )}
      </header>

      <RangeFilter
        value={radius}
        onChange={setRadius}
        disabled={loading}
      />

      <CuisineFilter
        cuisines={cuisines}
        selected={selectedCuisines}
        onToggle={(c) =>
          setSelectedCuisines((prev) =>
            prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
          )
        }
        disabled={loading}
      />

      <DealTypeFilter
        dealTypes={dealTypes}
        selected={selectedDealTypes}
        onToggle={(t) =>
          setSelectedDealTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
          )
        }
        disabled={loading}
      />

      <main className="main">
        {loading && (
          <div className="state state-loading">Loading deals…</div>
        )}
        {error && (
          <div className="state state-error">{error}</div>
        )}
        {!loading && !error && deals.length === 0 && (
          <div className="state state-empty">
            {dealsMessage || "No deals in this range or cuisine. Try a larger radius or different filter."}
          </div>
        )}
        {!loading && !error && deals.length > 0 && (
          <section className="deals-section">
            <div className="deals-section__meta">
              {(dealsSource === "live" || dealsSource === "cache") && dealsUpdatedAt && (
                <span className="deals-updated" title="Live deals">
                  Live · Updated {new Date(dealsUpdatedAt).toLocaleTimeString()}
                </span>
              )}
              {dealsSource === "static" && (
                <span className="deals-updated" title="Deals from catalog">
                  Catalog deals
                </span>
              )}
              <button
                type="button"
                className="deals-refresh-btn"
                onClick={() => loadDeals(true)}
                disabled={loading}
                title="Fetch latest deals"
              >
                Refresh
              </button>
            </div>
            <h2 className="section-title">
              {selectedCuisines.length || selectedDealTypes.length
                ? [
                    selectedCuisines.length ? selectedCuisines.join(", ") : null,
                    selectedDealTypes.length ? selectedDealTypes.join(", ") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") + " deals"
                : "Best savings"}
            </h2>
            <ul className="deals-list">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <DealCard deal={deal} userLocation={userLocation} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
