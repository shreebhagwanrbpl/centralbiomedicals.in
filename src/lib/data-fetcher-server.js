import { fetchCatalogFromAdmin, adminFetch } from "./admin-api";
import { COMPANY_ID, WEBSITE_ID, makeSlug, isItemVisibleOnWebsite } from "./catalog-utils";

const normalize = (p = {}, i = 0) => {
  const title = p.title || p.name || p.productName || p.itemName || "Biomedical Equipment";
  const images = Array.isArray(p.images) && p.images.length ? p.images : p.image ? [p.image] : p.imageUrl ? [p.imageUrl] : p.imgUrl ? [p.imgUrl] : [];
  const id = p.id || p.uid || p.productId || `${makeSlug(title) || "product"}-${i}`;
  return { ...p, id, productId: p.productId || id, uid: p.uid || id, title, name: title, slug: p.slug || makeSlug(title), desc: p.desc ?? p.description ?? "", description: p.description ?? p.desc ?? "", category: p.category || "Diagnostic Equipment", categoryId: p.categoryId || p.categoryID || makeSlug(p.category || "diagnostic"), subCategory: p.subCategory || p.subcategory || p.category || "General", subcategoryId: p.subcategoryId || p.subCategoryId || makeSlug(p.subCategory || p.subcategory || p.category || "general"), companyId: p.companyId || COMPANY_ID, images, image: images[0] || p.image || "", video: p.video || "", pdf: p.pdf || "", brand: p.brand || "", model: p.model || "", capacity: p.capacity || "", throughput: p.throughput || "", instrument: p.instrument || "", usage: p.usage || "", parameters: p.parameters || "", automation: p.automation || "", availability: p.availability || "", size: p.size || "", isPublished: p.isPublished !== false };
};
const unwrap = j => j?.data ?? j?.page ?? j?.pages ?? j ?? null;

export async function fetchFullCatalog({ websiteId = WEBSITE_ID } = {}) {
  try {
    const raw = await fetchCatalogFromAdmin();
    const filtered = (Array.isArray(raw) ? raw : []).filter(x => isItemVisibleOnWebsite(x, websiteId)).map(normalize);
    return filtered;
  } catch (e) {
    return [];
  }
}

export async function fetchCategoriesTree({ companyId = COMPANY_ID, websiteId = WEBSITE_ID } = {}) {
  try {
    const j = await adminFetch("/api/catalog", {}, { websiteId, companyId });
    const raw = j?.categories ?? j?.data?.categories;
    if (Array.isArray(raw) && raw.length) return raw.filter(c => isItemVisibleOnWebsite(c, websiteId));
  } catch (e) { console.warn("Admin category tree failed; deriving from products:", e?.message || e); }
  const map = new Map();
  for (const p of await fetchFullCatalog({ companyId, websiteId })) {
    const id = p.categoryId || makeSlug(p.category || "general"), name = p.category || id;
    if (!map.has(id)) map.set(id, { id, name, category: name, slug: makeSlug(name), products: [], subcategories: new Map() });
    const c = map.get(id); c.products.push(p);
    const sid = p.subcategoryId || makeSlug(p.subCategory || "general"), sn = p.subCategory || sid;
    if (!c.subcategories.has(sid)) c.subcategories.set(sid, { id: sid, name: sn, subCategory: sn, slug: makeSlug(sn), products: [], productsCount: 0 });
    const s = c.subcategories.get(sid); s.products.push(p); s.productsCount++;
  }
  return [...map.values()].map(c => ({ ...c, subcategories: [...c.subcategories.values()], totalProductsCount: c.products.length }));
}

export const fetchCatalogCategories = async (o={}) => (await fetchCategoriesTree(o)).map(c => c.name || c.category || c.id);
export async function fetchSitePage(pageType, websiteId = WEBSITE_ID) {
  try {
    return unwrap(await adminFetch("/api/site-data", {}, { type: pageType, pageType, websiteId, companyId: COMPANY_ID }));
  } catch {
    return null;
  }
}
export async function fetchDocCached(path) { const a = String(path || "").split("/"); const i = a.indexOf("pages"); if (i >= 0 && a[i+1]) return fetchSitePage(a[i+1]); const d = a.indexOf("districts"); if (d >= 0 && a[d+1]) return fetchDistrictData(a[d+1]); return null; }
export const fetchHomeData = () => fetchSitePage("home");
export const fetchContactData = () => fetchSitePage("contact");
export const fetchServicesData = () => fetchSitePage("services");
export async function fetchDistrictData(district) {
  if (!district) return null;
  try {
    return unwrap(await adminFetch("/api/site-data", {}, { type: "district", pageType: "district", district, websiteId: WEBSITE_ID, companyId: COMPANY_ID }));
  } catch {
    return null;
  }
}
export async function fetchDistricts({ companyId = COMPANY_ID, websiteId = WEBSITE_ID } = {}) {
  try {
    const j = await adminFetch("/api/site-data", {}, { type: "districts", pageType: "districts", websiteId, companyId });
    const a = j?.data?.districts ?? j?.data ?? j?.districts ?? j;
    return Array.isArray(a) ? a.map((x,i) => ({ ...x, id: x.id || x.slug || `dist-${i}`, slug: x.slug || x.id || makeSlug(x.district || x.name || `dist-${i}`) })) : [];
  } catch {
    return [];
  }
}
