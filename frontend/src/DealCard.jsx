import { useState } from "react";
import DealActionModal from "./DealActionModal";
import { getStockImageForFoodType } from "./foodImageMap";
import "./DealCard.css";

/**
 * Valid non-empty URL from deal data only.
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

/**
 * Product image is only used when it matches the deal item (dealTitle).
 * Backend sends productImageUrl only when verified; we still require deal to have title for display.
 */
function productMatchesDealTitle(deal) {
  const title = (deal.dealTitle || deal.title || "").trim();
  return title.length > 0;
}

/**
 * Neutral branded fallback graphic (not plain text). SVG badge with restaurant initial.
 */
function BrandedFallbackGraphic({ restaurantName }) {
  const initial = (restaurantName || "D").charAt(0).toUpperCase();
  return (
    <span className="deal-card__branded-fallback" aria-hidden="true">
      <svg viewBox="0 0 120 120" className="deal-card__branded-fallback-svg" fill="none">
        <rect width="120" height="120" rx="16" fill="var(--accent-soft)" />
        <rect x="4" y="4" width="112" height="112" rx="14" stroke="var(--accent)" strokeWidth="2" fill="none" />
        <text x="60" y="72" textAnchor="middle" className="deal-card__branded-fallback-initial" fill="var(--accent)">
          {initial}
        </text>
      </svg>
    </span>
  );
}

/**
 * Image priority: 1) logoUrl (high-res), 2) productImageUrl (matches dealTitle), 3) controlled stock (foodType), 4) neutral branded fallback.
 * No random food images, no cuisine-based guessing, no generic burger unless deal is for burger.
 */
export default function DealCard({ deal, userLocation }) {
  const restaurantName = deal.restaurantName || deal.restaurant || "Deal";
  const dealTitle = deal.dealTitle || deal.title || "";
  const [modalOpen, setModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [productImageFailed, setProductImageFailed] = useState(false);
  const [stockImageFailed, setStockImageFailed] = useState(false);

  const logoUrl = deal.logoUrl && isValidImageUrl(deal.logoUrl) ? deal.logoUrl : null;
  const productImageUrl =
    deal.productImageUrl && isValidImageUrl(deal.productImageUrl) && productMatchesDealTitle(deal)
      ? deal.productImageUrl
      : null;
  const foodType = deal.foodType && typeof deal.foodType === "string" ? deal.foodType.trim() : null;
  const stockImageSrc = foodType ? getStockImageForFoodType(foodType) : null;

  const tryLogo = logoUrl && !logoFailed;
  const tryProduct = productImageUrl && !productImageFailed && (!tryLogo || logoFailed);
  const tryStock = stockImageSrc && !stockImageFailed && !tryLogo && (!tryProduct || productImageFailed);

  const showLogo = tryLogo;
  const showProduct = !showLogo && tryProduct;
  const showStock = !showLogo && !showProduct && tryStock;
  const showBrandedFallback = !showLogo && !showProduct && (!tryStock || stockImageFailed);

  const displaySrc = showLogo ? logoUrl : showProduct ? productImageUrl : showStock ? stockImageSrc : null;

  const handleImageError = () => {
    if (showLogo) setLogoFailed(true);
    else if (showProduct) setProductImageFailed(true);
    else if (showStock) setStockImageFailed(true);
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
        aria-label={`${restaurantName}: ${dealTitle}. Tap for options.`}
      >
        <div className="deal-card__image-wrap">
          {showBrandedFallback ? (
            <BrandedFallbackGraphic restaurantName={restaurantName} />
          ) : (
            <img
              key={displaySrc}
              src={displaySrc}
              alt=""
              className={`deal-card__image ${showLogo ? "deal-card__image--logo" : ""} ${showProduct ? "deal-card__image--product" : ""} ${showStock ? "deal-card__image--stock" : ""}`}
              onError={handleImageError}
            />
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
