export const makeSlug = (text = "") =>
  String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

// Dynamic products and categories synchronized strictly from the live database.
// No static mock fallback products so hidden admin items never reappear.
export const fallbackProducts = [];
export const productCategories = ["All Categories"];
