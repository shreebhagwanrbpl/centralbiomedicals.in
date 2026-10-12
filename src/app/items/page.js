"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageBanner from "@/components/PageBanner";
import ProductCard from "@/components/ProductCard";
import { fetchAllDynamicProducts, normalizeProduct, getInitialProductsSync } from "@/lib/fetchProducts";
import { subscribeToCatalog } from "@/lib/client-api";
import { Search, X, Filter, Package, ShieldCheck, ArrowRight, Loader2, PhoneCall } from "lucide-react";

function ProductsContent({ city }) {
  const [products, setProducts] = useState(getInitialProductsSync);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlCategory = searchParams ? (searchParams.get("category") || searchParams.get("cat")) : null;

  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "items", "contact", "products"];
  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : null;

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const handleResetFilters = () => {
    setSelectedCategory("All Categories");
    setSearchQuery("");
  };

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const fetched = await fetchAllDynamicProducts();
        if (isMounted && Array.isArray(fetched) && fetched.length > 0) {
          setProducts(fetched);
        }
      } catch (err) {
        console.warn("[items] Error syncing products:", err?.message || err);
      }
    };

    loadProducts();

    const unsubscribe = subscribeToCatalog((updatedCatalog) => {
      if (isMounted && Array.isArray(updatedCatalog)) {
        const normalized = updatedCatalog
          .map((item) => normalizeProduct(item))
          .filter(Boolean);
        setProducts(normalized);
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const categoriesList = useMemo(() => {
    const setCat = new Set(["All Categories"]);
    products.forEach((p) => {
      if (p.category && String(p.category).trim()) {
        setCat.add(String(p.category).trim());
      }
    });
    return Array.from(setCat);
  }, [products]);

  // Sync category from URL search params when changed
  useEffect(() => {
    if (urlCategory && typeof urlCategory === "string" && urlCategory.trim()) {
      setSelectedCategory(decodeURIComponent(urlCategory.trim()));
    }
  }, [urlCategory]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const catLower = selectedCategory.toLowerCase().trim();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All Categories" ||
        (product.category && product.category.toLowerCase().trim() === catLower) ||
        (product.subCategory && product.subCategory.toLowerCase().trim() === catLower);

      const matchesQuery =
        !q ||
        (product.title && product.title.toLowerCase().includes(q)) ||
        (product.description && product.description.toLowerCase().includes(q)) ||
        (product.category && product.category.toLowerCase().includes(q)) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.model && product.model.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="bg-[#f8fafc] text-[#18344b]">
      {/* Banner */}
      <PageBanner
        badge="Product Inventory"
        title={city ? `Diagnostic Equipment Collection in ${city}` : "Diagnostic Equipment Collection"}
        subtitle="Explore our certified catalog of clinical chemistry analyzers, hematology counters, PCR systems, patient monitors, and laboratory consumables."
      />

      {/* Main Catalog Section */}
      <section className="section-padding bg-gradient-to-b from-white via-[#f0f6fb] to-white">
        <div className="container-custom">
          {/* Controls Bar - Sticky directly below Navbar */}
          <div className="sticky top-20 z-40 rounded-2xl sm:rounded-3xl border border-[#d0e2f2] bg-white/95 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-black/5 transition-all">
            <div className="grid gap-4 md:grid-cols-12 items-center">
              {/* Search Box */}
              <div className="md:col-span-5 relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#245d8e]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by equipment name, model, or parameter..."
                  className="w-full rounded-xl border border-[#d0e2f2] bg-[#f0f6fb]/60 pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-[#18344b] transition-all focus:border-[#245d8e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#245d8e]/20 placeholder:text-[#536e84]/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#536e84] hover:text-[#245d8e]"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="md:col-span-7 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <Filter size={16} className="text-[#245d8e] shrink-0 mr-1" />
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      selectedCategory.toLowerCase().trim() === cat.toLowerCase().trim()
                        ? "bg-[#245d8e] !text-white shadow-md shadow-[#245d8e]/30"
                        : "bg-[#f0f6fb] border border-[#d0e2f2] text-[#536e84] hover:bg-[#e9f3fa] hover:text-[#18344b]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count & Clear Button */}
            <div className="mt-3 flex items-center justify-between border-t border-[#d0e2f2]/60 pt-3 text-xs font-semibold text-[#536e84]">
              <span>
                Showing <strong className="text-[#245d8e] font-bold">{filteredProducts.length}</strong> of {products.length} instruments
                {selectedCategory !== "All Categories" && (
                  <span className="ml-1 text-[#245d8e]">in &ldquo;{selectedCategory}&rdquo;</span>
                )}
              </span>

              {(selectedCategory !== "All Categories" || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[#245d8e] font-bold hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          </div>

          {/* Grid of Products / Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="mt-16 text-center rounded-3xl border border-[#d0e2f2] bg-white p-8 sm:p-14 shadow-sm max-w-2xl mx-auto">
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-[#245d8e]/10 animate-ping" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[#18344b] to-[#245d8e] text-white shadow-xl shadow-[#245d8e]/20">
                  <Package size={36} className="text-[#d0e2f2] animate-pulse" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#d0e2f2] bg-[#f0f6fb] px-4 py-1.5 text-xs font-bold text-[#245d8e] mb-4 shadow-sm">
                <Loader2 size={14} className="animate-spin text-[#245d8e]" />
                <span className="uppercase tracking-wider">Catalog Updating • Synchronizing Inventory</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-[#18344b]">
                Products Coming Soon
              </h3>

              <p className="mt-3 text-sm sm:text-base text-[#536e84] leading-relaxed max-w-lg mx-auto">
                We are actively updating our diagnostics and medical equipment inventory. For current pricing, product availability, or custom hospital tenders, please contact our technical sales team directly.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={makeLink("/contact")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#245d8e] to-[#18344b] px-8 py-4 text-sm sm:text-base font-bold !text-white shadow-lg shadow-[#245d8e]/30 hover:shadow-xl hover:from-[#1c4a73] hover:to-[#12283a] transition-all duration-300 hover:scale-105"
                >
                  <PhoneCall size={18} className="text-[#a4cdec]" />
                  <span>Contact Sales & Request Catalog</span>
                  <ArrowRight size={18} className="text-white" />
                </Link>

                {(selectedCategory !== "All Categories" || searchQuery) && (
                  <button
                    onClick={handleResetFilters}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d0e2f2] bg-[#f0f6fb] px-6 py-4 text-sm font-bold text-[#245d8e] hover:bg-[#e9f3fa] transition-all"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                  makeLink={makeLink}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bulk Procurement Banner */}
      <section className="section-padding bg-white border-t border-[#d0e2f2]">
        <div className="container-custom">
          <div className="rounded-3xl border border-[#d0e2f2] bg-gradient-to-r from-[#18344b] to-[#245d8e] p-8 sm:p-12 shadow-lg text-white">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-[#a4cdec]" /> Bulk Hospital Orders & Tenders
                </span>

                <h3 className="mt-4 text-3xl font-black text-white">
                  Procuring Equipment for New Hospital Blocks or Diagnostics Chains?
                </h3>

                <p className="mt-3 text-base text-[#d0e2f2] leading-relaxed">
                  We offer institutional discounts, customized equipment leasing plans, and complete turnkey lab setup packages with extended AMC warranties.
                </p>
              </div>

              <div className="lg:col-span-4 flex items-center justify-end">
                <a
                  href={makeLink("/contact")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold !text-[#18344b] shadow-lg transition-all hover:bg-[#e9f3fa]"
                >
                  <span>Request Bulk Tender Quote</span>
                  <ArrowRight size={18} className="text-[#18344b]" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProductsPage({ city }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center bg-[#f8fafc]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#245d8e]" />
            <p className="text-sm font-bold text-[#18344b]">Loading Medical Equipment Catalog...</p>
          </div>
        </div>
      }
    >
      <ProductsContent city={city} />
    </Suspense>
  );
}
