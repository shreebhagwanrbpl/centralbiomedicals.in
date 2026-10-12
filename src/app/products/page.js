"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  ShieldCheck,
  Truck,
  BadgeCheck,
  PackageCheck,
  ChevronDown,
  ChevronRight,
  Package,
  PhoneCall,
  Loader2,
  ArrowRight,
} from "lucide-react";

import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import { fetchAllDynamicProducts, normalizeProduct, getInitialProductsSync } from "@/lib/fetchProducts";
import { subscribeToCatalog } from "@/lib/client-api";

export default function ProductsPage() {
  const [products, setProducts] = useState(getInitialProductsSync);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [openedCategory, setOpenedCategory] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        const fetched = await fetchAllDynamicProducts();
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setProducts(fetched);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadProducts();

    const unsubscribe = subscribeToCatalog((updatedCatalog) => {
      if (isMounted && Array.isArray(updatedCatalog)) {
        const normalized = updatedCatalog
          .map((item) => normalizeProduct(item))
          .filter(Boolean);
        setProducts(normalized);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const text = `
        ${item.title || ""}
        ${item.brand || ""}
        ${item.category || ""}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [products, search]);

  const groupedProducts = useMemo(() => {
    const obj = {};

    filteredProducts.forEach((item) => {
      const cat = item.category || "Biomedical Equipment";
      if (!obj[cat]) {
        obj[cat] = [];
      }
      obj[cat].push(item);
    });

    return obj;
  }, [filteredProducts]);

  const categories = Object.keys(groupedProducts);

  const toggleCategory = (category) => {
    if (openedCategory === category) {
      setOpenedCategory("");
      return;
    }
    setOpenedCategory(category);
  };

  const scrollToProduct = (slug, category) => {
    setOpenedCategory(category);
    setActiveCategory(category);

    setTimeout(() => {
      const el = document.getElementById(slug);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 250);
  };

  return (
    <div className="bg-[#f8fafc] text-[#18344b]">
      <PageBanner
        title="Our Products"
        subtitle="Explore advanced biomedical and diagnostic equipment designed for modern healthcare excellence."
      />

      <section className="py-20 bg-gradient-to-b from-white via-[#f0f6fb] to-white">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle
            badge="Featured Products"
            title="Premium Biomedical Equipment"
            description="Explore our comprehensive range of high-quality biomedical and diagnostic equipment designed to deliver precision, reliability, and advanced healthcare solutions for hospitals, laboratories, clinics, and research centers across India."
            center
          />

          <div className="grid lg:grid-cols-[320px_1fr] gap-10 mt-16">
            {/* LEFT SIDEBAR */}
            <aside className="sticky top-28 h-fit rounded-[30px] border border-[#d0e2f2] bg-white p-6 shadow-xl shadow-slate-200/50">
              <div className="mb-6">
                <span className="inline-flex rounded-full bg-[#e9f3fa] px-4 py-1.5 text-xs font-bold text-[#245d8e]">
                  Browse
                </span>
                <h2 className="mt-3 text-2xl font-bold text-[#18344b]">
                  Categories
                </h2>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Search Products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full rounded-xl border border-[#d0e2f2] bg-[#f0f6fb] px-4 text-[#18344b] outline-none transition-all placeholder:text-[#536e84]/60 focus:border-[#245d8e] focus:bg-white focus:ring-4 focus:ring-[#245d8e]/10"
              />

              {/* Categories */}
              <div className="mt-6 space-y-3">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="overflow-hidden rounded-2xl border border-[#d0e2f2]"
                  >
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`flex w-full items-center justify-between px-5 py-4 font-semibold text-sm transition-all duration-300 ${
                        activeCategory === category
                          ? "bg-[#245d8e] text-white shadow-md shadow-[#245d8e]/20"
                          : "bg-white text-[#18344b] hover:bg-[#f0f6fb]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {openedCategory === category ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                        {category}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          activeCategory === category
                            ? "bg-white/20 text-white"
                            : "bg-[#e9f3fa] text-[#245d8e]"
                        }`}
                      >
                        {groupedProducts[category].length}
                      </span>
                    </button>

                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight:
                          openedCategory === category
                            ? groupedProducts[category].length * 48 + "px"
                            : "0px",
                      }}
                    >
                      {groupedProducts[category].map((item) => (
                        <button
                          key={item.slug}
                          onClick={() => scrollToProduct(item.slug, category)}
                          className="block w-full border-t border-[#d0e2f2] px-6 py-3 text-left text-xs font-semibold text-[#536e84] transition hover:bg-[#e9f3fa] hover:text-[#245d8e]"
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* RIGHT SIDE */}
            <div>
              {loading ? (
                <div className="space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-64 rounded-3xl border border-[#d0e2f2] bg-white p-6 animate-pulse"
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center rounded-3xl border border-[#d0e2f2] bg-white p-8 sm:p-14 shadow-sm max-w-2xl mx-auto">
                  {/* Animated pulsating loader & icon */}
                  <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-3xl bg-[#245d8e]/10 animate-ping" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#18344b] to-[#245d8e] text-white shadow-xl shadow-[#245d8e]/20">
                      <Package size={36} className="text-[#d0e2f2] animate-pulse" />
                    </div>
                  </div>

                  {/* Pulsing Loading Badge ("load hota rahe") */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#d0e2f2] bg-[#f0f6fb] px-4 py-1.5 text-xs font-bold text-[#245d8e] mb-4 shadow-sm">
                    <Loader2 size={14} className="animate-spin text-[#245d8e]" />
                    <span className="uppercase tracking-wider">Catalog Updating • Synchronizing Inventory</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-[#18344b]">
                    Products Coming Soon
                  </h3>

                  <p className="mt-3 text-sm sm:text-base text-[#536e84] leading-relaxed max-w-lg mx-auto">
                    We are currently expanding our biomedical diagnostic and laboratory equipment catalog. Contact our sales engineers directly for immediate quotations, tenders, and stock availability.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                      href="/contact"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#245d8e] to-[#18344b] px-8 py-4 text-sm sm:text-base font-bold !text-white shadow-lg shadow-[#245d8e]/30 hover:shadow-xl hover:from-[#1c4a73] hover:to-[#12283a] transition-all duration-300 hover:scale-105"
                    >
                      <PhoneCall size={18} className="text-[#a4cdec]" />
                      <span>Contact Sales & Inquire Directly</span>
                      <ArrowRight size={18} className="text-white" />
                    </Link>

                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d0e2f2] bg-[#f0f6fb] px-6 py-4 text-sm font-bold text-[#245d8e] hover:bg-[#e9f3fa] transition-all"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-16">
                  {Object.entries(groupedProducts).map(([category, list]) => (
                    <section
                      key={category}
                      id={category.replace(/\s+/g, "-").toLowerCase()}
                    >
                      {/* Category Header */}
                      <div className="mb-10 flex items-center justify-between border-b border-[#d0e2f2] pb-5">
                        <div>
                          <span className="rounded-full bg-[#e9f3fa] border border-[#d0e2f2] px-4 py-1.5 text-xs font-bold text-[#245d8e]">
                            Category
                          </span>
                          <h2 className="mt-3 text-3xl font-black text-[#18344b]">
                            {category}
                          </h2>
                        </div>

                        <div className="rounded-full border border-[#d0e2f2] bg-[#f0f6fb] px-5 py-2 text-xs font-bold text-[#245d8e]">
                          {list.length} Products
                        </div>
                      </div>

                      <div className="space-y-6">
                        {list.map((product) => (
                          <div
                            key={product.slug}
                            id={product.slug}
                            className="group rounded-[30px] border border-[#d0e2f2] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#245d8e] hover:shadow-xl"
                          >
                            <div className="grid items-center gap-6 lg:grid-cols-[220px_1fr_180px]">
                              {/* Image */}
                              <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-2xl border border-[#d0e2f2] bg-[#f0f6fb] p-4">
                                {product.image && product.image !== "/logo.png" ? (
                                  <Image
                                    src={product.image}
                                    alt={product.title}
                                    width={200}
                                    height={200}
                                    loading="eager"
                                    unoptimized
                                    className="max-h-[160px] object-contain transition duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="text-center text-[#245d8e]">
                                    <Package size={36} className="mx-auto mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider">{product.category || "Analyzer"}</span>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div>
                                <h3 className="text-xl font-bold text-[#18344b]">
                                  {product.title}
                                </h3>

                                <p className="mt-2 text-sm leading-relaxed text-[#536e84]">
                                  {product.desc || product.description || "High precision diagnostic instrument engineered for clinical accuracy."}
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                  {product.brand && (
                                    <div className="rounded-xl border border-[#d0e2f2] bg-[#f0f6fb] p-3">
                                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#245d8e]">
                                        Brand
                                      </p>
                                      <p className="mt-0.5 text-xs font-bold text-[#18344b]">
                                        {product.brand}
                                      </p>
                                    </div>
                                  )}

                                  {product.model && (
                                    <div className="rounded-xl border border-[#d0e2f2] bg-[#f0f6fb] p-3">
                                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#245d8e]">
                                        Model
                                      </p>
                                      <p className="mt-0.5 text-xs font-bold text-[#18344b]">
                                        {product.model}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Button */}
                              <div className="flex justify-center lg:justify-end">
                                <Link
                                  href={`/items/${product.slug}`}
                                  className="w-full lg:w-auto"
                                >
                                  <button className="w-full rounded-xl bg-[#245d8e] px-6 py-3.5 text-xs font-bold text-white transition-all duration-300 hover:bg-[#1c4a73] hover:shadow-lg lg:w-auto">
                                    View Details →
                                  </button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 bg-white border-t border-[#d0e2f2]">
        <div className="max-w-7xl mx-auto px-5">
          <SectionTitle
            badge="Why Choose Our Products"
            title="Trusted Quality & Innovation"
            description="Every biomedical product is engineered with precision, tested for quality, and backed by reliable support to ensure exceptional performance in hospitals and laboratories."
            center
          />

          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck size={30} />,
                title: "Certified Quality",
                desc: "Every product undergoes strict quality testing to ensure safety, durability and reliable performance.",
              },
              {
                icon: <Truck size={30} />,
                title: "Fast Delivery",
                desc: "Quick and secure delivery across India with safe packaging and timely logistics support.",
              },
              {
                icon: <BadgeCheck size={30} />,
                title: "Trusted Support",
                desc: "Dedicated technical assistance and after-sales service whenever you need expert guidance.",
              },
              {
                icon: <PackageCheck size={30} />,
                title: "Premium Equipment",
                desc: "Advanced biomedical equipment designed for modern laboratories, hospitals and healthcare professionals.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group rounded-[30px] border border-[#d0e2f2] bg-[#f0f6fb]/60 p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#245d8e] hover:shadow-xl hover:bg-white"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-[#d0e2f2] text-[#245d8e] transition-all duration-300 group-hover:bg-[#245d8e] group-hover:text-white group-hover:border-[#245d8e]">
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-[#18344b]">
                  {item.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-[#536e84]">
                  {item.desc}
                </p>

                <div className="mx-auto mt-6 h-1 w-12 rounded-full bg-[#245d8e]/30 transition-all duration-300 group-hover:w-20 group-hover:bg-[#245d8e]"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
