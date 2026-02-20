/**
 * Curated high-quality logo URLs for deal cards.
 * Only chains with a reliable, clear logo are listed here.
 * All other chains show deal/cuisine food images instead (no blurry favicons).
 *
 * Using Clearbit logo API - same URL format, but we only use it for chains
 * we've verified look good. Omit Qdoba, Potbelly, Applebee's, etc. so they get food.
 */
const CLEARBIT = "https://logo.clearbit.com/";

export const CURATED_LOGOS = {
  "McDonald's": CLEARBIT + "mcdonalds.com",
  "Taco Bell": CLEARBIT + "tacobell.com",
  "Chipotle": CLEARBIT + "chipotle.com",
  "Wendy's": CLEARBIT + "wendys.com",
  "Burger King": CLEARBIT + "bk.com",
  "Chick-fil-A": CLEARBIT + "chick-fil-a.com",
  "Panda Express": CLEARBIT + "pandaexpress.com",
  "Subway": CLEARBIT + "subway.com",
  "Domino's": CLEARBIT + "dominos.com",
  "Little Caesars": CLEARBIT + "littlecaesars.com",
  "Pizza Hut": CLEARBIT + "pizzahut.com",
  "Olive Garden": CLEARBIT + "olivegarden.com",
  "Buffalo Wild Wings": CLEARBIT + "buffalowildwings.com",
  "Dunkin'": CLEARBIT + "dunkindonuts.com",
  "Starbucks": CLEARBIT + "starbucks.com",
  "Sonic": CLEARBIT + "sonicdrivein.com",
  "Arby's": CLEARBIT + "arbys.com",
  "Jack in the Box": CLEARBIT + "jackinthebox.com",
  "Whataburger": CLEARBIT + "whataburger.com",
  "Wingstop": CLEARBIT + "wingstop.com",
  "Raising Cane's": CLEARBIT + "raisingcanes.com",
  "Zaxby's": CLEARBIT + "zaxbys.com",
  "KFC": CLEARBIT + "kfc.com",
  "Panera Bread": CLEARBIT + "panerabread.com",
  "IHOP": CLEARBIT + "ihop.com",
  "Denny's": CLEARBIT + "dennys.com",
  "Dairy Queen": CLEARBIT + "dairyqueen.com",
  "Popeyes": CLEARBIT + "popeyes.com",
  "Five Guys": CLEARBIT + "fiveguys.com",
  "In-N-Out": CLEARBIT + "in-n-out.com",
  "Moe's Southwest Grill": CLEARBIT + "moes.com",
  "Firehouse Subs": CLEARBIT + "firehousesubs.com",
};

function normalize(name) {
  if (!name || typeof name !== "string") return "";
  return name.trim().replace(/\u2019/g, "'").replace(/\u2018/g, "'");
}

/**
 * Returns a high-quality logo URL only if this chain is in the curated list.
 * Otherwise returns null so the card shows food instead.
 */
export function getCuratedLogoUrl(restaurantName) {
  if (!restaurantName) return null;
  if (CURATED_LOGOS[restaurantName]) return CURATED_LOGOS[restaurantName];
  const n = normalize(restaurantName);
  if (!n) return null;
  const key = Object.keys(CURATED_LOGOS).find((k) => normalize(k) === n);
  return key ? CURATED_LOGOS[key] : null;
}
