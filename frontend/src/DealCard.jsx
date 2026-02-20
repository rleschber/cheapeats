import { useState } from "react";
import DealActionModal from "./DealActionModal";
import "./DealCard.css";

/**
 * Valid non-empty URL from deal data only. No guessing or stock URLs.
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

/**
 * Image priority: 1) logoUrl (official), 2) productImageUrl (verified, matches deal), 3) text-only fallback.
 * No stock images, Unsplash, or cuisine-based guessing.
 */
export default function DealCard({ deal, userLocation }) {
  const restaurantName = deal.restaurant || "Deal";
  const [modalOpen, setModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [productImageFailed, setProductImageFailed] = useState(false);

  const logoUrl = deal.logoUrl && isValidImageUrl(deal.logoUrl) ? deal.logoUrl : null;
  const productImageUrl =
    deal.productImageUrl && isValidImageUrl(deal.productImageUrl) ? deal.productImageUrl : null;

  const tryLogo = logoUrl && !logoFailed;
  const tryProduct = productImageUrl && !productImageFailed && (!tryLogo || logoFailed);

  const showLogo = tryLogo;
  const showProduct = !showLogo && tryProduct;
  const showTextFallback = !showLogo && (!tryProduct || productImageFailed);

  const displaySrc = showLogo ? logoUrl : showProduct ? productImageUrl : null;
  const initial = restaurantName.charAt(0).toUpperCase();

  const handleImageError = () => {
    if (showLogo) setLogoFailed(true);
    else if (showProduct) setProductImageFailed(true);
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
        aria-label={`${restaurantName}: ${deal.title}. Tap for options.`}
      >
        <div className="deal-card__image-wrap">
          {showTextFallback ? (
            <span className="deal-card__text-fallback" aria-hidden="true">
              {restaurantName}
            </span>
          ) : (
            <img
              key={displaySrc}
              src={displaySrc}
              alt=""
              className={`deal-card__image ${showLogo ? "deal-card__image--logo" : ""} ${showProduct ? "deal-card__image--product" : ""}`}
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
