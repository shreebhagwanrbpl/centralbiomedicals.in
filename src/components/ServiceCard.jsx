import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-[#d0e2f2] bg-white p-8 shadow-sm">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-[#e9f3fa]" />
        <div className="mb-4 h-7 w-3/4 rounded bg-[#d0e2f2]" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-[#e9f3fa]" />
          <div className="h-4 w-11/12 rounded bg-[#e9f3fa]" />
          <div className="h-4 w-8/12 rounded bg-[#e9f3fa]" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#d0e2f2] bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#245d8e]/50 hover:shadow-xl hover:shadow-[#245d8e]/12">
      <div>
        {/* Top bar with Icon & Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e9f3fa] text-[#245d8e] transition-all duration-300 group-hover:bg-[#245d8e] group-hover:text-white group-hover:scale-105 shadow-sm border border-[#d0e2f2]/60 [&>svg]:transition-colors [&>svg]:duration-300">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-[#4f8fc2]/30 bg-[#e9f3fa] px-3 py-1 text-xs font-bold text-[#245d8e]">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-2xl font-bold text-[#18344b] transition-colors duration-300 group-hover:text-[#245d8e]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base leading-relaxed text-[#536e84]">
          {description}
        </p>

        {/* Highlights List if present */}
        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-[#d0e2f2]/60 pt-5 text-sm text-[#536e84]">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#245d8e] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-8 flex items-center justify-between border-t border-[#d0e2f2]/60 pt-4">
        {turnaround ? (
          <span className="text-xs font-semibold text-[#536e84]">
            SLA: <strong className="text-[#245d8e]">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#536e84]">Certified Quality</span>
        )}

        <Link
          href={makeLink("/contact")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#245d8e] transition-all group-hover:translate-x-1 group-hover:text-[#183e60]"
        >
          <span>Book Service</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}