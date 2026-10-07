import { NextResponse } from "next/server";
import { ADMIN_API_BASE_URL } from "@/lib/admin-api";
import { WEBSITE_ID, COMPANY_ID } from "@/lib/catalog-utils";
import https from "https";
import http from "http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let catalogCache = null;
let cacheTime = 0;
const CACHE_TTL = 120 * 1000;

function fetchJsonNative(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, { headers: { Accept: "application/json" } }, (res) => {
      let rawData = "";
      res.on("data", (chunk) => { rawData += chunk; });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", (e) => reject(e));
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error("Request timeout to admin catalog"));
    });
  });
}

export async function GET() {
  const now = Date.now();
  if (catalogCache && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(catalogCache, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  try {
    const targetUrl = `${ADMIN_API_BASE_URL}/api/catalog?websiteId=${encodeURIComponent(WEBSITE_ID)}&companyId=${encodeURIComponent(COMPANY_ID)}`;
    const data = await fetchJsonNative(targetUrl);
    if (data && data.success !== false && Array.isArray(data.products) && data.products.length > 0) {
      catalogCache = data;
      cacheTime = now;
      return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }
    return NextResponse.json(data || { success: false, products: [], categories: [] });
  } catch (e) {
    console.error("Error fetching catalog in route.js:", e?.message || e);
    if (catalogCache) {
      return NextResponse.json(catalogCache, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }
    return NextResponse.json(
      { success: false, error: String(e?.message || e), products: [], categories: [] },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
