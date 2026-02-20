import "./RangeFilter.css";

const MIN_MILES = 0.1;
const MAX_MILES = 25;
const STEP = 0.1;

export default function RangeFilter({ value, onChange, disabled }) {
  const radius = value != null ? Number(value) : 10;
  const clamped = Math.max(MIN_MILES, Math.min(MAX_MILES, radius));

  const handleChange = (e) => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) onChange(v);
  };

  return (
    <div className="range-filter">
      <div className="range-filter__slider-wrap">
        <div className="range-filter__row">
          <label htmlFor="radius-slider" className="range-filter__label">
            Within
          </label>
          <span className="range-filter__value" aria-live="polite">
            {clamped % 1 === 0 ? clamped : clamped.toFixed(1)} mi
          </span>
        </div>
        <input
          id="radius-slider"
          type="range"
          min={MIN_MILES}
          max={MAX_MILES}
          step={STEP}
          value={clamped}
          onChange={handleChange}
          disabled={disabled}
          className="range-filter__slider"
          aria-label="Search radius in miles"
        />
      </div>
    </div>
  );
}
