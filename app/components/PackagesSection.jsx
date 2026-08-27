"use client";

import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal.jsx";

const EVENT_MENUS = [
  {
    code: "MENU_01",
    name: "Menu 01",
    tier: "Classic Banquet",
    price: "2,600",
    paxMin: "20+ Guests",
    welcome: "Chilled Welcome Drink",
    staples: ["Sri Lankan Savory Fried Rice", "Crispy Papadam", "Vegetable Cutlet"],
    mains: ["Chicken Kuruma", "Southern Fish Ambulthiyal"],
    accompaniments: ["Tempered Dhal Curry", "Tempered Potatoes", "Caramelized Brinjal Moju", "Traditional Malay Pickle"],
    dessert: "Chef's Daily Artisan Dessert",
  },
  {
    code: "MENU_02",
    name: "Menu 02",
    tier: "Seafood & Cashew Deluxe",
    price: "3,500",
    paxMin: "25+ Guests",
    welcome: "Tropical Island Welcome Drink",
    staples: ["Fluffy Seasoned Fried Rice", "Crispy Papadam"],
    mains: ["Spiced Chicken Kuruma", "Lagoon Tempered Prawns"],
    accompaniments: ["Roasted Tempered Cashew Nuts", "Mixed Garden Salad", "Maldives Fish Sambol", "Tempered Dhal & Potatoes", "Brinjal Moju", "Malay Pickle"],
    dessert: "Selected Fine Coastal Dessert",
  },
  {
    code: "MENU_03",
    name: "Menu 03",
    tier: "Grand Multi-Course Feast",
    price: "4,000",
    paxMin: "30+ Guests",
    welcome: "Refreshing Arrival Mocktail",
    staples: ["Fragrant Fried Rice", "Steamed Plain Rice", "Wok-Fried Noodles", "Fresh String Hoppers", "Papadam"],
    mains: ["Chicken Kuruma", "Slow-Simmered Beef or Pork Stew", "Fish Ambulthiyal"],
    accompaniments: ["Tempered Cashew Nuts", "Tempered Potatoes", "Brinjal Moju", "Mixed Garden Salad", "Maldives Fish Sambol"],
    dessert: "Gourmet Multi-Course Dessert",
  },
  {
    code: "MENU_04",
    name: "Menu 04",
    tier: "Imperial Coastal Banquet",
    price: "5,500",
    paxMin: "35+ Guests",
    featured: true,
    welcome: "Royal Welcome Elixir",
    staples: ["Fragrant Fried Rice", "Steamed Rice", "Golden Savory Rice", "Crispy Papadam"],
    mains: ["Chicken Kuruma", "Fiery Beef Deviled", "Pork Deviled", "Fish Stew or Deviled", "Spiced Lagoon Prawns Deviled"],
    accompaniments: ["Rich Cashew Nut Mud Curry", "Tempered Potatoes", "Brinjal Moju", "Dhal Curry", "Fresh Egg Salad", "Mixed Salad", "Traditional Sinhala Achcharu / Malay Pickle"],
    dessert: "5-Course Luxury Dessert Buffet",
    dessertList: ["Artisanal Ice Cream", "Traditional Watalappan", "Fresh Tropical Fruit Platters", "Silky Chocolate Mousse", "Strawberry Mousse"],
  },
];

