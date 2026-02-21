import { useState } from "react";
import DealActionModal from "./DealActionModal";
import "./DealCard.css";

export default function DealCard({ deal, userLocation }) {
  const restaurantName = deal.restaurant || "Deal";
  const dealTitle = deal.title || "";
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <article
        className="deal-card"
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        aria-label={`${restaurantName}: ${dealTitle}. Tap for options.`}
      >
        <div className="deal-card__image-wrap">
          <img
            src={deal.foodImage}
            alt=""
            className="deal-card__image"
          />
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
