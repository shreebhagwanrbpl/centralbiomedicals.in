import { NextResponse } from "next/server";
import {
  initialHomeData,
  initialContactData,
  initialServicesData,
} from "@/data/siteData";

export const dynamic = "force-dynamic";

const memoryCache = new Map();

const DEFAULT_MAP = {
  home: initialHomeData,
  contact: initialContactData,
  services: initialServicesData,
};

export async function GET(req) {
  const url = new URL(req.url);
  const type = (
    url.searchParams.get("type") ||
    url.searchParams.get("pageType") ||
    "home"
  ).toLowerCase();
  const district = url.searchParams.get("district");
  const websiteId = url.searchParams.get("websiteId") || "centralbiomedicalsin";

  const cacheKey = `${websiteId}:${type}:${district || ""}`;

  // Instant response from memory cache (0ms)
  if (memoryCache.has(cacheKey)) {
    return NextResponse.json(
      { success: true, data: memoryCache.get(cacheKey) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "X-Speed": "0ms",
        },
      }
    );
  }

  // Instant response from pre-compiled site data (0ms)
  const defaultData = DEFAULT_MAP[type];
  if (defaultData) {
    memoryCache.set(cacheKey, defaultData);
    return NextResponse.json(
      { success: true, data: defaultData },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          "X-Speed": "1ms",
        },
      }
    );
  }

  return NextResponse.json(
    { success: false, data: null, message: "Page data not found" },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=10",
      },
    }
  );
}
