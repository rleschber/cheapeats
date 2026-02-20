import { useState } from "react";
import DealActionModal from "./DealActionModal";
import { getCuratedLogoUrl } from "./curatedLogos";
import { getFallbackFoodImage } from "./cuisineFoodImages";
import "./DealCard.css";

export default function DealCard({ deal, userLocation }) {
  const brand = deal.restaurant || "Deal";
  const [modalOpen, setModalOpen] = useState(false);
  const [dealImageFailed, setDealImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [foodFallbackFailed, setFoodFallbackFailed] = useState(false);

  const dealImageUrl = deal.image || null;
  const curatedLogoUrl = getCuratedLogoUrl(deal.restaurant);
  const fallbackFoodUrl = getFallbackFoodImage(deal);

  const showDealImage = dealImageUrl && !dealImageFailed;
  const showLogo = !showDealImage && curatedLogoUrl && !logoFailed;
  const showFood = !showDealImage && (!curatedLogoUrl || logoFailed) && !foodFallbackFailed;
  const showLetter = !showDealImage && (!curatedLogoUrl || logoFailed) && foodFallbackFailed;

  const displaySrc = showDealImage
    ? dealImageUrl
    : showLogo
      ? curatedLogoUrl
      : showFood
        ? fallbackFoodUrl
        : null;
  const initial = brand.charAt(0).toUpperCase();

  const handleImageError = () => {
    if (showDealImage) setDealImageFailed(true);
    else if (showLogo) setLogoFailed(true);
    else if (showFood) setFoodFallbackFailed(true);
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
          {showLetter ? (
            <span className="deal-card__logo-fallback" aria-hidden="true">
              {initial}
            </span>
          ) : (
            <img
              key={displaySrc}
              src={displaySrc}
              alt=""
              className={`deal-card__image ${showLogo ? "deal-card__image--logo" : ""} ${showFood ? "deal-card__image--cuisine-food" : ""}`}
              onError={handleImageError}
            />
          )}
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
