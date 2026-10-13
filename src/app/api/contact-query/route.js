import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

async function saveToLocalBackup(queryDoc) {
  try {
    const backupDir = path.join(process.cwd(), "src", "data");
    const backupPath = path.join(backupDir, "queries-backup.json");
    let existing = [];
    try {
      if (fs.existsSync(backupPath)) {
        const raw = await fs.promises.readFile(backupPath, "utf-8");
        existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      }
    } catch {
      existing = [];
    }
    existing.push(queryDoc);
    if (existing.length > 500) existing = existing.slice(-500);
    await fs.promises.writeFile(backupPath, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.warn("[contact-query] Backup write warning:", err?.message || err);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const websiteId = body.websiteId || "centralbiomedicalsin";
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 9);
    const queryId = `contact_${timestamp}_${rand}`;
    const docId = `${websiteId}_${queryId}`;

    const queryDoc = {
      _id: docId,
      queryId,
      websiteId,
      type: "contact",
      name: body.name || "",
      email: body.email || "",
      phone: body.phone || "",
      message: body.message || "",
      status: "unread",
      createdAt: new Date(),
      data: {
        id: queryId,
        name: body.name || "",
        email: body.email || "",
        phone: body.phone || "",
        subject: body.subject || "General Inquiry",
        message: body.message || "",
        city: body.city || "",
        district: body.district || "",
        websiteId,
        createdAt: {
          __sqliteType: "timestamp",
          value: new Date().toISOString(),
          seconds: Math.floor(timestamp / 1000),
          nanoseconds: 0,
        },
        timestamp,
      },
    };

    // 1. Immediately persist to local disk backup (instant 1ms)
    await saveToLocalBackup(queryDoc);

    // 2. Asynchronously save to MongoDB in background without blocking client response
    setTimeout(async () => {
      try {
        const db = await getDb();
        await db.collection("queries").insertOne(queryDoc);
      } catch (dbErr) {
        console.warn("[contact-query] Background MongoDB insert warning:", dbErr?.message || dbErr);
      }
    }, 0);

    // 3. Return immediate success response to the client
    return NextResponse.json({
      success: true,
      ok: true,
      id: queryId,
      message: "Your inquiry has been submitted successfully.",
    });
  } catch (e) {
    console.error("[contact-query] Error:", e);
    return NextResponse.json(
      { success: false, error: e.message || "Failed to submit query" },
      { status: 500 }
    );
  }
}
