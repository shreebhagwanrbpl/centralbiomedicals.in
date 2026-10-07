import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/admin-api";
export const dynamic="force-dynamic"; export const revalidate=0; export const fetchCache="force-no-store";
export async function GET(req) {
  const q = Object.fromEntries(req.nextUrl.searchParams.entries());
  try {
    const data = await adminFetch("/api/site-data", {}, q);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e.message || "Failed to fetch site data", data: null },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
