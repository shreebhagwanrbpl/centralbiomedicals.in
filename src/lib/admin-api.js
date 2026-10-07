import "server-only";
import { WEBSITE_ID, COMPANY_ID } from "./catalog-utils";

export const ADMIN_API_BASE_URL = (process.env.ADMIN_API_BASE_URL || process.env.ADMIN_API_URL || "https://admin.rajbiosis.app").replace(/\/+$/, "");

const memoryCache = new Map();
const CACHE_TTL_MS = 120 * 1000; // 2 minutes in-memory cache

function buildUrl(pathname, params = {}) {
  const url = new URL(`${ADMIN_API_BASE_URL}${String(pathname || "").startsWith("/") ? pathname : `/${pathname}`}`);
  for (const [key, value] of Object.entries({ websiteId: WEBSITE_ID, companyId: COMPANY_ID, ...params })) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url;
}

export async function adminFetch(pathname, options = {}, params = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const cacheKey = `${pathname}:${JSON.stringify(params)}`;

  if (isGet) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const targetUrl = buildUrl(pathname, params).toString();
  console.log("[adminFetch] Requesting:", targetUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await fetch(targetUrl, {
      ...options,
      signal: options.signal || controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", ...(options.headers || {}) }
    });
    clearTimeout(timeoutId);
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    console.log("[adminFetch] Response status:", response.status, "body preview:", JSON.stringify(body)?.slice(0, 300));
    if (!response.ok || body?.success === false || body?.ok === false) {
      console.warn("[adminFetch] Request failed with body:", body);
      throw new Error(`Admin API ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    }
    if (isGet && body && body.success !== false) {
      memoryCache.set(cacheKey, { timestamp: Date.now(), data: body });
    }
    return body;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("[adminFetch] Catch block error:", err?.message || err);
    if (isGet && memoryCache.has(cacheKey)) {
      const stale = memoryCache.get(cacheKey);
      if (stale && stale.data && stale.data.success !== false) {
        return stale.data;
      }
    }
    throw err;
  }
}

export async function postAdminQuery(endpoint, payload = {}) {
  return adminFetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ websiteId: WEBSITE_ID, companyId: COMPANY_ID, ...payload }) });
}

export async function fetchCatalogFromAdmin() {
  try {
    const j = await adminFetch("/api/catalog");
    const p = j?.products ?? j?.data?.products ?? j?.data ?? j;
    return Array.isArray(p) ? p : [];
  } catch (e) {
    console.warn("fetchCatalogFromAdmin unavailable:", e?.message || e);
    return [];
  }
}
