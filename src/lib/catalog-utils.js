export const WEBSITE_ID = "centralbiomedicalsin";
export const COMPANY_ID = "rajbiosis";

export function makeSlug(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function isItemVisibleOnWebsite(item = {}, websiteId = WEBSITE_ID) {
  if (!item) return false;
  if (item.isPublished === false || item.data?.isPublished === false) return false;
  const status = String(item.status || item.data?.status || "active").toLowerCase().trim();
  if (["inactive", "hidden", "draft", "deleted"].includes(status)) return false;

  const rawIds = item.websiteIds !== undefined ? item.websiteIds : item.data?.websiteIds;
  const list = Array.isArray(rawIds) ? rawIds : (rawIds ? [rawIds] : []);

  if (Array.isArray(item.websiteIds) && item.websiteIds.length === 0) return false;
  if (list.length === 0) return false;

  const orgId = String(item.organizationId || item.data?.organizationId || item.data?.companyId || item.companyId || "").toUpperCase();
  const isRajbiosisOrg = orgId === "RBPL" || orgId === "RAJBIOSIS" || orgId === "RAJ" || !orgId;

  const targetSite = String(websiteId || WEBSITE_ID).toLowerCase().replace(/[^a-z0-9]/g, "");

  return list.some((id) => {
    const norm = String(id).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm === "all") {
      return isRajbiosisOrg;
    }
    // Strict distinction: "centralbiomedicalsin" vs "centralbiomedicals"
    return norm === targetSite;
  });
}
