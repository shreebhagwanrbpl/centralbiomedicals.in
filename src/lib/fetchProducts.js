"use client";

import { makeSlug, WEBSITE_ID } from "@/lib/catalog-utils";

export function normalizeProduct(item, defaultCategory = "Diagnostic Equipment") {
  if (!item || typeof item !== "object") return null;
  const title = String(item.title || item.name || item.productName || item.itemName || "").trim();
  if (!title) return null;
  const rawSlug = item.slug || item.productSlug || item.itemSlug || makeSlug(title);
  const category = item.category || item.categoryName || defaultCategory;
  const subCategory = item.subCategory || item["sub category"] || item.subCategoryName || "";
  const description = item.desc || item.description || item.detail || item.summary || "";
  const image = item.image || item.imgUrl || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : "") || "";
  const images = Array.isArray(item.images) && item.images.length ? item.images : image ? [image] : [];
  const features = Array.isArray(item.features) ? item.features.filter(Boolean) : typeof item.features === "string" ? item.features.split(",").map(f=>f.trim()).filter(Boolean) : [];
  return { ...item, id:item.uid||item.id||item.categoryProductId||rawSlug, categoryProductId:item.categoryProductId||"", title, slug:rawSlug, category, subCategory, description, desc:description, price:item.price||"", capacity:item.capacity||"", throughput:item.throughput||"", instrument:item.instrument||"", model:item.model||"", usage:item.usage||"", brand:item.brand||"", parameters:item.parameters||"", automation:item.automation||"", availability:item.availability||item.status||"", size:item.size||"", features, specs:item.specs&&typeof item.specs==="object"?item.specs:null, badge:item.badge||item.tag||"", status:item.status||item.availability||"In Stock", image, images, video:item.video||"", pdf:item.pdf||"", isPublished:item.isPublished!==false };
}

export async function fetchAllDynamicProducts() {
  try {
    const response = await fetch(`/api/catalog?websiteId=${encodeURIComponent(WEBSITE_ID)}`, { cache: "no-store" });
    if (!response.ok) return [];
    const body = await response.json();
    if (body?.success === false && (!body.products || body.products.length === 0)) return [];
    const raw = body?.products ?? body?.data?.products ?? body?.data ?? body;
    const map = new Map();
    for (const item of Array.isArray(raw) ? raw : []) {
      const p = normalizeProduct(item);
      if (p && p.slug && !map.has(p.slug)) map.set(p.slug, p);
    }
    return [...map.values()];
  } catch (err) {
    console.warn("Could not fetch dynamic products:", err?.message || err);
    return [];
  }
}