export default function PackagesSection() {
  return (
    <section className="packages-section" id="packages">
      <div className="wrap">
        
        {/* =========================================================================
            HEADER: UNDERSTATED LUXURY EDITORIAL
            ========================================================================= */}
        <Reveal>
          <div className="packages-header">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
              <span className="text-2xs font-mono tracking-widest text-gold uppercase">
                Event Packages &amp; Day Outings · St. Lachlan Negombo
              </span>
            </div>
            
            <h2 className="packages-title">
              Bespoke Menus &amp; Coastal Retreat Packages
            </h2>
            
            <p className="packages-subtitle">
              Authentic culinary selections crafted by our master banquet team for celebrations, weddings, and corporate gatherings, alongside our signature seaside day outing experience.
            </p>
          </div>
        </Reveal>

        {/* =========================================================================
            PART 1: THE 4 EVENT MENU PACKAGES (MENU 01 – MENU 04)
            ========================================================================= */}
        <div className="mt-14">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-4 border-b border-white/10 mb-8">
            <div>
              <span className="text-3xs font-mono text-stone-400 uppercase tracking-widest block">
                Official Event Catering Menus
              </span>
              <h3 className="text-xl font-serif font-bold text-white mt-1">
                Tiered Event Banquets
              </h3>
            </div>
            <span className="text-2xs font-mono text-gold">
              All prices in LKR · Net per guest
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {EVENT_MENUS.map((menu, idx) => (
              <Reveal key={menu.code} delay={idx * 80}>
                <div className={`menu-tier-card ${menu.featured ? "featured" : ""}`}>
                  
                  {/* Card Top */}
                  <div className="menu-tier-top">
                    <div className="flex justify-between items-center">
                      <span className="menu-tier-code">{menu.name}</span>
                      {menu.featured ? (
                        <span className="menu-tier-tag-gold">Imperial VIP</span>
                      ) : (
                        <span className="menu-tier-min">{menu.paxMin}</span>
                      )}
                    </div>

                    <h4 className="menu-tier-name">{menu.tier}</h4>

                    <div className="menu-price-row mt-3">
                      <span className="text-3xs text-stone-400 font-mono">LKR</span>
                      <span className="text-2xl font-bold font-mono text-white mx-1">{menu.price}</span>
                      <span className="text-3xs text-stone-400 font-mono">/ person</span>
                    </div>
                  </div>

                  {/* Course Breakdown */}
                  <div className="menu-courses-list">
                    
                    <div className="course-group">
                      <span className="course-group-title">Welcome</span>
                      <p className="course-item text-stone-300">{menu.welcome}</p>
                    </div>

                    <div className="course-group">
                      <span className="course-group-title">Staples &amp; Breads</span>
                      <p className="course-item text-stone-300">{menu.staples.join(" · ")}</p>
                    </div>

                    <div className="course-group">
                      <span className="course-group-title">Mains &amp; Curries</span>
                      <p className="course-item text-stone-200 font-medium">{menu.mains.join(" · ")}</p>
                    </div>

                    <div className="course-group">
                      <span className="course-group-title">Accompaniments &amp; Pickles</span>
                      <p className="course-item text-stone-400">{menu.accompaniments.join(" · ")}</p>
                    </div>

                    <div className="course-group">
                      <span className="course-group-title">Dessert Course</span>
                      <p className="course-item text-gold font-medium">{menu.dessert}</p>
                      {menu.dessertList && (
                        <div className="mt-1.5 p-2 rounded bg-black/30 border border-gold/20 text-3xs text-stone-300 space-y-0.5">
                          {menu.dessertList.map((d) => (
                            <div key={d} className="flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Action Link */}
                  <div className="menu-tier-footer mt-auto pt-4">
                    <Link
                      href={`/events?menu=${encodeURIComponent(menu.name)}`}
                      className="btn-select-menu"
                    >
                      <span>Select Package in AI Planner</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </Link>
                  </div>

                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* =========================================================================
            PART 2: PROMOTIONAL DAY OUTING (BOTH FLYERS DISPLAYED SIDE-BY-SIDE)
            ========================================================================= */}
        <div className="mt-20 pt-12 border-t border-white/10">
          
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <span className="text-3xs font-mono text-gold uppercase tracking-widest block">
                  Promotional Special · Coastal Day Retreat
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                  Perfect Weekend Day Out
                </h3>
                <p className="text-xs text-stone-300 max-w-xl mt-2 leading-relaxed">
                  Relax, unwind, and enjoy direct beachfront luxury in Negombo. Complete with swimming pool access, international lunch buffet, and evening high tea.
                </p>
              </div>

              <div className="bg-emerald-950/80 border border-gold/30 rounded-xl px-5 py-3 text-right shrink-0">
                <span className="text-3xs font-mono text-stone-300 uppercase block">All-Inclusive Rate</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xs font-mono text-gold">Rs.</span>
                  <span className="text-2xl font-black font-mono text-white">4,000</span>
                  <span className="text-3xs font-mono text-stone-300">/= Net Per Person</span>
                </div>
                <span className="text-3xs font-mono text-gold block mt-0.5">10:00 AM – 5:00 PM</span>
              </div>
            </div>
          </Reveal>

          {/* Dual Flyer Presentation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Flyer 01: Highlights & Pool Privileges */}
            <Reveal delay={100}>
              <div className="flyer-card">
                <div className="flyer-image-container">
                  <Image
                    src="/images/promo1.jpeg"
                    alt="St. Lachland Perfect Weekend Day Out Flyer - Highlights & Amenities"
                    width={900}
                    height={1350}
                    priority={false}
                    className="flyer-img"
                  />
                </div>
                <div className="flyer-caption">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">Flyer 01: Day Outing Highlights</strong>
                    <span className="text-3xs font-mono text-gold">Pool Access &amp; Inclusions</span>
                  </div>
                  <p className="text-3xs text-stone-400 mt-1 leading-relaxed">
                    Includes welcome drink, oceanfront pool privileges, international set menu, evening tea with snack, and free changing room for groups over 10 PAX.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Flyer 02: Complete Day Outing Menu Options */}
            <Reveal delay={200}>
              <div className="flyer-card">
                <div className="flyer-image-container">
                  <Image
                    src="/images/promo2.jpeg"
                    alt="St. Lachland Perfect Weekend Day Out Flyer - Full Day Outing Menu"
                    width={900}
                    height={1350}
                    priority={false}
                    className="flyer-img"
                  />
                </div>
                <div className="flyer-caption">
                  <div className="flex items-center justify-between">
                    <strong className="text-white font-serif text-sm">Flyer 02: Day Outing Menu Breakdown</strong>
                    <span className="text-3xs font-mono text-gold">Buffet &amp; Set Menus</span>
                  </div>
                  <p className="text-3xs text-stone-400 mt-1 leading-relaxed">
                    Choice between Traditional Sri Lankan Yellow Rice feast or Asian Coastal Noodles &amp; Fried Rice with deviled meats, soups, and artisan ice cream dessert.
                  </p>
                </div>
              </div>
            </Reveal>

          </div>

          {/* Inquiries & Direct Booking Bar */}
          <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <strong className="text-white font-serif text-base block">Ready to book your Day Outing or Event?</strong>
              <span className="text-xs text-stone-400 block mt-0.5">
                St. Lachlan Hotel &amp; Suites · No. 25, St. Anthony&apos;s Road, Negombo, Sri Lanka
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/events" className="btn btn-gold text-xs font-semibold px-5 py-2.5">
                <span>Plan Event with AI</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
              <a 
                href="tel:+94704381343" 
                className="btn btn-ghost text-xs text-white border-white/20 hover:border-gold px-4 py-2.5 inline-flex items-center gap-1.5 font-mono"
              >
                <span className="material-symbols-outlined text-sm text-gold">call</span>
                <span>+94 70 438 1343</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
