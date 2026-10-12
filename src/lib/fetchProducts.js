"use client";

import { makeSlug, WEBSITE_ID } from "@/lib/catalog-utils";
import dynamicCatalogSnapshot from "@/data/dynamic-catalog.json";

const STORAGE_KEY = "cb_catalog_cache_v3";
const CLIENT_TTL = 3 * 1000; // 3 seconds before re-fetching from server

let cachedProducts = null;
let lastFetchTime = 0;

export function normalizeProduct(item, defaultCategory = "Diagnostic Equipment") {
  if (!item || typeof item !== "object") return null;
  const title = String(item.title || item.name || item.productName || item.itemName || "").trim();
  if (!title) return null;
  const rawSlug = item.slug || item.productSlug || item.itemSlug || makeSlug(title);
  const category = String(item.category || item.categoryName || defaultCategory).trim();
  const subCategory = String(item.subCategory || item["sub category"] || item.subCategoryName || "").trim();
  const description = String(item.desc || item.description || item.detail || item.summary || "").trim();
  const image = item.image || item.imgUrl || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : "") || "";
  const images = Array.isArray(item.images) && item.images.length ? item.images : image ? [image] : [];
  const features = Array.isArray(item.features)
    ? item.features.filter(Boolean)
    : typeof item.features === "string"
      ? item.features.split(",").map((f) => f.trim()).filter(Boolean)
      : [];

  return {
    ...item,
    id: item.uid || item.id || item.categoryProductId || rawSlug,
    categoryProductId: item.categoryProductId || "",
    title,
    slug: rawSlug,
    category,
    subCategory,
    description,
    desc: description,
    price: item.price || "",
    capacity: item.capacity || "",
    throughput: item.throughput || "",
    instrument: item.instrument || "",
    model: item.model || "",
    usage: item.usage || "",
    brand: item.brand || "",
    parameters: item.parameters || "",
    automation: item.automation || "",
    availability: item.availability || item.status || "In Stock",
    size: item.size || "",
    features,
    specs: item.specs && typeof item.specs === "object" ? item.specs : null,
    badge: item.badge || item.tag || "",
    status: item.status || item.availability || "In Stock",
    image,
    images,
    video: item.video || "",
    pdf: item.pdf || "",
    isPublished: item.isPublished !== false,
  };
}

/**
 * Synchronously retrieves initial products in 0 milliseconds.
 * Checks (1) In-memory cache, (2) Browser localStorage, (3) Static pre-bundled snapshot.
 * Guarantees that the UI never starts empty or with a skeleton on initial render or tab switch.
 */
export function getInitialProductsSync() {
  if (cachedProducts !== null && cachedProducts.length > 0) {
    return cachedProducts;
  }

  // Check localStorage (persisted from previous visit or tab)
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedProducts = parsed;
          return parsed;
        }
      }
    } catch {
      // ignore JSON errors
    }
  }

  // Fallback to static snapshot pre-bundled with the app (0ms load)
  if (Array.isArray(dynamicCatalogSnapshot?.products) && dynamicCatalogSnapshot.products.length > 0) {
    const list = dynamicCatalogSnapshot.products
      .map((p) => normalizeProduct(p))
      .filter(Boolean);
    cachedProducts = list;
    return list;
  }

  return [];
}

/**
 * Synchronously retrieves initial categories in 0 milliseconds.
 */
export function getInitialCategoriesSync() {
  const prods = getInitialProductsSync();
  const setCat = new Set(["All Categories"]);
  for (const item of prods) {
    if (item?.category && String(item.category).trim() && String(item.category).trim() !== "All Categories") {
      setCat.add(String(item.category).trim());
    }
  }
  return Array.from(setCat);
}

// Invalidate cache safely without clearing current screen products
export function invalidateProductsCache() {
  lastFetchTime = 0;
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("cb_catalog_updated"));
    } catch {
      // ignore
    }
  }
}

// Auto-revalidate silently in background when user switches back from Admin to Website tab
if (typeof window !== "undefined") {
  const handleWindowFocusOrVisible = () => {
    // Keep cachedProducts intact so UI NEVER blinks or stalls!
    lastFetchTime = 0;
    fetchAllDynamicProducts({ force: true, silent: true }).catch(() => {});
  };

  window.addEventListener("focus", handleWindowFocusOrVisible);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      handleWindowFocusOrVisible();
    }
  });
}

/**
 * Fetches dynamic products from /api/catalog.
 * Uses stale-while-revalidate pattern: returns current cache immediately if available,
 * then updates in background.
 */
export async function fetchAllDynamicProducts({ force = false, silent = false } = {}) {
  const now = Date.now();

  // Return memory cache immediately if fresh and not forced
  if (!force && cachedProducts !== null && cachedProducts.length > 0 && now - lastFetchTime < CLIENT_TTL) {
    return cachedProducts;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`/api/catalog?websiteId=${encodeURIComponent(WEBSITE_ID)}&_t=${now}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const body = await response.json();
      const raw = body?.products ?? body?.data?.products ?? body?.data ?? body;
      const map = new Map();

      for (const item of Array.isArray(raw) ? raw : []) {
        const p = normalizeProduct(item);
        if (p && p.slug && !map.has(p.slug)) map.set(p.slug, p);
      }

      const productsList = [...map.values()];
      cachedProducts = productsList;
      lastFetchTime = now;

      // Persist to localStorage for 0ms loads on future page loads
      if (typeof window !== "undefined" && productsList.length > 0) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(productsList));
        } catch {
          // ignore quota error
        }
      }

      // Notify any components listening for updates
      if (typeof window !== "undefined") {
        try {
          window.dispatchEvent(new CustomEvent("cb_catalog_updated"));
        } catch {
          // ignore
        }
      }

      return productsList;
    }
  } catch (err) {
    if (!silent) {
      console.warn("[fetchProducts] Failed to fetch live catalog:", err?.message || err);
    }
  }

  // Fallback to initial/cached products so user never sees empty screen
  return getInitialProductsSync();
}

export async function fetchAllDynamicCategories({ force = false } = {}) {
  const products = await fetchAllDynamicProducts({ force });
  const setCat = new Set(["All Categories"]);

  if (Array.isArray(products)) {
    products.forEach((item) => {
      if (item?.category && String(item.category).trim() && String(item.category).trim() !== "All Categories") {
        setCat.add(String(item.category).trim());
      }
    });
  }

  return Array.from(setCat);
}
