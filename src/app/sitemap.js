import { fetchCatalogFromAdmin } from "@/lib/admin-api";
import { fetchDistricts } from "@/lib/data-fetcher-server";
import { WEBSITE_ID, COMPANY_ID } from "@/lib/catalog-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap() {
  const baseUrl = "https://centralbiomedicals.in";
  const urls = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/services`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
    { url: `${baseUrl}/items`, lastModified: new Date() },
  ];
  try {
    const districts = await fetchDistricts({ companyId: COMPANY_ID, websiteId: WEBSITE_ID });
    const products = await fetchCatalogFromAdmin();
    for (const district of districts) {
      if (!district?.slug) continue;
      for (const page of ["", "/about", "/services", "/contact", "/items"]) urls.push({ url: `${baseUrl}/${district.slug}${page}`, lastModified: new Date() });
    }
    for (const product of products) {
      if (!product?.slug) continue;
      urls.push({ url: `${baseUrl}/items/${product.slug}`, lastModified: new Date() });
      for (const district of districts) if (district?.slug) urls.push({ url: `${baseUrl}/${district.slug}/items/${product.slug}`, lastModified: new Date() });
    }
  } catch (error) { console.error("Sitemap error:", error); }
  return urls;
}
