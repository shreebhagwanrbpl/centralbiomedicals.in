"use client";

import { motion } from "framer-motion";

export default function PageBanner({ title, subtitle, badge = "Raj Biomedical" }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#f0f6fb] via-white to-[#e9f3fa] py-12 lg:py-16 border-b border-[#d0e2f2]">
      {/* Background Subtle Spheres & Mesh */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#245d8e]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#18344b]/10 blur-3xl" />

      {/* Grid Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(#245d8e0d_1px,transparent_1px),linear-gradient(90deg,#245d8e0d_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#4f8fc2]/30 bg-[#e9f3fa] px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-[#245d8e] shadow-sm backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#245d8e]" />
            {badge}
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-[#18344b] sm:text-4xl lg:text-5xl leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-[#536e84]">
              {subtitle}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}