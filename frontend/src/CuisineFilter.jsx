import "./CuisineFilter.css";

export default function CuisineFilter({ cuisines, value, onChange, disabled }) {
  return (
    <div className="cuisine-filter">
      <label htmlFor="cuisine-select" className="cuisine-filter__label">
        Cuisine
      </label>
      <select
        id="cuisine-select"
        className="cuisine-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="Filter deals by cuisine"
      >
        <option value="">All cuisines</option>
        {cuisines.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
