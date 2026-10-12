"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight, Microscope } from "lucide-react";
import { makeSlug } from "@/data/productsData";

export default function ProductCard({
  product,
  makeLink = (p) => p,
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    id,
    title,
    category,
    subCategory,
    description,
    desc,
    specs = {},
    badge,
    status,
    availability,
    image,
    slug,
    brand,
    model,
    throughput,
    capacity,
    instrument,
    automation,
    usage,
    price,
  } = product;

  const productSlug = slug || makeSlug(title);
  const pdpLink = makeLink(`/items/${productSlug}`);
  const displayDesc = desc || description || "";

  const hasValidImage =
    image &&
    typeof image === "string" &&
    image.trim() !== "" &&
    image !== "/logo.png" &&
    !imgError;

  // Extract exactly 2-3 genuine dynamic specs that exist on the product from Admin
  const dynamicSpecs = [];
  if (brand && String(brand).trim() && String(brand).trim() !== "N/A") {
    dynamicSpecs.push(["Brand", String(brand).trim()]);
  }
  if (model && String(model).trim() && String(model).trim() !== "N/A") {
    dynamicSpecs.push(["Model", String(model).trim()]);
  }
  if (throughput && String(throughput).trim() && String(throughput).trim() !== "N/A") {
    dynamicSpecs.push(["Throughput", String(throughput).trim()]);
  } else if (capacity && String(capacity).trim() && String(capacity).trim() !== "N/A") {
    dynamicSpecs.push(["Capacity", String(capacity).trim()]);
  } else if (instrument && String(instrument).trim() && String(instrument).trim() !== "N/A") {
    dynamicSpecs.push(["Instrument", String(instrument).trim()]);
  } else if (automation && String(automation).trim() && String(automation).trim() !== "N/A") {
    dynamicSpecs.push(["Automation", String(automation).trim()]);
  } else if (usage && String(usage).trim() && String(usage).trim() !== "N/A") {
    dynamicSpecs.push(["Usage", String(usage).trim()]);
  }

  // If we have less than 2, pull from custom specs object if provided
  if (dynamicSpecs.length < 2 && specs && typeof specs === "object") {
    Object.entries(specs).forEach(([k, v]) => {
      if (
        dynamicSpecs.length < 3 &&
        v &&
        String(v).trim() &&
        String(v).trim() !== "N/A" &&
        !dynamicSpecs.some(([ek]) => ek.toLowerCase() === k.toLowerCase())
      ) {
        dynamicSpecs.push([k, String(v).trim()]);
      }
    });
  }

  const displayStatus = status || availability || "In Stock";

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-[#d0e2f2] bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#245d8e]/50 hover:shadow-xl hover:shadow-[#245d8e]/12">
      <div>
        {/* Image Container Link */}
        <Link
          href={pdpLink}
          className="relative block h-60 w-full overflow-hidden bg-gradient-to-b from-[#f0f6fb] to-white p-4 border-b border-[#d0e2f2]/60"
        >
          {hasValidImage ? (
              <Image
                src={image}
                alt={title || "Biomedical Equipment"}
                fill
                loading="eager"
                unoptimized
                onError={() => setImgError(true)}
                className="object-contain p-2 transition-all duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
          ) : (
            /* Premium Medical Instrument Placeholder */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#f0f6fb] via-white to-[#e9f3fa] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-md border border-[#d0e2f2] text-[#245d8e] transition-transform duration-300 group-hover:scale-110">
                <Microscope size={32} />
              </div>
              <span className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#18344b]">
                {category || "Diagnostic Equipment"}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-[#536e84]">
                Certified Specification
              </span>
            </div>
          )}

          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
            {badge ? (
              <span className="rounded-full border border-[#4f8fc2]/40 bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-[#245d8e] shadow-sm">
                {badge}
              </span>
            ) : (
              <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-bold text-[#18344b] shadow-sm truncate max-w-[150px]">
                {subCategory || category}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-[#245d8e] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm shrink-0">
              <ShieldCheck size={12} />
              {displayStatus}
            </span>
          </div>
        </Link>

        {/* Details */}
        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#245d8e] truncate">
              {subCategory && subCategory !== category ? `${category} • ${subCategory}` : category}
            </span>
          </div>

          <Link href={pdpLink} className="block mt-1.5">
            <h3 className="text-xl font-bold text-[#18344b] leading-tight group-hover:text-[#245d8e] transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>

          {displayDesc && (
            <p className="mt-2.5 text-sm text-[#536e84] line-clamp-2 leading-relaxed">
              {displayDesc}
            </p>
          )}

          {/* Key Dynamic Specs (Screenshot Specs Box) */}
          {dynamicSpecs.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#d0e2f2] bg-[#e9f3fa] p-3.5 space-y-1.5 text-xs text-[#536e84]">
              {dynamicSpecs.slice(0, 3).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center gap-2">
                  <span className="font-bold text-[#18344b]">{key}:</span>
                  <span className="text-[#245d8e] font-semibold truncate max-w-[170px]">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-6 pt-0 mt-2 flex items-center gap-3">
        <Link
          href={pdpLink}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#245d8e] py-3 text-center text-sm font-bold !text-white shadow-md transition-all hover:bg-[#183e60] hover:shadow-lg group/btn"
        >
          <span className="!text-white text-white font-bold text-sm tracking-wide">
            Inquire Price & Specs
          </span>
          <ArrowRight size={16} className="!text-white text-white shrink-0 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
