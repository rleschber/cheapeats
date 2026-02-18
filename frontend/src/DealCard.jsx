import { useState } from "react";
import DealActionModal from "./DealActionModal";
import { getBrandLogoUrls } from "./restaurantLinks";
import "./DealCard.css";

export default function DealCard({ deal, userLocation }) {
  const brand = deal.restaurant || "Deal";
  const [modalOpen, setModalOpen] = useState(false);
  const [foodImageFailed, setFoodImageFailed] = useState(false);

  const foodUrl = deal.image || null;
  const logoUrls = getBrandLogoUrls(deal.restaurant);
  const [logoUrlIndex, setLogoUrlIndex] = useState(0);
  const logoFailed = logoUrlIndex >= logoUrls.length;
  const showFoodFirst = foodUrl && !foodImageFailed;
  const displaySrc = showFoodFirst ? foodUrl : logoUrls[logoUrlIndex];
  const showLetterFallback = !showFoodFirst && logoFailed;
  const initial = brand.charAt(0).toUpperCase();

  const handleImageError = () => {
    if (showFoodFirst) setFoodImageFailed(true);
    else if (logoUrlIndex + 1 < logoUrls.length) setLogoUrlIndex((i) => i + 1);
    else setLogoUrlIndex(logoUrls.length);
  };

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
        aria-label={`${brand}: ${deal.title}. Tap for options.`}
      >
        <div className="deal-card__image-wrap">
          {showLetterFallback ? (
            <span className="deal-card__logo-fallback" aria-hidden="true">
              {initial}
            </span>
          ) : (
            <img
              key={displaySrc}
              src={displaySrc}
              alt=""
              className={`deal-card__image ${!showFoodFirst ? "deal-card__image--logo" : ""}`}
              onError={handleImageError}
            />
          )}
          <span className="deal-card__brand" aria-hidden="true">
            {brand}
          </span>
        </div>
        <div className="deal-card__body">
          <div className="deal-card__header">
            <span className="deal-card__cuisine">{deal.cuisine}</span>
            <span className="deal-card__savings">{deal.savings}</span>
          </div>
          <h3 className="deal-card__title">{deal.title}</h3>
          <p className="deal-card__restaurant">{deal.restaurant}</p>
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
