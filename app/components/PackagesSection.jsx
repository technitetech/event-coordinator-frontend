"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal.jsx";

const EVENT_MENU_PACKAGES = [
  {
    code: "MENU_01",
    title: "Menu 01",
    label: "Event Menu Package",
    subtitle: "Classic Sri Lankan Banquet",
    price: "2,600",
    badge: "Best Value",
    highlightColor: "gold",
    inclusionsCount: 11,
    featuredItems: [
      "Signature Welcome Drink",
      "Savory Fried Rice",
      "Spiced Chicken Kuruma",
      "Fish Ambulthiyal",
      "Tempered Dhal Curry",
      "Tempered Potatoes",
      "Brinjal Moju & Malay Pickle",
      "Vegetable Cutlet & Papadam",
      "Chef's Selected Dessert",
    ],
    staples: ["Fried Rice", "Cutlet & Papadam"],
    mains: ["Chicken Kuruma", "Fish Ambulthiyal"],
    accompaniments: ["Tempered Dhal Curry", "Tempered Potatoes", "Brinjal Moju", "Malay Pickle"],
    dessert: "Daily Artisan Dessert",
  },
  {
    code: "MENU_02",
    title: "Menu 02",
    label: "Event Menu Package",
    subtitle: "Seafood & Cashew Deluxe",
    price: "3,500",
    badge: "Popular Choice",
    highlightColor: "emerald",
    inclusionsCount: 13,
    featuredItems: [
      "Tropical Welcome Drink",
      "Seasoned Fried Rice",
      "Chicken Kuruma",
      "Lagoon Tempered Prawns",
      "Tempered Cashew Nuts",
      "Tempered Dhal & Potatoes",
      "Brinjal Moju & Malay Pickle",
      "Mixed Garden Salad",
      "Maldives Fish Sambol & Papadam",
      "Fine Coastal Dessert",
    ],
    staples: ["Fried Rice", "Papadam"],
    mains: ["Chicken Kuruma", "Lagoon Tempered Prawns"],
    accompaniments: ["Tempered Cashew Nuts", "Mixed Salad", "Maldives Fish Sambol", "Tempered Dhal & Potatoes", "Brinjal Moju", "Malay Pickle"],
    dessert: "Fine Coastal Dessert",
  },
  {
    code: "MENU_03",
    title: "Menu 03",
    label: "Event Menu Package",
    subtitle: "Grand Multi-Course Feast",
    price: "4,000",
    badge: "Executive Spread",
    highlightColor: "gold",
    inclusionsCount: 15,
    featuredItems: [
      "Welcome Mocktail",
      "Fried Rice & Steamed Plain Rice",
      "Fried Noodles & Fresh String Hoppers",
      "Chicken Kuruma & Beef or Pork Stew",
      "Fish Ambulthiyal",
      "Tempered Cashew Nuts & Potatoes",
      "Brinjal Moju & Mixed Salad",
      "Maldives Fish Sambol & Papadam",
      "Gourmet Dessert Course",
    ],
    staples: ["Fried Rice", "Plain Rice", "Fried Noodles", "String Hoppers"],
    mains: ["Chicken Kuruma", "Beef or Pork Stew", "Fish Ambulthiyal"],
    accompaniments: ["Tempered Cashew Nuts", "Tempered Potato", "Brinjal Moju", "Mixed Salad", "Maldives Fish Sambol", "Papadam"],
    dessert: "Gourmet Dessert Course",
  },
  {
    code: "MENU_04",
    title: "Menu 04",
    label: "Event Menu Package",
    subtitle: "Imperial Coastal Banquet",
    price: "5,500",
    badge: "Imperial VIP",
    highlightColor: "gold-glow",
    inclusionsCount: 17,
    featuredItems: [
      "Royal Welcome Elixir",
      "Fried Rice, Plain Rice & Savory Rice",
      "Chicken Kuruma",
      "Fiery Beef Deviled & Pork Deviled",
      "Fish Stew or Deviled",
      "Lagoon Prawns Deviled",
      "Rich Cashew Nut Mud Curry",
      "Brinjal Moju, Dhal & Egg Salad",
      "Sinhala Achcharu & Malay Pickle",
      "5-Course Luxury Dessert Buffet",
    ],
    staples: ["Fried Rice", "Plain Rice", "Savory Rice"],
    mains: ["Chicken Kuruma", "Beef Deviled", "Pork Deviled", "Fish Stew/Deviled", "Prawns Deviled"],
    accompaniments: ["Cashew Mud Curry", "Potato Tempered", "Brinjal Moju", "Dhal Curry", "Egg Salad", "Mixed Salad", "Sinhala Achcharu", "Papadam"],
    dessert: "5-Item Dessert Buffet (Ice Cream, Watalappan, Fruit Platters, Chocolate Mousse, Strawberry Mousse)",
    dessertSelection: [
      "Artisanal Ice Cream",
      "Traditional Watalappan",
      "Fresh Tropical Fruit Platters",
      "Silky Chocolate Mousse",
      "Strawberry Mousse",
    ],
  },
];

