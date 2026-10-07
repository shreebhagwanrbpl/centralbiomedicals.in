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

// Default high-quality fallback slides if database has no media configured yet
const FALLBACK_SLIDES = [
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1900&q=80",
    title: "Precision Medical Equipment & Diagnostic Solutions",
    subtitle:
      "Equipping hospitals, pathology centers, and clinical laboratories with top-tier automated analyzers, NABL-traceable calibration, and 24/7 rapid technical engineering support across India.",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1900&q=80",
    title: "Automated Clinical Chemistry & Pathology Analyzers",
    subtitle:
      "High-throughput diagnostic instruments delivering rapid test results with uncompromised quality control and ISO 13485 certified accuracy standards.",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1900&q=80",
    title: "24/7 Biomedical Engineering & AMC Support",
    subtitle:
      "Guaranteed 2-hour emergency repair SLA for critical ICU, OT, and pathology laboratory equipment with genuine OEM parts.",
  },
];

export default function HeroCarousel({
  homeData = null,
  locationTitle = "",
  makeLink = (path) => path,
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
            url: vUrl,
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

  // Dynamic texts - strictly dynamic without static fallback text
  const heroTitle =
    homeData?.title?.trim() ||
    (locationTitle ? `Leading Biomedical & Diagnostic Supplier in ${locationTitle}` : "");

  const heroDescription = homeData?.description?.trim() || "";

  const btn1Text = homeData?.button1Text?.trim() || "";
  const btn2Text = homeData?.button2Text?.trim() || "";

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
      {/* Background Media Viewport with Immersive Zoom & Crystal Clear Contrast */}
      <div
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] lg:h-[500px] overflow-hidden"
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
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            {/* Immersive Ken Burns Zoom Effect */}
            {activeMedia?.type === "video" ? (
              <motion.video
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{ duration: 7, ease: "easeOut" }}
                ref={(el) => (videoRefs.current[currentSlide] = el)}
                src={activeMedia.url}
                className="w-full h-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            ) : (
              <motion.img
                initial={{ scale: 1 }}
                animate={{ scale: 1.14 }}
                transition={{ duration: 7, ease: "easeOut" }}
                src={activeMedia?.url}
                alt={`Hero Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center brightness-[0.85] contrast-[1.1]"
                onError={(e) => {
                  e.target.src = FALLBACK_SLIDES[0].url;
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Multi-layered Dark Gradient Overlays for 100% Guaranteed High-Contrast Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#07131e]/95 via-[#0c1f30]/85 to-[#16334a]/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131e]/90 via-transparent to-[#07131e]/50 z-10" />

        {/* Foreground Content Container */}
        <div className="container-custom relative z-20 h-full flex flex-col justify-center py-6 sm:py-8">
          <div className="max-w-2xl lg:max-w-3xl">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-[#4f8fc2]/50 bg-[#245d8e]/90 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md"
            >
              <Sparkles size={14} className="text-[#a4cdec] animate-pulse" />
              <span className="text-white">
                {locationTitle
                  ? `Leading Biomedical Supplier in ${locationTitle}`
                  : "Pioneering Biomedical & Diagnostic Innovations"}
              </span>
            </motion.div>

            {/* Main Heading with crisp high-contrast drop-shadow */}
            {heroTitle && (
              <motion.h1
                key={`title-${currentSlide}-${heroTitle}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-3 text-2xl font-black tracking-tight !text-white sm:text-3xl md:text-4xl lg:text-5xl leading-[1.15] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
              >
                {heroTitle}
              </motion.h1>
            )}

            {/* Description with high contrast */}
            {heroDescription && (
              <motion.p
                key={`desc-${currentSlide}-${heroDescription}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-2.5 text-xs sm:text-sm md:text-base leading-relaxed !text-[#eef5fa] max-w-2xl font-medium line-clamp-2 md:line-clamp-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
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
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#245d8e] px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#245d8e]/40 transition-all duration-300 hover:bg-[#183e60] hover:scale-105 hover:shadow-2xl border border-[#4f8fc2]/50"
                  >
                    <span className="text-white font-bold">{btn1Text}</span>
                    <ArrowRight size={16} className="text-white transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}

                {btn2Text && (
                  <Link
                    href={btn2Href}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/70 bg-white/15 px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white hover:text-[#18344b] hover:border-white hover:scale-105"
                  >
                    <PhoneCall size={16} className="text-[#a4cdec] transition-colors duration-300 group-hover:text-[#18344b]" />
                    <span className="font-bold transition-colors duration-300 group-hover:text-[#18344b]">{btn2Text}</span>
                  </Link>
                )}
              </motion.div>
            )}

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-4 hidden sm:flex flex-wrap items-center gap-5 border-t border-white/20 pt-3 text-xs font-semibold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#60a5fa] shrink-0" />
                <span className="text-white">ISO 13485 Certified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#60a5fa] shrink-0" />
                <span className="text-white">24/7 SLA Field Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[#60a5fa] shrink-0" />
                <span className="text-white">NABL Traceable QC</span>
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
