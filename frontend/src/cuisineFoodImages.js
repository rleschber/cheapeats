/**
 * One food image per cuisine (Unsplash). Used when deal has no image and logo fails to load.
 */
const DEFAULT_FOOD =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

export const CUISINE_FOOD_IMAGES = {
  "Fast Food":
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  Mexican: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600",
  Chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
  Sandwiches:
    "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600",
  American:
    "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600",
  Italian:
    "https://images.unsplash.com/photo-1551183053-bf91a1f81141?w=600",
  Desserts:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600",
};

/**
 * Match deal title/description to a food image. Order matters (first match wins).
 * Keywords are checked case-insensitively against title + description.
 */
const DEAL_FOOD_KEYWORDS = [
  { keywords: ["cookie", "cookies"], url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600" },
  { keywords: ["queso", "cheese dip"], url: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=600" },
  { keywords: ["guac", "guacamole"], url: "https://images.unsplash.com/photo-1599970603822-4c4e37d19d8e?w=600" },
  { keywords: ["nachos"], url: "https://images.unsplash.com/photo-1599970603822-4c4e37d19d8e?w=600" },
  { keywords: ["taco", "tacos"], url: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600" },
  { keywords: ["burrito", "burritos"], url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600" },
  { keywords: ["pizza"], url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
  { keywords: ["wing", "wings"], url: "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=600" },
  { keywords: ["burger", "whopper", "mcdouble", "mcchicken", "single"], url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600" },
  { keywords: ["fries", "fry", "waffle fries"], url: "https://images.unsplash.com/photo-1573089895944-1a81d62a2f5a?w=600" },
  { keywords: ["sandwich", "sub", "footlong"], url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600" },
  { keywords: ["nugget", "nuggets"], url: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600" },
  { keywords: ["chicken sandwich"], url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600" },
  { keywords: ["frosty", "shake", "milkshake"], url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600" },
  { keywords: ["drink", "soda", "cold brew", "latte", "espresso"], url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600" },
  { keywords: ["coffee", "donut", "doughnut"], url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600" },
  { keywords: ["smoothie"], url: "https://images.unsplash.com/photo-1505252585461-04db1eb94525?w=600" },
  { keywords: ["ice cream", "blizzard", "frosty"], url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600" },
  { keywords: ["pasta", "entrée", "entree"], url: "https://images.unsplash.com/photo-1551183053-bf91a1f81141?w=600" },
  { keywords: ["bowl"], url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600" },
  { keywords: ["rice", "stir fry", "chinese"], url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600" },
  { keywords: ["pretzel"], url: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600" },
  { keywords: ["slush", "slushee"], url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600" },
];

export function getDealFoodImage(deal) {
  if (!deal) return null;
  const text = `${deal.title || ""} ${deal.description || ""}`.toLowerCase();
  for (const { keywords, url } of DEAL_FOOD_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return url;
  }
  return null;
}

export function getCuisineFoodImage(cuisine) {
  if (!cuisine || typeof cuisine !== "string") return DEFAULT_FOOD;
  const key = Object.keys(CUISINE_FOOD_IMAGES).find(
    (k) => k.toLowerCase() === cuisine.trim().toLowerCase()
  );
  return key ? CUISINE_FOOD_IMAGES[key] : DEFAULT_FOOD;
}

/**
 * Best fallback food image: deal-based (from title/description) or cuisine-based.
 */
export function getFallbackFoodImage(deal) {
  const dealImg = getDealFoodImage(deal);
  if (dealImg) return dealImg;
  return getCuisineFoodImage(deal?.cuisine);
}