const DAY_OUT_DATA = {
  title: "Perfect Weekend Day Out",
  tagline: "Relax. Unwind. Enjoy.",
  price: "4,000",
  unit: "Net Per Person",
  time: "10:00 AM – 5:00 PM",
  badge: "Special Day Outing",
  flyers: [
    {
      src: "/images/promo1.jpeg",
      title: "Weekend Day Out Highlights",
      caption: "Pool access, all-inclusive spread & amenities",
    },
    {
      src: "/images/promo2.jpeg",
      title: "Day Outing Menu Breakdown",
      caption: "Full buffet options & international spread",
    },
  ],
  inclusions: [
    { icon: "local_bar", title: "Welcome Drink", desc: "Refreshing arrival beverage" },
    { icon: "pool", title: "Pool Access", desc: "Oceanfront swimming pool privileges" },
    { icon: "restaurant", title: "International Set Menu", desc: "25+ PAX upgraded to International Buffet" },
    { icon: "local_cafe", title: "Evening High Tea", desc: "Fresh tea/coffee served with hot snack" },
    { icon: "security", title: "24/7 High Security", desc: "Peaceful & calm coastal sanctuary" },
    { icon: "meeting_room", title: "Free Changing Room", desc: "Complimentary room for 10+ PAX groups" },
  ],
  menuOptions: [
    {
      name: "Menu 01: Traditional Sri Lankan",
      items: ["Sri Lankan Yellow Rice", "Chicken Curry or Fish Stew", "02 Vegetable Curries", "02 Vegetable Cutlets", "Chutney, Papadam & Pickle"],
    },
    {
      name: "Menu 02: Asian Coastal Fusion",
      items: ["Seafood / Chicken Fried Rice or Noodles", "Deviled Chicken or Fish Stew", "Vegetable Chopsuey", "02 Vegetable Cutlets", "Chili Paste & Prawn Crackers"],
    },
  ],
  desserts: ["Fruit Salad with Ice Cream", "Fresh Cut Fruit Platter", "Dessert of the Day"],
};

