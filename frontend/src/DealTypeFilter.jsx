import "./DealTypeFilter.css";

export default function DealTypeFilter({ dealTypes, selected = [], onToggle, disabled }) {
  return (
    <div className="deal-type-filter">
      <span className="deal-type-filter__label">Deal type</span>
      <div className="deal-type-filter__pills" role="group" aria-label="Filter deals by type">
        {dealTypes.map((t) => {
          const isSelected = selected.includes(t);
          return (
            <button
              key={t}
              type="button"
              className={`deal-type-filter__pill ${isSelected ? "deal-type-filter__pill--active" : ""}`}
              onClick={() => onToggle(t)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
