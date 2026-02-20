import { useState } from "react";
import DealActionModal from "./DealActionModal";
import { useDealImage } from "./dealImageLoader";
import "./DealCard.css";

/**
 * DealCard with deterministic hybrid logo strategy:
 * 1) Brandfetch SVG/PNG, 2) Clearbit (reject if < 150px), 3) Controlled stock food image.
 * No letter tiles or random placeholders.
 */
export default function DealCard({ deal, userLocation }) {
  const restaurantName = deal.restaurantName || deal.restaurant || "Deal";
  const dealTitle = deal.dealTitle || deal.title || "";
  const [modalOpen, setModalOpen] = useState(false);

  const {
    src,
    type,
    onLoad,
    onError,
    isLoading,
    isLogo,
    isFood,
  } = useDealImage(deal);

  const handleClick = () => setModalOpen(true);

  return (
    <>
      <article
        className="deal-card"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`${restaurantName}: ${dealTitle}. Tap for options.`}
      >
        <div className="deal-card__image-wrap">
          {!src ? (
            <div
              className="deal-card__image-placeholder"
              aria-hidden="true"
            />
          ) : (
            <img
              key={src}
              src={src}
              alt=""
              className={`deal-card__image ${isLogo ? "deal-card__image--logo" : ""} ${isFood ? "deal-card__image--food" : ""}`}
              onLoad={onLoad}
              onError={onError}
            />
          )}
          {isLoading && (
            <div className="deal-card__image-loading" aria-hidden="true" />
          )}
        </div>
        <div className="deal-card__body">
          <div className="deal-card__header">
            <span className="deal-card__cuisine">{deal.cuisine}</span>
            <span className="deal-card__savings">{deal.savings}</span>
          </div>
          <h3 className="deal-card__title">{dealTitle}</h3>
          <p className="deal-card__restaurant">{restaurantName}</p>
          <p className="deal-card__description">{deal.description}</p>
          <div className="deal-card__meta">
            {deal.distanceMiles != null && (
              <span className="deal-card__distance">{deal.distanceMiles} mi away</span>
            )}
            {deal.savingsAmount && (
              <span className="deal-card__amount">Save {deal.savingsAmount}</span>
            )}
            {deal.validUntil && (
              <span className="deal-card__valid">Valid until {deal.validUntil}</span>
            )}
          </div>
          <span className="deal-card__cta">Tap for options</span>
        </div>
      </article>
      {modalOpen && (
        <DealActionModal
          deal={deal}
          userLocation={userLocation}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