export default function PackagesSection() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'menus' | 'day_out'
  const [activeFlyerIndex, setActiveFlyerIndex] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [selectedMenuModal, setSelectedMenuModal] = useState(null);

  return (
    <section className="packages-section" id="packages">
      {/* Ambient background glows */}
      <div className="pkg-glow-top" aria-hidden="true" />
      <div className="pkg-glow-bottom" aria-hidden="true" />

      <div className="wrap relative z-10">
        
        {/* Section Header */}
        <Reveal>
          <div className="pkg-header text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-light bg-gold-subtle text-gold text-2xs font-mono tracking-widest uppercase mb-3">
              <span className="material-symbols-outlined text-xs leading-none">auto_awesome</span>
              <span>Curated Celebrations &amp; Day Escapes</span>
            </div>

            <h2 className="pkg-main-title">
              Signature Event Packages &amp; Day Outings
            </h2>
            
            <p className="pkg-lead-subtitle">
              From bespoke multi-course gala banquets to sun-drenched coastal pool retreats. 
              Transparent per-person rates with no hidden costs.
            </p>

            {/* Filter Tabs */}
            <div className="pkg-tab-container mt-8">
              <button
                type="button"
                className={`pkg-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                <span className="material-symbols-outlined text-sm">dashboard</span>
                <span>All Packages</span>
              </button>

              <button
                type="button"
                className={`pkg-tab-btn ${activeTab === "menus" ? "active" : ""}`}
                onClick={() => setActiveTab("menus")}
              >
                <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                <span>Event Menu Packages (01–04)</span>
              </button>

              <button
                type="button"
                className={`pkg-tab-btn ${activeTab === "day_out" ? "active" : ""}`}
                onClick={() => setActiveTab("day_out")}
              >
                <span className="material-symbols-outlined text-sm">pool</span>
                <span>Weekend Day Out (Special)</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* =========================================================================
            PROMOTIONAL SPOTLIGHT: WEEKEND DAY OUTING (FLYER HERO BANNER)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "day_out") && (
          <Reveal delay={100}>
            <div className="dayout-showcase-card mt-12">
              <div className="dayout-grid">
                
                {/* Left: Promotional Flyer Interactive Carousel / Lightbox trigger */}
                <div className="dayout-flyer-col">
                  <div className="dayout-flyer-wrapper">
                    <div 
                      className="dayout-flyer-preview group"
                      onClick={() => setLightboxImg(DAY_OUT_DATA.flyers[activeFlyerIndex].src)}
                      role="button"
                      tabIndex={0}
                      aria-label="Click to enlarge flyer"
                    >
                      <Image
                        src={DAY_OUT_DATA.flyers[activeFlyerIndex].src}
                        alt={DAY_OUT_DATA.flyers[activeFlyerIndex].title}
                        width={460}
                        height={660}
                        priority={false}
                        className="dayout-flyer-image"
                      />
                      
                      {/* Hover Overlay with Zoom Icon */}
                      <div className="dayout-flyer-hover-action">
                        <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                        <span className="text-white text-xs font-mono tracking-wider uppercase mt-1">
                          Click to View Full Flyer
                        </span>
                      </div>

                      <div className="dayout-flyer-badge">
                        <span className="material-symbols-outlined text-xs text-gold">verified</span>
                        <span>Official St. Lachlan Flyer</span>
                      </div>
                    </div>

                    {/* Flyer Switcher Thumbnails */}
                    <div className="dayout-flyer-thumbs mt-3">
                      {DAY_OUT_DATA.flyers.map((flyer, idx) => (
                        <button
                          key={flyer.src}
                          type="button"
                          className={`dayout-thumb-btn ${activeFlyerIndex === idx ? "active" : ""}`}
                          onClick={() => setActiveFlyerIndex(idx)}
                        >
                          <span className="text-2xs font-mono font-bold">FLYER 0{idx + 1}</span>
                          <span className="text-3xs text-stone-400 block truncate">{flyer.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Package Details & Inclusions */}
                <div className="dayout-content-col">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="dayout-tag-pill">
                      <span className="material-symbols-outlined text-xs text-gold">wb_sunny</span>
                      <span>Day Outing Special</span>
                    </span>
                    <span className="text-2xs font-mono text-stone-400">
                      {DAY_OUT_DATA.time}
                    </span>
                  </div>

                  <h3 className="dayout-title mt-3">
                    {DAY_OUT_DATA.title}
                  </h3>
                  <p className="dayout-tagline text-gold font-serif italic text-sm">
                    {DAY_OUT_DATA.tagline} · Beachfront Sanctuary, Negombo
                  </p>

                  <div className="dayout-price-box mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xs text-mist font-mono uppercase">Starting at</span>
                      <span className="text-3xl font-black font-mono text-white tracking-tight">
                        Rs. {DAY_OUT_DATA.price}
                      </span>
                      <span className="text-xs text-gold font-mono">/ Net Per Person</span>
                    </div>
                    <span className="text-3xs text-emerald block mt-1 font-mono">
                      Over 10 PAX: Free Changing Room Included
                    </span>
                  </div>

                  {/* 6 Core Inclusions Grid */}
                  <div className="dayout-inclusions-grid mt-6">
                    {DAY_OUT_DATA.inclusions.map((inc) => (
                      <div key={inc.title} className="dayout-inc-item">
                        <div className="dayout-inc-icon">
                          <span className="material-symbols-outlined text-gold text-base">{inc.icon}</span>
                        </div>
                        <div>
                          <strong className="text-white text-xs block font-serif">{inc.title}</strong>
                          <span className="text-3xs text-stone-300 leading-snug block">{inc.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day Outing Menu Options Snapshot */}
                  <div className="dayout-menu-snapshot mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-xs text-gold">restaurant_menu</span>
                      <span className="text-2xs font-mono text-gold uppercase tracking-wider">
                        Included Lunch Spread Options (Choice of 2 Menus)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs text-stone-300">
                      <div className="bg-black/25 p-2.5 rounded-lg border border-white/5">
                        <strong className="text-white block font-serif text-xs mb-1">Option A: Sri Lankan</strong>
                        <p className="text-3xs text-stone-400">Yellow rice, chicken/fish curry, 2 veg curries, cutlets, chutney &amp; papadam.</p>
                      </div>
                      <div className="bg-black/25 p-2.5 rounded-lg border border-white/5">
                        <strong className="text-white block font-serif text-xs mb-1">Option B: Asian Coastal</strong>
                        <p className="text-3xs text-stone-400">Seafood/chicken fried rice or noodles, deviled chicken/fish, chopsuey &amp; crackers.</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="dayout-action-row mt-6">
                    <Link href="/events" className="btn btn-gold text-xs font-semibold">
                      <span className="material-symbols-outlined text-sm">event</span>
                      <span>Plan Day Out with AI Coordinator</span>
                    </Link>
                    <a href="tel:+94704381343" className="btn btn-ghost text-xs">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      <span>Call for Inquiries (+94 70 438 1343)</span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </Reveal>
        )}

        {/* =========================================================================
            EVENT MENU PACKAGES (MENU 01 – MENU 04)
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "menus") && (
          <div className="mt-14">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 mb-8 border-b border-white/10 pb-4">
              <div>
                <span className="text-gold font-mono text-2xs uppercase tracking-widest">
                  PDF Event Menu Selection
                </span>
                <h3 className="text-2xl font-serif font-bold text-white mt-1">
                  Four Tiered Event Banquets
                </h3>
              </div>
              <p className="text-2xs text-stone-400 max-w-md">
                Carefully composed menus for weddings, galas, corporate seminars, and family celebrations in Negombo.
              </p>
            </div>

            {/* 4-Card Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {EVENT_MENU_PACKAGES.map((pkg, idx) => (
                <Reveal key={pkg.code} delay={idx * 80}>
                  <div className={`pkg-card ${pkg.highlightColor === "gold-glow" ? "pkg-card-featured" : ""}`}>
                    
                    {/* Card Header */}
                    <div className="pkg-card-top">
                      <div className="flex justify-between items-start">
                        <span className="pkg-badge">{pkg.badge}</span>
                        <span className="text-3xs font-mono text-stone-400 uppercase">
                          {pkg.inclusionsCount} items
                        </span>
                      </div>

                      <h4 className="pkg-menu-title mt-3">
                        {pkg.title}
                      </h4>
                      <p className="pkg-menu-subtitle">
                        {pkg.subtitle}
                      </p>
                    </div>

                    {/* Price Header */}
                    <div className="pkg-price-banner">
                      <span className="text-3xs text-mist font-mono">RATE PER HEAD</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs text-gold font-mono">Rs.</span>
                        <span className="text-2xl font-black font-mono text-white">
                          {pkg.price}
                        </span>
                        <span className="text-3xs text-stone-400 font-mono">/ person</span>
                      </div>
                    </div>

                    {/* Item List Preview */}
                    <div className="pkg-item-list">
                      <span className="text-4xs font-mono uppercase text-mist tracking-wider block mb-2">
                        Included Courses &amp; Delicacies
                      </span>
                      <ul className="space-y-1.5">
                        {pkg.featuredItems.map((item) => (
                          <li key={item} className="pkg-item-row">
                            <span className="material-symbols-outlined text-gold text-2xs leading-none shrink-0">
                              check_circle
                            </span>
                            <span className="text-2xs text-stone-300 leading-tight">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Deluxe Highlight (if Menu 04) */}
                    {pkg.dessertSelection && (
                      <div className="pkg-dessert-box mt-3 p-2.5 rounded-lg bg-gold/10 border border-gold/30">
                        <div className="flex items-center gap-1.5 text-gold text-3xs font-mono font-bold uppercase mb-1">
                          <span className="material-symbols-outlined text-xs">cake</span>
                          <span>Full 5-Course Dessert Selection</span>
                        </div>
                        <p className="text-4xs text-stone-300">
                          Ice Cream · Watalappan · Fruit Platters · Chocolate Mousse · Strawberry Mousse
                        </p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pkg-card-footer mt-auto pt-4">
                      <Link
                        href={`/events?menu=${encodeURIComponent(pkg.title)}`}
                        className="btn btn-gold w-full text-xs font-semibold justify-center py-2"
                      >
                        <span>Select in Event Planner</span>
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>

                      <button
                        type="button"
                        className="w-full text-center text-3xs text-stone-400 hover:text-gold transition-colors mt-2 font-mono"
                        onClick={() => setSelectedMenuModal(pkg)}
                      >
                        View Full Course Breakdown
                      </button>
                    </div>

                  </div>
                </Reveal>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* =========================================================================
          LIGHTBOX MODAL FOR FULL-RESOLUTION FLYER INSPECTION
          ========================================================================= */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative max-w-2xl max-h-[90vh] bg-stone-900 rounded-2xl overflow-hidden shadow-2xl border border-white/20 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 text-white hover:bg-gold hover:text-black flex items-center justify-center transition-colors"
              onClick={() => setLightboxImg(null)}
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-lg leading-none">close</span>
            </button>

            <div className="relative w-full h-[75vh] min-w-[320px]">
              <Image
                src={lightboxImg}
                alt="Enlarged Promotional Flyer"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>

            <div className="p-3 bg-stone-950 flex flex-wrap items-center justify-between gap-2 text-2xs text-stone-300">
              <span className="font-serif text-white">St. Lachlan Hotel &amp; Suites · Promotional Flyer</span>
              <a 
                href={lightboxImg} 
                download 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline font-mono text-3xs"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                <span>Download High-Res Flyer</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          COURSE BREAKDOWN MODAL
          ========================================================================= */}
      {selectedMenuModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedMenuModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative max-w-lg w-full bg-emerald-950/95 border border-gold/40 rounded-2xl p-6 shadow-2xl text-ivory"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-stone-400 hover:text-white"
              onClick={() => setSelectedMenuModal(null)}
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <span className="text-3xs font-mono text-gold uppercase tracking-widest">
              Full Banquet Breakdown
            </span>
            <h3 className="text-xl font-serif font-bold text-white mt-1">
              {selectedMenuModal.title} — Rs. {selectedMenuModal.price} / Head
            </h3>
            <p className="text-xs text-stone-300 mt-1 mb-4">
              {selectedMenuModal.subtitle}
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
              <div>
                <strong className="text-2xs font-mono text-gold block uppercase mb-1">
                  Staples &amp; Breads
                </strong>
                <ul className="list-disc list-inside text-2xs text-stone-200 space-y-1">
                  {selectedMenuModal.staples?.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>

              <div>
                <strong className="text-2xs font-mono text-gold block uppercase mb-1">
                  Main Curries &amp; Proteins
                </strong>
                <ul className="list-disc list-inside text-2xs text-stone-200 space-y-1">
                  {selectedMenuModal.mains?.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>

              <div>
                <strong className="text-2xs font-mono text-gold block uppercase mb-1">
                  Accompaniments, Salads &amp; Pickles
                </strong>
                <ul className="list-disc list-inside text-2xs text-stone-200 space-y-1">
                  {selectedMenuModal.accompaniments?.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>

              <div>
                <strong className="text-2xs font-mono text-gold block uppercase mb-1">
                  Dessert Course
                </strong>
                <p className="text-2xs text-stone-200">
                  {selectedMenuModal.dessert}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
              <Link
                href={`/events?menu=${encodeURIComponent(selectedMenuModal.title)}`}
                className="btn btn-gold flex-1 text-xs justify-center"
              >
                Customize with AI Planner
              </Link>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                onClick={() => setSelectedMenuModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
