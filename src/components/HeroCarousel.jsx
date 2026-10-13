"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  PhoneCall,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { initialHomeData } from "@/data/siteData";

// High-quality local biomedical equipment slides
const FALLBACK_SLIDES = [
  {
    type: "image",
    url: "/images/hero/hero-lab.jpg",
    title: "Precision Medical Equipment & Diagnostic Solutions",
    subtitle:
      "Equipping hospitals, pathology centers, and clinical laboratories with top-tier automated analyzers, NABL-traceable calibration, and 24/7 rapid technical engineering support across India.",
  },
  {
    type: "image",
    url: "/images/hero/hero-icu.jpg",
    title: "Critical Care & Hospital ICU Biomedical Equipment",
    subtitle:
      "High-precision patient monitors, ventilators, and surgical systems delivering reliable clinical performance with ISO 13485 certified accuracy standards.",
  },
  {
    type: "image",
    url: "/images/hero/hero-imaging.jpg",
    title: "Advanced Radiology & Diagnostic Imaging Solutions",
    subtitle:
      "Modern diagnostic MRI, CT, and automated laboratory testing instruments with 24/7 SLA biomedical engineering and genuine OEM calibration support.",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
  loading = false,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const videoRefs = useRef({});

  // Parse media items from Firestore home data
  const parseMediaList = (data) => {
    if (!data) return [];
    const list = [];

    // 1. Check media array (preferred)
    if (Array.isArray(data.media) && data.media.length > 0) {
      data.media.forEach((item, idx) => {
        const url = typeof item === "string" ? item : item?.url;
        const type =
          item?.type ||
          (url?.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i) ? "video" : "image");
        if (url) {
          list.push({
            id: `media-${idx}`,
            type,
            url,
          });
        }
      });
    }

    // 2. Check images array
    if (list.length === 0 && Array.isArray(data.images) && data.images.length > 0) {
      data.images.forEach((url, idx) => {
        if (url) {
          list.push({
            id: `img-${idx}`,
            type: "image",
            url,
          });
        }
      });
    }

    // 3. Check single imageUrl / image
    if (list.length === 0 && (data.imageUrl || data.image)) {
      const singleImg = data.imageUrl || data.image;
      if (singleImg) {
        list.push({
          id: "single-img",
          type: "image",
          url: singleImg,
        });
      }
    }

    // 4. Check videos array
    if (Array.isArray(data.videos) && data.videos.length > 0) {
      data.videos.forEach((vUrl, idx) => {
        if (vUrl && !list.some((item) => item.url === vUrl)) {
          list.push({
            id: `vid-${idx}`,
            type: "video",
            url,
          });
        }
      });
    }

    // 5. Check single videoUrl
    if (data.videoUrl && !list.some((item) => item.url === data.videoUrl)) {
      list.push({
        id: "single-vid",
        type: "video",
        url: data.videoUrl,
      });
    }

    return list;
  };

  const dbSlides = parseMediaList(homeData);
  const slides = dbSlides.length > 0 ? dbSlides : FALLBACK_SLIDES;

  // Dynamic texts with immediate high-speed fallback
  const heroTitle =
    homeData?.title?.trim() ||
    (locationTitle
      ? `Leading Biomedical & Diagnostic Supplier in ${locationTitle}`
      : initialHomeData.title);

  const heroDescription =
    homeData?.description?.trim() || initialHomeData.description;

  const btn1Text =
    homeData?.button1Text?.trim() || initialHomeData.button1Text;
  const btn2Text =
    homeData?.button2Text?.trim() || initialHomeData.button2Text;

  const isLoading = loading && !heroTitle;

  // Static routes for buttons
  const btn1Href = makeLink("/items");
  const btn2Href = makeLink("/contact");

  // Auto-slide effect
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, currentSlide]);

  // Adjust active slide index safely if slides array length changes
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides.length, currentSlide]);

  // Play video on current slide
  useEffect(() => {
    const currentMedia = slides[currentSlide];
    if (currentMedia?.type === "video") {
      const vid = videoRefs.current[currentSlide];
      if (vid) {
        vid.currentTime = 0;
        vid.play().catch(() => { });
      }
    }
  }, [currentSlide, slides]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Touch swipe support for mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const activeMedia = slides[currentSlide] || slides[0];

  return (
    <section className="relative overflow-hidden bg-[#07131e] text-white">
      {/* Background Media Viewport - Full Width Edge-to-Edge Banner Images */}
      <div
        className="relative w-full h-[380px] sm:h-[440px] md:h-[480px] lg:h-[520px] overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            {activeMedia?.type === "video" ? (
              <video
                ref={(el) => (videoRefs.current[currentSlide] = el)}
                src={activeMedia.url}
                className="w-full h-full object-cover object-center opacity-100 brightness-[1.05]"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <img
                src={activeMedia?.url}
                alt={`Hero Slide ${currentSlide + 1}`}
                fetchPriority={currentSlide === 0 ? "high" : "auto"}
                loading={currentSlide === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover object-center opacity-100 brightness-[1.06] contrast-[1.06]"
                onError={(e) => {
                  e.target.src = FALLBACK_SLIDES[0].url;
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Crisp, Balanced Gradient Overlays - Optimized so text is 100% readable on left while all 3 products are visible on center/right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07131e]/95 via-[#07131e]/75 sm:via-[#07131e]/45 to-transparent/10 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131e]/70 via-transparent to-[#07131e]/20 z-10 pointer-events-none" />

        {/* Foreground Content Container */}
        <div className="container-custom relative z-20 h-full flex flex-col justify-center py-6 sm:py-8">
          <div className="max-w-2xl lg:max-w-3xl">
            {isLoading ? (
              <div className="space-y-4 pt-1 animate-pulse">
                {/* Skeleton Top Badge */}
                <div className="h-7 w-52 sm:w-72 rounded-full bg-white/20 backdrop-blur-md border border-white/20" />

                {/* Skeleton Main Heading */}
                <div className="space-y-3 pt-2">
                  <div className="h-8 sm:h-10 md:h-12 w-full max-w-xl rounded-2xl bg-white/25 backdrop-blur-md" />
                  <div className="h-8 sm:h-10 md:h-12 w-4/5 max-w-lg rounded-2xl bg-white/20 backdrop-blur-md" />
                </div>

                {/* Skeleton Description */}
                <div className="space-y-2 pt-1">
                  <div className="h-4 sm:h-5 w-full max-w-lg rounded-lg bg-white/15 backdrop-blur-md" />
                  <div className="h-4 sm:h-5 w-3/4 max-w-md rounded-lg bg-white/15 backdrop-blur-md" />
                </div>

                {/* Skeleton Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                  <div className="h-11 sm:h-12 w-36 sm:w-44 rounded-xl bg-[#0284c7]/50 border border-[#38bdf8]/40 shadow-lg" />
                  <div className="h-11 sm:h-12 w-32 sm:w-40 rounded-xl bg-white/15 border border-white/25 backdrop-blur-md shadow-lg" />
                </div>
              </div>
            ) : (
              <>
                {/* Top Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/60 bg-[#0c2a47]/95 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-[#bae6fd] shadow-xl backdrop-blur-md"
                >
                  <Sparkles size={14} className="text-[#38bdf8] animate-pulse" />
                  <span className="text-[#e0f2fe] font-bold" style={{ color: "#e0f2fe" }}>
                    {locationTitle
                      ? `Leading Biomedical Supplier in ${locationTitle}`
                      : "Pioneering Biomedical & Diagnostic Innovations"}
                  </span>
                </motion.div>

                {/* Main Heading with 100% guaranteed pure white color & drop-shadow */}
                {heroTitle && (
                  <motion.h1
                    key={`title-${currentSlide}-${heroTitle}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ color: "#ffffff", textShadow: "0 4px 20px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.8)" }}
                    className="mt-3 text-2xl font-black tracking-tight !text-white sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15]"
                  >
                    {heroTitle}
                  </motion.h1>
                )}

                {/* Description with pure white/slate contrast */}
                {heroDescription && (
                  <motion.p
                    key={`desc-${currentSlide}-${heroDescription}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ color: "#f1f5f9", textShadow: "0 2px 10px rgba(0,0,0,0.95)" }}
                    className="mt-2.5 text-xs sm:text-sm md:text-base leading-relaxed !text-slate-100 max-w-2xl font-medium line-clamp-2 md:line-clamp-3"
                  >
                    {heroDescription}
                  </motion.p>
                )}

                {/* Action Buttons with Clear Normal & Hover States */}
                {(btn1Text || btn2Text) && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4"
                  >
                    {btn1Text && (
                      <Link
                        href={btn1Href}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#0284c7]/40 transition-all duration-300 hover:scale-105 hover:shadow-2xl border border-[#38bdf8]/50"
                      >
                        <span className="text-white font-bold" style={{ color: "#ffffff" }}>{btn1Text}</span>
                        <ArrowRight size={16} className="text-white transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    )}

                    {btn2Text && (
                      <Link
                        href={btn2Href}
                        className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/80 bg-black/40 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white hover:text-[#0f2d4a] hover:border-white hover:scale-105"
                      >
                        <PhoneCall size={16} className="text-[#38bdf8] transition-colors duration-300 group-hover:text-[#0f2d4a]" />
                        <span className="font-bold transition-colors duration-300 group-hover:text-[#0f2d4a]" style={{ color: "#ffffff" }}>{btn2Text}</span>
                      </Link>
                    )}
                  </motion.div>
                )}
              </>
            )}

            {/* Trust Badges with Bright High-Contrast Colors */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 hidden sm:flex flex-wrap items-center gap-5 border-t border-white/20 pt-3 text-xs font-bold text-white"
              style={{ color: "#ffffff", textShadow: "0 2px 8px rgba(0,0,0,0.95)" }}
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
                <span className="text-white" style={{ color: "#ffffff" }}>ISO 13485 Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
                <span className="text-white" style={{ color: "#ffffff" }}>24/7 SLA Field Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
                <span className="text-white" style={{ color: "#ffffff" }}>NABL Traceable QC</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Carousel Floating Controls Bar */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-30 flex items-center gap-2 sm:gap-3">
            {/* Auto-play toggle */}
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
              className="hidden sm:flex h-10 w-10 items-center justify-center rounded-2xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-[#245d8e] hover:border-[#245d8e] transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
            </button>

            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Slide"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-[#245d8e] hover:border-[#245d8e] transition-all shadow-lg"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>

            {/* Counter Badge */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-black/70 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md border border-white/30 shadow-lg">
              {activeMedia?.type === "video" ? (
                <Film size={14} className="text-[#60a5fa]" />
              ) : (
                <ImageIcon size={14} className="text-[#60a5fa]" />
              )}
              <span className="text-white">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              title="Next Slide"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-black/60 text-white backdrop-blur-md border border-white/30 hover:bg-[#245d8e] hover:border-[#245d8e] transition-all shadow-lg"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        )}

        {/* Bottom Pagination Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-5 left-5 sm:bottom-8 sm:left-8 z-30 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full h-2.5 ${currentSlide === idx
                  ? "w-8 bg-[#4f8fc2] shadow-lg shadow-[#4f8fc2]/70"
                  : "w-2.5 bg-white/60 hover:bg-white"
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
