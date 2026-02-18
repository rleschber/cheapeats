import "./DealTypeFilter.css";

export default function DealTypeFilter({ dealTypes, value, onChange, disabled }) {
  return (
    <div className="deal-type-filter">
      <label htmlFor="deal-type-select" className="deal-type-filter__label">
        Deal type
      </label>
      <select
        id="deal-type-select"
        className="deal-type-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Filter deals by type"
      >
        <option value="">All types</option>
        {dealTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
