export const WEBSITE_ID = "centralbiomedicalsin";
export const COMPANY_ID = "rajbiosis";

export function makeSlug(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function isItemVisibleOnWebsite(item = {}, websiteId = WEBSITE_ID) {
  if (item?.isPublished === false) return false;
  const ids = [item.websiteId, ...(Array.isArray(item.websiteIds) ? item.websiteIds : [])].filter(Boolean).map(String);
  return ids.length === 0 || ids.includes(String(websiteId));
}
