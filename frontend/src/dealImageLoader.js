import { useState, useCallback } from "react";

const LOGO_BASE = "https://logo.clearbit.com/";

/** Fallback when no food keyword matches. */
const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

/**
 * Match deal title + description to a food image. First match wins.
 * Order matters: more specific terms before general (e.g. "chicken sandwich" before "chicken").
 */
const FOOD_KEYWORDS = [
  { keywords: ["taco", "tacos"], url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80" },
  { keywords: ["burrito", "burritos"], url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80" },
  { keywords: ["nachos", "queso"], url: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&q=80" },
  { keywords: ["wing", "wings", "boneless"], url: "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=400&q=80" },
  { keywords: ["burger", "whopper", "mcdouble", "mcchicken", "cheeseburger", "single"], url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { keywords: ["fries", "fry", "waffle fries", "curly fries"], url: "https://images.unsplash.com/photo-1573089895944-1a81d62a2f5a?w=400&q=80" },
  { keywords: ["pizza", "pepperoni", "topping"], url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" },
  { keywords: ["sub", "subs", "footlong", "sandwich", "sandwiches"], url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80" },
  { keywords: ["chicken sandwich"], url: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80" },
  { keywords: ["tender", "tenders", "nugget", "nuggets"], url: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80" },
  { keywords: ["frosty", "milkshake", "shake", "ice cream", "blizzard"], url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80" },
  { keywords: ["cold brew", "coffee", "latte", "espresso", "handcrafted drink"], url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
  { keywords: ["donut", "doughnut"], url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80" },
  { keywords: ["drink", "soda", "slush", "drinks"], url: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&q=80" },
  { keywords: ["pasta", "entrée", "entree"], url: "https://images.unsplash.com/photo-1551183053-bf91a1f81141?w=400&q=80" },
  { keywords: ["bowl", "guac", "guacamole"], url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" },
  { keywords: ["chinese", "entrées", "entrees", "stir fry", "rice"], url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80" },
  { keywords: ["gyro"], url: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80" },
  { keywords: ["corn dog"], url: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&q=80" },
  { keywords: ["breakfast sandwich", "bacon"], url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&q=80" },
  { keywords: ["soup", "salad"], url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80" },
  { keywords: ["app", "apps", "happy hour"], url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80" },
  { keywords: ["pancake", "waffle", "breakfast"], url: "https://images.unsplash.com/photo-1561860949-5b0fd7c2d2b3?w=400&q=80" },
];

/** When deal text doesn't name a food, use restaurant-specific image (e.g. IHOP = breakfast, BWW = wings). */
const RESTAURANT_IMAGE = {
  "IHOP": "https://images.unsplash.com/photo-1561860949-5b0fd7c2d2b3?w=400&q=80",
  "Denny's": "https://images.unsplash.com/photo-1561860949-5b0fd7c2d2b3?w=400&q=80",
  "Buffalo Wild Wings": "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=400&q=80",
  "Wingstop": "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=400&q=80",
  "Dunkin'": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80",
  "Starbucks": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80",
  "Raising Cane's": "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=400&q=80",
  "Zaxby's": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80",
  "KFC": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80",
  "Popeyes": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80",
  "Chick-fil-A": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80",
};

/** Fallback when no keyword matches: show cuisine-appropriate image. */
const CUISINE_IMAGE = {
  "Fast Food": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
  "Mexican": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400&q=80",
  "American": "https://images.unsplash.com/photo-1567620832903-7fcb3dc8ab95?w=400&q=80",
  "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80",
  "Sandwiches": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80",
  "Italian": "https://images.unsplash.com/photo-1551183053-bf91a1f81141?w=400&q=80",
  "Chinese": "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&q=80",
};

function getFoodImageForDeal(deal) {
  if (!deal) return DEFAULT_FOOD_IMAGE;
  const text = `${deal.title || ""} ${deal.dealTitle || ""} ${deal.description || ""}`.toLowerCase();
  for (const { keywords, url } of FOOD_KEYWORDS) {
    if (keywords.some((k) => text.includes(k))) return url;
  }
  const restaurant = deal.restaurant || deal.restaurantName;
  if (restaurant && RESTAURANT_IMAGE[restaurant]) return RESTAURANT_IMAGE[restaurant];
  const cuisine = (deal.cuisine || "").trim();
  if (cuisine && CUISINE_IMAGE[cuisine]) return CUISINE_IMAGE[cuisine];
  return DEFAULT_FOOD_IMAGE;
}

const RESTAURANT_DOMAINS = {
  "McDonald's": "mcdonalds.com", "Taco Bell": "tacobell.com", "Chipotle": "chipotle.com",
  "Wendy's": "wendys.com", "Burger King": "bk.com", "Chick-fil-A": "chick-fil-a.com",
  "Panda Express": "pandaexpress.com", "Subway": "subway.com", "Domino's": "dominos.com",
  "Little Caesars": "littlecaesars.com", "Pizza Hut": "pizzahut.com", "Olive Garden": "olivegarden.com",
  "Buffalo Wild Wings": "buffalowildwings.com", "Dunkin'": "dunkindonuts.com", "Starbucks": "starbucks.com",
  "Sonic": "sonicdrivein.com", "Arby's": "arbys.com", "Jack in the Box": "jackinthebox.com",
  "Whataburger": "whataburger.com", "Wingstop": "wingstop.com", "Raising Cane's": "raisingcanes.com",
  "Zaxby's": "zaxbys.com", "KFC": "kfc.com", "Panera Bread": "panerabread.com", "IHOP": "ihop.com",
  "Denny's": "dennys.com", "Dairy Queen": "dairyqueen.com", "Popeyes": "popeyes.com",
  "Five Guys": "fiveguys.com", "In-N-Out": "in-n-out.com", "Papa John's": "papajohns.com",
  "Moe's Southwest Grill": "moes.com", "Firehouse Subs": "firehousesubs.com",
};

/**
 * Returns a logo URL for the deal's restaurant, or null.
 */
function getLogoUrl(deal) {
  const domain =
    (deal && typeof deal.websiteDomain === "string" && deal.websiteDomain.trim())
      ? deal.websiteDomain.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0]
      : (deal && deal.restaurant && RESTAURANT_DOMAINS[deal.restaurant]) || null;
  if (!domain) return null;
  return LOGO_BASE + domain;
}

/**
 * Always returns a src: logo first, then food image matching the deal (taco, wings, etc.) on error or if no logo.
 * The image area is never blank.
 */
export function useDealImage(deal) {
  const logoUrl = getLogoUrl(deal);
  const [failed, setFailed] = useState(false);
  const foodImage = getFoodImageForDeal(deal);

  const src = failed || !logoUrl ? foodImage : logoUrl;
  const isLogo = !failed && !!logoUrl;

  const onError = useCallback(() => {
    setFailed(true);
  }, []);

  return {
    src,
    type: isLogo ? "logo" : "food",
    onLoad: () => {},
    onError,
    isLoading: false,
    isLogo,
    isFood: !isLogo,
  };
}
