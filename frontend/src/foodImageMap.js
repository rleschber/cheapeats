/**
 * Controlled stock image library. Only these keys may be used.
 * No dynamic fetch, no Unsplash, no cuisine-based guessing.
 * Add high-resolution images to public/images/stock/ for each key.
 */
export const FOOD_IMAGE_MAP = {
  burger: "/images/stock/burger.jpg",
  pizza: "/images/stock/pizza.jpg",
  sub: "/images/stock/sub.jpg",
  pancakes: "/images/stock/pancakes.jpg",
  steak: "/images/stock/steak.jpg",
  fries: "/images/stock/fries.jpg",
  chicken: "/images/stock/chicken.jpg",
  wings: "/images/stock/wings.jpg",
  taco: "/images/stock/taco.jpg",
  bowl: "/images/stock/bowl.jpg",
  drink: "/images/stock/drink.jpg",
  coffee: "/images/stock/coffee.jpg",
  icecream: "/images/stock/icecream.jpg",
  pasta: "/images/stock/pasta.jpg",
};

/**
 * Returns stock image path only if foodType is in the controlled map.
 * No guessing; no fallback to generic burger.
 */
export function getStockImageForFoodType(foodType) {
  if (!foodType || typeof foodType !== "string") return null;
  const key = foodType.trim().toLowerCase();
  return FOOD_IMAGE_MAP[key] || null;
}
