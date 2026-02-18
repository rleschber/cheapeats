import { useEffect } from "react";
import { getRestaurantLinks } from "./restaurantLinks";
import "./DealActionModal.css";

function buildDirectionsUrl(userLocation, deal) {
  if (deal.latitude == null || deal.longitude == null) return null;
  const dest = `${deal.latitude},${deal.longitude}`;
  const origin = userLocation
    ? `${userLocation.lat},${userLocation.lng}`
    : "Current+Location";
  const params = new URLSearchParams({ api: "1", origin, destination: dest });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function DealActionModal({ deal, userLocation, onClose }) {
  const links = deal?.restaurant ? getRestaurantLinks(deal.restaurant) : null;
  const websiteUrl = deal?.website || links?.website;
  const directionsUrl = buildDirectionsUrl(userLocation, deal);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const appUrl = isIOS ? links?.appStore : links?.playStore;

  const isAbsoluteUrl = (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"));
  const safeWebsiteUrl = isAbsoluteUrl(websiteUrl) ? websiteUrl : null;
  const safeAppUrl = isAbsoluteUrl(appUrl) ? appUrl : null;
  const safeDirectionsUrl = isAbsoluteUrl(directionsUrl) ? directionsUrl : null;

  return (
    <div
      className="deal-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-modal-title"
    >
      <div className="deal-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="deal-modal-title" className="deal-modal__title">
          {deal?.restaurant}
        </h2>
        <p className="deal-modal__deal">{deal?.title}</p>
        <div className="deal-modal__actions">
          {safeWebsiteUrl && (
            <a
              href={safeWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="deal-modal__btn deal-modal__btn--website"
            >
              Website
            </a>
          )}
          {safeAppUrl && (
            <a
              href={safeAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="deal-modal__btn deal-modal__btn--app"
            >
              {isIOS ? "App Store" : "Get app / Open"}
            </a>
          )}
          {safeDirectionsUrl && (
            <a
              href={safeDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="deal-modal__btn deal-modal__btn--directions"
            >
              Directions
            </a>
          )}
          {!safeWebsiteUrl && !safeAppUrl && !safeDirectionsUrl && (
            <p className="deal-modal__empty">No links available for this deal.</p>
          )}
        </div>
        <button
          type="button"
          className="deal-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
