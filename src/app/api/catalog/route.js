import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

let serverCacheData = null;
let serverCacheTime = 0;
const SERVER_CACHE_TTL = 30 * 60 * 1000; // 30 minutes in-memory cache

function loadCatalogFromDisk() {
  try {
    const snapPath = path.join(process.cwd(), "src", "data", "dynamic-catalog.json");
    if (fs.existsSync(snapPath)) {
      const content = fs.readFileSync(snapPath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[api/catalog] Error reading dynamic-catalog.json snapshot:", err?.message || err);
  }
  return null;
}

export async function GET(request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const now = Date.now();

  // 1. Return in-memory cache if fresh and not forced (0ms latency)
  if (!force && serverCacheData !== null && now - serverCacheTime < SERVER_CACHE_TTL) {
    return NextResponse.json(serverCacheData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  // 2. Load from disk snapshot if memory cache is empty
  if (!serverCacheData) {
    const diskData = loadCatalogFromDisk();
    if (diskData) {
      serverCacheData = diskData;
      serverCacheTime = now;
      return NextResponse.json(diskData, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  }

  // 3. If memory cache exists, return it immediately so user NEVER waits
  if (serverCacheData) {
    return NextResponse.json(serverCacheData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      websiteId: "centralbiomedicalsin",
      categories: ["All Categories"],
      products: [],
      totalCount: 0,
      error: "Catalog temporarily unavailable",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
