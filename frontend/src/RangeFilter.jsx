import "./RangeFilter.css";

// 0.1–1 mi in 0.1 steps, then 1–25 mi in 1 mi steps (no duplicate 1)
const RADIUS_OPTIONS = [
  ...Array.from({ length: 10 }, (_, i) => (i + 1) * 0.1), // 0.1 .. 1
  ...Array.from({ length: 24 }, (_, i) => i + 2),         // 2 .. 25
];

function valueToIndex(miles) {
  const num = Number(miles);
  if (isNaN(num) || num <= RADIUS_OPTIONS[0]) return 0;
  if (num >= RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]) return RADIUS_OPTIONS.length - 1;
  let i = RADIUS_OPTIONS.findIndex((m) => m >= num);
  if (i <= 0) return 0;
  return num - RADIUS_OPTIONS[i - 1] <= RADIUS_OPTIONS[i] - num ? i - 1 : i;
}

export default function RangeFilter({ value, onChange, disabled }) {
  const radius = value != null ? Number(value) : 10;
  const clamped = Math.max(RADIUS_OPTIONS[0], Math.min(RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1], radius));
  const index = valueToIndex(clamped);
  const displayMiles = RADIUS_OPTIONS[index];

  const handleChange = (e) => {
    const i = parseInt(e.target.value, 10);
    if (!isNaN(i) && i >= 0 && i < RADIUS_OPTIONS.length) onChange(RADIUS_OPTIONS[i]);
  };

  return (
    <div className="range-filter">
      <div className="range-filter__slider-wrap">
        <div className="range-filter__row">
          <label htmlFor="radius-slider" className="range-filter__label">
            Within
          </label>
          <span className="range-filter__value" aria-live="polite">
            {displayMiles % 1 === 0 ? displayMiles : displayMiles.toFixed(1)} mi
          </span>
        </div>
        <input
          id="radius-slider"
          type="range"
          min={0}
          max={RADIUS_OPTIONS.length - 1}
          step={1}
          value={index}
          onChange={handleChange}
          disabled={disabled}
          className="range-filter__slider"
          aria-label="Search radius in miles"
          aria-valuemin={RADIUS_OPTIONS[0]}
          aria-valuemax={RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1]}
          aria-valuenow={displayMiles}
          aria-valuetext={`${displayMiles % 1 === 0 ? displayMiles : displayMiles.toFixed(1)} miles`}
        />
      </div>
    </div>
  );
}
