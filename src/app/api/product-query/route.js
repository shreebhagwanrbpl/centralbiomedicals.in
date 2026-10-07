import { NextResponse } from "next/server";
import { postAdminQuery } from "@/lib/admin-api";
export async function POST(req){try{const body=await req.json(); const data=await postAdminQuery("/api/product-query",body); return NextResponse.json(data)}catch(e){return NextResponse.json({success:false,error:e.message},{status:502})}}
