export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "react-hot-toast";

export const metadata = {
  metadataBase: new URL(
    "https://centralbiomedicals.in"
  ),

  title:
    "Raj Biosis | Biomedical & Diagnostic Equipment",

  description:
    "Raj Biosis Private Limited (Raj Biomedical) supplies CBC Machines, Hematology Analyzers, Biochemistry Analyzers, ELISA Readers and laboratory equipment across India.",

  keywords: [
    "Biomedical Equipment Supplier",
    "Laboratory Equipment Supplier",
    "CBC Machine Supplier",
    "Hematology Analyzer Supplier",
    "Biochemistry Analyzer Supplier",
    "Diagnostic Equipment Supplier",
    "Medical Equipment Supplier India",
    "Raj Biosis",
    "Raj Biomedical",
  ],

  openGraph: {
    title:
      "Raj Biosis | Biomedical & Diagnostic Equipment",

    description:
      "Crisp blue utility styling with strong hierarchy for practical equipment buying journeys.",

    url: "https://centralbiomedicals.in",

    siteName: "Raj Biosis Private Limited",

    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Raj Biosis Private Limited",
      },
    ],

    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",

    title:
      "Raj Biosis | Biomedical & Diagnostic Equipment",

    description:
      "Crisp blue utility styling with strong hierarchy for practical equipment buying journeys.",

    images: ["/logo.png"],
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  alternates: {
    canonical: "https://centralbiomedicals.in",
  },
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased variant-22" data-ui-variant="denim" suppressHydrationWarning>
        <Navbar />

        <main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
            }}
          />

          {children}
        </main>

        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}
