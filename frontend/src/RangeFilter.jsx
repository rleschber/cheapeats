import "./RangeFilter.css";

const RADIUS_OPTIONS = [1, 5, 10, 25];

export default function RangeFilter({ value, onChange, disabled }) {
  const radius = value != null ? Number(value) : 25;

  return (
    <div className="range-filter">
      <span className="range-filter__label">Within</span>
      <div className="range-filter__options" role="group" aria-label="Search range in miles">
        {RADIUS_OPTIONS.map((miles) => (
          <button
            key={miles}
            type="button"
            className={`range-filter__btn ${radius === miles ? "range-filter__btn--active" : ""}`}
            onClick={() => onChange(miles)}
            disabled={disabled}
            aria-pressed={radius === miles}
          >
            {miles} mi
          </button>
        ))}
      </div>
    </div>
  );
}
