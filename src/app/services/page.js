"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "@/lib/client-api";
import { db } from "@/lib/client-api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ServiceCard from "@/components/ServiceCard";
import {
  Microscope,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  Wrench,
  Activity,
  Award,
  Zap,
  CheckCircle2,
  PhoneCall,
  FileCheck,
  Cpu,
  Info,
} from "lucide-react";

import { fallbackServices } from "@/data/servicesData";

const workflowSteps = [
  {
    step: "01",
    title: "Diagnostic Audit & Consultation",
    desc: "We analyze your hospital sample load, space constraints, and technical requirements to select the exact analyzer configuration.",
    icon: FileCheck,
  },
  {
    step: "02",
    title: "Precision Solution Engineering",
    desc: "Custom lab layout designs, power backup specifications, and reagent supply schedule formulation.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Installation & NABL Calibration",
    desc: "Certified engineers perform physical installation, IQ/OQ/PQ protocols, and NABL-traceable reference calibration.",
    icon: Award,
  },
  {
    step: "04",
    title: "24/7 SLA Field Maintenance",
    desc: "Round-the-clock technical emergency support, scheduled preventive maintenance visits, and automated reagent restocking.",
    icon: Zap,
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [contactInfo, setContactInfo] = useState([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const pathParts = pathname.split("/").filter(Boolean);
  const staticRoutes = ["about", "services", "products", "contact", "items"];
  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : "";

  const makeLink = (path) => {
    if (!district) return path;
    if (path === "/") return `/${district}`;
    return `/${district}${path}`;
  };

  const icons = [
    <Microscope size={28} key={1} />,
    <FlaskConical size={28} key={2} />,
    <ShieldCheck size={28} key={3} />,
    <Stethoscope size={28} key={4} />,
    <Wrench size={28} key={5} />,
    <Activity size={28} key={6} />,
  ];

  useEffect(() => {
    const fetchServicesAndContact = async () => {
      try {
        const [servicesSnap, contactSnap] = await Promise.all([
          getDoc(doc(db, "websites", "centralbiomedicalsin", "pages", "services")),
          getDoc(doc(db, "websites", "centralbiomedicalsin", "pages", "contact")),
        ]);

        if (servicesSnap.exists() && servicesSnap.data().services?.length > 0) {
          const dbServices = servicesSnap
            .data()
            .services.filter((s) => (s.title && s.title.trim()) || (s.desc && s.desc.trim()))
            .map((s, idx) => ({
              id: s.id || idx,
              title: s.title || "",
              desc: s.desc || "",
              badge: s.badge || "Clinical Service",
              turnaround: s.turnaround || "",
              highlights: s.highlights || [],
            }));
          setServices(dbServices.length > 0 ? dbServices : fallbackServices);
        } else {
          setServices(fallbackServices);
        }

        if (contactSnap.exists()) {
          setContactInfo(contactSnap.data().contactInfo || []);
        }
      } catch (error) {
        console.warn("Could not load dynamic services, using fallback:", error?.message || error);
        setServices(fallbackServices);
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndContact();
  }, []);

  // Dynamically extract emergency helpline phone number
  const emergencyPhone = (() => {
    const item = contactInfo.find((c) => {
      const l = (c?.label || "").toLowerCase();
      return (
        l.includes("phone") ||
        l.includes("mobile") ||
        l.includes("helpline") ||
        l.includes("emergency") ||
        l.includes("tel") ||
        l.includes("contact")
      );
    });
    if (!item) return "";
    if (Array.isArray(item.value)) return item.value[0] || "";
    return typeof item.value === "string" ? item.value.trim() : "";
  })();

  return (
    <div className="bg-[#f8fafc] text-[#18344b]">
      {/* Banner */}
      <PageBanner
        badge="Technical Services"
        title="Biomedical Support From Setup to Service"
        subtitle="NABL-certified calibration, 2-hour emergency repair SLAs, cold-chain reagent distribution, and turnkey pathology setup."
      />

      {/* Services Grid Section */}
      <section className="section-padding bg-gradient-to-b from-white via-[#f0f6fb] to-white">
        <div className="container-custom">


          {loading ? (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-3xl border border-[#d0e2f2] bg-white p-8 animate-pulse shadow-sm"
                />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="mt-16 text-center rounded-3xl border border-[#d0e2f2] bg-white p-12 shadow-sm max-w-xl mx-auto">
              <Info size={40} className="mx-auto text-[#245d8e] mb-3" />
              <h3 className="text-xl font-bold text-[#18344b]">No Services Found</h3>
              <p className="mt-2 text-sm text-[#536e84]">
                Services configured in the administration panel will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id || index}
                  icon={icons[index % icons.length]}
                  title={service.title}
                  description={service.desc}
                  badge={service.badge}
                  turnaround={service.turnaround}
                  highlights={service.highlights}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Workflow Process Section */}
      <section className="section-padding bg-white border-y border-[#d0e2f2]">
        <div className="container-custom">
          <SectionTitle
            badge="Execution Framework"
            title="Our 4-Step Engineering Workflow"
            description="A systematic process ensuring seamless integration, rapid compliance, and long-term instrument reliability."
            center
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[#d0e2f2] bg-[#f0f6fb]/60 p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-[#245d8e] hover:shadow-xl hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-4xl font-black text-[#245d8e]/30 group-hover:text-[#245d8e] transition-colors">
                        {step.step}
                      </span>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#d0e2f2] text-[#245d8e] shadow-sm">
                        <Icon size={24} />
                      </div>
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-[#18344b] group-hover:text-[#245d8e] transition-colors">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-[#536e84]">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#d0e2f2]">
                    <span className="text-xs font-bold text-[#245d8e]">Phase {index + 1} Milestone</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Breakdown SLA Box */}
      <section className="section-padding bg-gradient-to-b from-[#f0f6fb] via-white to-[#f0f6fb]">
        <div className="container-custom">
          <div className="rounded-3xl border border-[#d0e2f2] bg-gradient-to-r from-[#18344b] to-[#245d8e] p-8 sm:p-12 text-white shadow-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider border border-white/20">
                  <Zap size={14} className="text-[#a4cdec]" /> Emergency Breakdown Helpline
                </span>

                <h3 className="mt-4 text-3xl font-black !text-white sm:text-4xl">
                  Facing an Equipment Emergency in ICU or Lab?
                </h3>

                <p className="mt-3 text-base !text-[#d0e2f2] leading-relaxed">
                  Our certified field engineers are equipped with OEM diagnostic kits and genuine spare parts for instant on-site restoration.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-6 text-sm font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#a4cdec]" />
                    <span>2-Hour On-Site SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#a4cdec]" />
                    <span>Loaner Analyzer Option</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#a4cdec]" />
                    <span>NABL Re-calibration Included</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-white/20 pt-6 lg:pt-0 lg:pl-8">
                <p className="text-xs font-bold uppercase tracking-wider !text-[#d0e2f2]">Emergency Dispatch</p>
                {emergencyPhone ? (
                  <a
                    href={`tel:${emergencyPhone.replace(/\s+/g, "")}`}
                    className="mt-2 text-2xl font-black text-white hover:text-[#a4cdec] transition-colors inline-block"
                  >
                    {emergencyPhone}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-[#d0e2f2]">24/7 Field Dispatch Active</p>
                )}
                <Link
                  href={makeLink("/contact")}
                  className="mt-5 w-full rounded-2xl bg-white py-3.5 text-center text-sm font-bold !text-[#18344b] shadow-lg transition-all hover:bg-[#e9f3fa]"
                >
                  Book Priority Repair
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}