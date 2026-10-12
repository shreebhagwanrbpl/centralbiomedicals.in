import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import dns from "dns";

// Configure reliable DNS servers to prevent querySrv ETIMEOUT on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // ignore
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://rajbiosis15_db_user:R7jmlgZ3RfeB0MEz@superadminrbpl.aneatej.mongodb.net/company_master_cms?retryWrites=true&w=majority";

import fs from "fs";
import path from "path";

let cachedClient = null;
let cachedDb = null;
let serverCacheData = null;
let serverCacheTime = 0;
const SERVER_CACHE_TTL = 2000; // 2 seconds server-side memory cache

async function getDb() {
  if (cachedDb) return cachedDb;
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db("company_master_cms");
  return cachedDb;
}

/**
 * Strict website visibility checker for centralbiomedicals.in ("centralbiomedicalsin").
 * Note: "centralbiomedicals" is a separate website and must NOT match here!
 */
export function isSiteVisible(websiteIds, orgId = "") {
  if (!websiteIds) return false;
  const list = Array.isArray(websiteIds) ? websiteIds : [websiteIds];
  if (list.length === 0) return false;

  const normOrg = String(orgId || "").toUpperCase();
  const isRajbiosisOrg = normOrg === "RBPL" || normOrg === "RAJBIOSIS" || normOrg === "RAJ";

  return list.some((w) => {
    const norm = String(w).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (norm === "all") {
      return isRajbiosisOrg || !orgId;
    }
    // STRICT: centralbiomedicals.in is "centralbiomedicalsin".
    // "centralbiomedicals" is a separate website!
    return norm === "centralbiomedicalsin";
  });
}

function makeSlug(text = "") {
  return String(text).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function GET(request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const now = Date.now();

  // Return server-side memory cache if valid (0ms latency)
  if (!force && serverCacheData !== null && now - serverCacheTime < SERVER_CACHE_TTL) {
    return NextResponse.json(serverCacheData, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  }

  try {
    const db = await getDb();

    // 1. Fetch categories across all organizations
    const catDocs = await db.collection("categories").find({}).toArray();

    const explicitlyHiddenCats = new Set();
    const explicitlyVisibleCats = new Set();
    const catNameMap = new Map();

    for (const c of catDocs) {
      if (!c) continue;
      const catId = (c.categoryId || c.slug || c._id.replace(/^[A-Z0-9]+_/, "")).toLowerCase();
      const org = c.organizationId || "RBPL";
      const name = c.name || c.data?.name || c.data?.category || catId;
      catNameMap.set(catId, name);

      const isPub = c.isPublished !== false && c.data?.isPublished !== false;
      const status = String(c.status || c.data?.status || "active").toLowerCase().trim();
      const isActive = !["inactive", "hidden", "draft", "deleted"].includes(status);
      const cSites = c.websiteIds !== undefined ? c.websiteIds : c.data?.websiteIds;

      if (!isPub || !isActive) {
        explicitlyHiddenCats.add(catId);
        continue;
      }

      if (Array.isArray(cSites) && cSites.length > 0) {
        if (isSiteVisible(cSites, org)) {
          explicitlyVisibleCats.add(catId);
        } else {
          explicitlyHiddenCats.add(catId);
        }
      }
    }

    // 2. Fetch products across all organizations
    const prods = await db.collection("products").find({}).toArray();

    const visibleProducts = [];
    const seenSlugs = new Set();

    for (const p of prods) {
      if (!p) continue;
      if (p.isPublished === false || p.data?.isPublished === false) continue;
      const status = String(p.status || p.data?.status || "active").toLowerCase().trim();
      if (["inactive", "hidden", "draft", "deleted"].includes(status)) continue;

      const org = p.organizationId || p.data?.organizationId || p.data?.companyId || "";
      const pSites = p.websiteIds !== undefined ? p.websiteIds : p.data?.websiteIds;
      if (!isSiteVisible(pSites, org)) continue;

      const catId = (p.categoryId || p.data?.categoryId || "").toLowerCase();
      // If the parent category was explicitly set and hidden on centralbiomedicalsin, skip product
      if (catId && explicitlyHiddenCats.has(catId) && !explicitlyVisibleCats.has(catId)) {
        continue;
      }

      const d = p.data || {};
      const title = String(p.title || d.title || d.name || p.name || "").trim();
      if (!title) continue;
      const slug = p.slug || d.slug || makeSlug(title);
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      const catName = d.category || p.category || catNameMap.get(catId) || catId;
      const image = p.image || d.image || (Array.isArray(p.images) && p.images[0]) || (Array.isArray(d.images) && d.images[0]) || "";
      const images = Array.isArray(p.images) && p.images.length ? p.images : (Array.isArray(d.images) && d.images.length ? d.images : (image ? [image] : []));

      visibleProducts.push({
        ...d,
        ...p,
        id: p.productId || d.id || d.productId || slug,
        productId: p.productId || d.productId || slug,
        categoryProductId: d.categoryProductId || p.categoryProductId || "",
        title,
        name: title,
        slug,
        category: catName,
        categoryId: catId,
        subCategory: d.subCategory || d.subcategory || p.subCategory || "General",
        subcategoryId: p.subcategoryId || d.subcategoryId || "general",
        description: d.description || d.desc || p.desc || p.description || "",
        desc: d.desc || d.description || p.desc || "",
        price: p.price || d.price || "",
        image,
        images,
        brand: d.brand || p.brand || "",
        model: d.model || p.model || "",
        availability: d.availability || p.availability || "In Stock",
        isPublished: true,
        websiteIds: pSites || ["centralbiomedicalsin"],
      });
    }

    const categoryNames = ["All Categories", ...new Set(visibleProducts.map((p) => p.category).filter(Boolean))];

    const result = {
      success: true,
      websiteId: "centralbiomedicalsin",
      categories: categoryNames,
      products: visibleProducts,
      totalCount: visibleProducts.length,
      timestamp: Date.now(),
    };

    serverCacheData = result;
    serverCacheTime = Date.now();

    // Asynchronously keep dynamic-catalog.json snapshot updated in the background
    try {
      const snapPath = path.join(process.cwd(), "src", "data", "dynamic-catalog.json");
      fs.promises.writeFile(snapPath, JSON.stringify(result)).catch(() => {});
    } catch {
      // ignore
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
        "Surrogate-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[centralbiomedicalsin /api/catalog] MongoDB error:", err);

    // Fallback to in-memory server cache or snapshot so user never experiences an error
    if (serverCacheData) {
      return NextResponse.json(serverCacheData, { status: 200 });
    }

    try {
      const snapPath = path.join(process.cwd(), "src", "data", "dynamic-catalog.json");
      const diskData = JSON.parse(await fs.promises.readFile(snapPath, "utf-8"));
      if (diskData && Array.isArray(diskData.products) && diskData.products.length > 0) {
        return NextResponse.json(diskData, { status: 200 });
      }
    } catch {
      // ignore
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
          Pragma: "no-cache",
        },
      }
    );
  }
}
