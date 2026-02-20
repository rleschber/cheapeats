import "./CuisineFilter.css";

export default function CuisineFilter({ cuisines, selected = [], onToggle, disabled }) {
  return (
    <div className="cuisine-filter">
      <span className="cuisine-filter__label">Cuisine</span>
      <div className="cuisine-filter__pills" role="group" aria-label="Filter deals by cuisine">
        {cuisines.map((c) => {
          const isSelected = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              className={`cuisine-filter__pill ${isSelected ? "cuisine-filter__pill--active" : ""}`}
              onClick={() => onToggle(c)}
              disabled={disabled}
              aria-pressed={isSelected}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}
