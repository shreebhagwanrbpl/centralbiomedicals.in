"use client";

import { WEBSITE_ID, COMPANY_ID, makeSlug } from "./catalog-utils";

export const db = { __admin: true };
const qs = (params = {}) => new URLSearchParams({ websiteId: WEBSITE_ID, companyId: COMPANY_ID, ...params }).toString();

const clientApiCache = new Map();
const CLIENT_API_TTL = 3 * 1000; // 3 seconds cache for live reflection of admin updates

async function request(path, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const now = Date.now();

  if (isGet) {
    const cached = clientApiCache.get(path);
    if (cached && now - cached.time < CLIENT_API_TTL) {
      return cached.data;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem("cb_api_" + path);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed) {
            if (!cached) clientApiCache.set(path, { data: parsed, time: now });
            if (now - (parsed.__savedAt || 0) < 15000) {
              return parsed;
            }
          }
        }
      } catch {
        // ignore
      }
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const r = await fetch(path, {
      ...options,
      signal: options.signal || controller.signal,
      headers: { Accept: "application/json", ...(options.headers || {}) },
    });
    clearTimeout(timeoutId);

    const text = await r.text();
    let b;
    try { b = text ? JSON.parse(text) : null; } catch { b = text; }
    if (!r.ok || b?.success === false || b?.ok === false) {
      if (options.method && options.method !== "GET") {
        throw new Error(b?.error || `API ${r.status}`);
      }
      return null;
    }

    if (isGet && b && b.success !== false) {
      clientApiCache.set(path, { data: b, time: now });
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("cb_api_" + path, JSON.stringify({ ...b, __savedAt: now }));
        } catch {
          // ignore
        }
      }
    }

    return b;
  } catch (err) {
    if (options.method && options.method !== "GET") {
      throw err;
    }
    // Return stale cache if available on network error/timeout
    if (isGet) {
      const stale = clientApiCache.get(path);
      if (stale?.data) return stale.data;
    }
    return null;
  }
}
export function doc(_db, ...parts) { return { __type:"doc", path:parts.join("/") }; }
export function collection(_db, ...parts) { return { __type:"collection", path:parts.join("/") }; }
export function query(ref, ...constraints) { return { ...ref, constraints }; }
export function limit(n) { return { type:"limit", value:n }; }
export function where(field, op, value) { return { type:"where", field, op, value }; }
export async function getDoc(ref) {
  try {
    const parts = String(ref?.path || "").split("/");
    const pages = parts.indexOf("pages");
    const districts = parts.indexOf("districts");

    if (pages >= 0 && parts[pages + 1]) {
      const pageName = parts[pages + 1];
      const j = await request(`/api/site-data?${qs({ type: pageName, pageType: pageName })}`);
      const data = j?.data ?? j?.page ?? j;
      const validData = data && typeof data === "object" && Object.keys(data).length > 0 ? data : null;
      return { exists: () => !!validData, data: () => validData || {} };
    }

    if (districts >= 0 && parts[districts + 1]) {
      const distName = parts[districts + 1];
      const j = await request(`/api/site-data?${qs({ type: "district", pageType: "district", district: distName })}`);
      const data = j?.data ?? j;
      const validData = data && typeof data === "object" && Object.keys(data).length > 0 ? data : null;
      return { exists: () => !!validData, data: () => validData || {} };
    }

    if (parts.includes("products") || parts.includes("items")) {
      const j = await request(`/api/catalog?${qs()}`);
      const data = { products: j?.products ?? j?.data?.products ?? j?.data ?? [] };
      return { exists: () => true, data: () => data };
    }

    return { exists: () => false, data: () => ({}) };
  } catch {
    return { exists: () => false, data: () => ({}) };
  }
}
export async function getDocs(ref) {
  try {
    const path = String(ref?.path || "");
    if (path.includes("categoryproducts") && path.endsWith("categories")) {
      const j = await request(`/api/catalog?${qs()}`);
      const cats = j?.categories ?? j?.data?.categories ?? [];
      return { empty: !cats.length, docs: cats.map((x, i) => ({ id: x.id || x.slug || `category-${i}`, data: () => x })) };
    }
    const j = await request(`/api/catalog?${qs()}`);
    const products = j?.products ?? j?.data?.products ?? j?.data ?? j;
    const arr = Array.isArray(products) ? products : [];
    return { empty: !arr.length, docs: arr.map((x, i) => ({ id: x.id || x.uid || x.slug || `product-${i}`, data: () => x })) };
  } catch {
    return { empty: true, docs: [] };
  }
}
export async function addDoc(ref, payload={}) { const path=String(ref?.path||""); const endpoint=path.includes("productQueries")?"/api/product-query":"/api/contact-query"; return request(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({websiteId:WEBSITE_ID,companyId:COMPANY_ID,...payload})}); }
export function onSnapshot(ref, onNext, onError) { let stopped=false; const run=async()=>{try{const snap=ref?.__type==="doc"?await getDoc(ref):await getDocs(ref); if(!stopped) onNext(snap)}catch(e){if(!stopped&&onError)onError(e)}}; run(); const timer=setInterval(run,60000); return ()=>{stopped=true;clearInterval(timer)}; }
export { makeSlug };

export function subscribeToCatalog(onUpdate, onError) {
  let stopped = false;
  let lastSignature = "";

  const run = async () => {
    if (stopped) return;
    try {
      const now = Date.now();
      const response = await fetch(`/api/catalog?${qs({ _t: now })}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!response.ok) return;
      const json = await response.json();
      if (json && !stopped) {
        const products = json?.products ?? json?.data?.products ?? json?.data ?? [];
        if (Array.isArray(products)) {
          const signature = `${products.length}:${products.map((p) => p.id || p.productId || p.slug).join(",")}`;
          if (signature !== lastSignature) {
            lastSignature = signature;
            onUpdate(products);
          }
        }
      }
    } catch (error) {
      if (!stopped && onError) onError(error);
    }
  };

  run();
  const timer = setInterval(run, 4000);

  const handleLiveEvent = () => {
    if (!stopped) run();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleLiveEvent);
    window.addEventListener("cb_catalog_updated", handleLiveEvent);
    document.addEventListener("visibilitychange", handleLiveEvent);
  }

  return () => {
    stopped = true;
    clearInterval(timer);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", handleLiveEvent);
      window.removeEventListener("cb_catalog_updated", handleLiveEvent);
      document.removeEventListener("visibilitychange", handleLiveEvent);
    }
  };
}
