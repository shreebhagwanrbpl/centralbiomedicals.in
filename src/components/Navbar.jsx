"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "items", "contact", "products"];

  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path}`;
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Products", path: "/items" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path) => {
    const fullPath = makeLink(path);
    if (path === "/") {
      return pathname === "/" || pathname === `/${district}`;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#d0e2f2] bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="container-custom flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href={makeLink("/")} className="relative block h-14 w-48 shrink-0 transition-transform hover:scale-105">
          <Image
            src="/logo.png"
            alt="Central Biomedicals"
            fill
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                href={makeLink(link.path)}
                className={`relative py-1 text-sm transition-all duration-300 ${
                  active
                    ? "font-bold text-[#245d8e]"
                    : "font-semibold text-[#18344b] hover:text-[#245d8e]"
                } after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:transition-all after:duration-300 ${
                  active ? "after:w-full after:bg-[#245d8e]" : "after:w-0 after:bg-[#245d8e] hover:after:w-full"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Button */}
        <div className="hidden lg:block">
          <Link href={makeLink("/contact")}>
            <button className="rounded-xl bg-[#245d8e] px-6 py-3 text-sm font-bold !text-white text-white shadow-md shadow-[#245d8e]/20 transition-all duration-300 hover:bg-[#183e60] hover:shadow-lg hover:-translate-y-0.5">
              Get Price Quote
            </button>
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Navigation Menu"
          className="rounded-xl border border-[#d0e2f2] bg-[#f0f6fb] p-2.5 transition-all duration-300 hover:bg-[#e9f3fa] lg:hidden"
        >
          {menuOpen ? (
            <X size={24} className="text-[#245d8e]" />
          ) : (
            <Menu size={24} className="text-[#245d8e]" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`overflow-hidden transition-all duration-300 lg:hidden ${
          menuOpen ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-[#d0e2f2] bg-white px-6 py-6 shadow-xl">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  href={makeLink(link.path)}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                    active
                      ? "bg-[#e9f3fa] font-bold text-[#245d8e]"
                      : "font-semibold text-[#18344b] hover:bg-[#f0f6fb] hover:text-[#245d8e]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            <Link
              href={makeLink("/contact")}
              onClick={() => setMenuOpen(false)}
              className="mt-2"
            >
              <button className="w-full rounded-xl bg-[#245d8e] py-3.5 text-sm font-bold !text-white text-white shadow-md transition-all duration-300 hover:bg-[#183e60]">
                Get Price Quote
              </button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}