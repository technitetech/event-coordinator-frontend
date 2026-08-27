import Link from "next/link";
import Image from "next/image";
import Reveal from "../components/Reveal.jsx";
import Frond from "../components/Frond.jsx";
import HeroSearch from "../components/HeroSearch.jsx";
import VenueCarousel from "../components/VenueCarousel.jsx";
import TestimonialCarousel from "../components/TestimonialCarousel.jsx";
import CountUp from "../components/CountUp.jsx";
import NegomboEnvironmentSection from "../components/NegomboEnvironmentSection.jsx";
import PackagesSection from "../components/PackagesSection.jsx";
import { 
  Waves, Sparkles, Utensils, Martini, Wifi, Car,
  Diamond, Users, Cake, Wine,
  Zap, BarChart3, CloudRain, Palette,
  Headset, FileEdit, PenTool, CalendarCheck, Heart,
  PartyPopper, BedDouble, Smile, Trophy,
  Plus, Play, ArrowRight,
  ShieldCheck, CheckCircle2, Lock,
  Mail
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const POPULAR_VENUES = [
  {
    name: "Crystal Ballroom",
    img: "/images/venue-ballroom.jpg",
    caption: "St. Lachland Resort",
    capacity: "51–150 guests",
    price: "60,000",
    badge: "Bestseller",
    rating: "4.9",
  },
  {
    name: "Garden Terrace",
    img: "/images/venue-garden.jpg",
    caption: "St. Lachland Resort",
    capacity: "10–50 guests",
    price: "25,000",
    badge: "Popular",
    rating: "4.8",
  },
  {
    name: "Grand Hall",
    img: "/images/venue-grand-hall.jpg",
    caption: "St. Lachland Resort",
    capacity: "151–300 guests",
    price: "120,000",
    badge: "Luxury",
    rating: "4.9",
  },
  {
    name: "The Conservatory",
    img: "/images/venue-dining.jpg",
    caption: "St. Lachland Resort",
    capacity: "Private dining",
    price: "48,000",
    badge: "Exclusive",
    rating: "4.7",
  },
  {
    name: "The Spa Pavilion",
    img: "/images/venue-spa.jpg",
    caption: "St. Lachland Resort",
    capacity: "Couples & groups",
    price: "35,000",
    badge: "Popular",
    rating: "4.8",
  },
];

const AMENITIES = [
  { icon: Waves, label: "Infinity Pool" },
  { icon: Sparkles, label: "Wellness & Spa" },
  { icon: Utensils, label: "Fine Dining" },
  { icon: Martini, label: "Cocktail Bar" },
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: Car, label: "Valet Parking" },
];

const EVENT_TYPES = [
  {
    icon: Diamond,
    name: "Weddings",
    desc: "From intimate vows to grand celebrations on the estate.",
    img: "/images/venue-ballroom.jpg",
  },
  {
    icon: Users,
    name: "Conferences",
    desc: "Professional setups with AV, catering and serene coastal ocean breeze.",
    img: "/images/venue-grand-hall.jpg",
  },
  {
    icon: Cake,
    name: "Birthdays",
    desc: "Themed parties with entertainment, décor and bespoke menus.",
    img: "/images/venue-garden.jpg",
  },
  {
    icon: Wine,
    name: "Gala Dinners",
    desc: "Fine-dining set menus with mixology and live music.",
    img: "/images/venue-dining.jpg",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant venue match",
    desc: "Enter guests and budget — the coordinator matches the right hall or lawn from our live availability.",
  },
  {
    icon: BarChart3,
    title: "Transparent estimate",
    desc: "An itemised cost for venue, menu, and décor, with a clear within-budget verdict.",
  },
  {
    icon: CloudRain,
    title: "Seasonal intelligence",
    desc: "Flags monsoon dates, moves outdoor plans indoors, and warns of clashes automatically.",
  },
  {
    icon: Palette,
    title: "AI design generation",
    desc: "Get AI-generated visual concepts for your event décor, floral arrangements, and table settings.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    icon: Headset,
    title: "Consultation",
    desc: "Share your vision, preferences, and budget with our team.",
  },
  {
    step: "02",
    icon: FileEdit,
    title: "Planning",
    desc: "We craft a detailed event plan tailored to your requirements.",
  },
  {
    step: "03",
    icon: PenTool,
    title: "Design",
    desc: "Our AI generates décor concepts and venue arrangements.",
  },
  {
    step: "04",
    icon: CalendarCheck,
    title: "Execution",
    desc: "We coordinate every detail for a flawless celebration.",
  },
  {
    step: "05",
    icon: Heart,
    title: "Memories",
    desc: "Sit back and enjoy — we handle the rest for you.",
  },
];

const TESTIMONIALS = [
  {
    name: "Aisha & Ravi",
    event: "Wedding · 2024",
    text: "We married on the lawn in the mist and it was the most beautiful day of our lives. The estate thought of everything before we could ask.",
    avatar: "AR",
  },
  {
    name: "Priya Fernando",
    event: "Birthday · 2025",
    text: "The AI coordinator nailed our budget perfectly. The decoration tier recommendation saved us hours of planning.",
    avatar: "PF",
  },
  {
    name: "James & Co.",
    event: "Conference · 2025",
    text: "Exceptional venue. The rainy-season swap to the Grand Hall was seamless and our delegates were impressed.",
    avatar: "JC",
  },
  {
    name: "Dilshan Perera",
    event: "Gala Dinner · 2024",
    text: "The fine dining experience was unparalleled. The coastal beachfront setting added a magical touch to our corporate gala.",
    avatar: "DP",
  },
];

const STATS = [
  {
    rank: "rank 01/",
    value: 500,
    unit: "(+)",
    label: "events hosted",
    meta: "/events hosted across 5-star beachfront venues",
    theme: "step-dark",
  },
  {
    rank: "rank 02/",
    value: 98,
    unit: "(%)",
    label: "satisfaction rate",
    meta: "/client satisfaction & verified 5-star reviews",
    theme: "step-mid",
  },
  {
    rank: "rank 03/",
    value: 42,
    unit: "(suites)",
    label: "luxury sanctuaries",
    meta: "/boutique ocean rooms & private beach villas",
    theme: "step-light",
  },
  {
    rank: "rank 04/",
    value: 5,
    unit: "(venues)",
    label: "signature venues",
    meta: "/award-winning banquet halls & ocean terraces",
    theme: "step-gold",
  },
];

/* ------------------------------------------------------------------ */
/*  PAGE COMPONENT                                                     */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <main>
      {/* ========== HERO ========== */}
      <header className="hero" id="hero-section">
        <div className="hero-bg">
          <Image
            src="/images/hero-bg.jpg"
            alt="St. Lachland Hotel overlooking golden Negombo beach"
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={75}
            style={{ objectFit: "cover", objectPosition: "center 30%" }}
          />
        </div>
        <div className="hero-overlay" />
        <div className="hero-particles" aria-hidden="true">
          <span className="particle p1" />
          <span className="particle p2" />
          <span className="particle p3" />
          <span className="particle p4" />
          <span className="particle p5" />
        </div>

        <div className="wrap">
          <div className="hero-content">
            <Reveal>
              <span className="hero-badge">
                <span className="hero-badge-dot" />
                Beachfront Luxury · Negombo, Sri Lanka
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="hero-title">
                Plan your dream{" "}
                <span className="hero-accent">Event</span>
                <br />
                at St. Lachland Hotel
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="hero-subtitle">
                A refined coastal sanctuary on the golden shores of Negombo — let
                our AI coordinator plan your perfect event with the ideal venue,
                menu, and décor, all within your budget.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="hero-actions">
                <Link href="/events" className="btn-hero-primary" id="hero-plan-btn">
                  <Plus size={18} strokeWidth={2} />
                  Plan an event
                </Link>
                <a href="#venues" className="btn-hero-outline" id="hero-explore-btn">
                  <Play size={18} fill="currentColor" strokeWidth={0} />
                  Explore venues
                </a>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Floating search bar — inspired by reference designs */}
        <div className="hero-search-wrapper">
          <div className="wrap">
            <Reveal delay={480}>
              <HeroSearch />
            </Reveal>
          </div>
        </div>

        <div className="scroll-cue">
          <span>Scroll</span>
          <span className="bar" />
        </div>
      </header>

      {/* ========== AMENITIES STRIP ========== */}
      <section className="amenities-strip">
        <div className="wrap">
          <span className="amenities-eyebrow">Estate Facilities</span>
          <div className="amenities-grid">
            {AMENITIES.map((a) => {
              const IconComp = a.icon;
              return (
                <div key={a.label} className="amenity-item">
                  <div className="amenity-icon-circle">
                    <IconComp size={26} strokeWidth={1.5} />
                  </div>
                  <span className="amenity-label">{a.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== STATS BANNER — Cascading Stepped Editorial Metric Blocks ========== */}
      <section className="stats-banner" id="milestones">
        {/* Optimized background pattern image with subtle blur */}
        <div className="stats-bg-container" aria-hidden="true">
          <Image
            src="/images/pattern1.jpeg"
            alt="St. Lachland Wave Pattern Texture"
            fill
            sizes="100vw"
            quality={75}
            priority={false}
            className="stats-bg-img"
          />
          <div className="stats-bg-overlay" />
        </div>

        <div className="wrap">
          <Reveal>
            <div className="stats-header">
              <h2 className="stats-main-title">
                st. lachland resort<br />
                by the numbers
              </h2>
              <p className="stats-meta-note">
                based on verified guest &amp; event data<br />
                as of 2026.
              </p>
            </div>
          </Reveal>

          <div className="stepped-stats-container">
            {STATS.map((s, i) => (
              <Reveal key={s.rank} delay={i * 90} className={`stepped-stat-wrapper ${s.theme}`}>
                <div className="stepped-stat-card">
                  <div className="stat-card-top">
                    <span className="stat-card-unit">{s.unit}</span>
                  </div>

                  <div className="stat-card-main">
                    <span className="stat-huge-number">
                      <CountUp end={s.value} />
                    </span>
                  </div>

                  <div className="stat-card-bottom">
                    <span className="stat-card-rank">{s.rank}</span>
                    <span className="stat-card-meta">{s.meta}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== NEGOMBO LOCATION & ENVIRONMENT SECTION (3D Bento & Telemetry) ========== */}
      <NegomboEnvironmentSection />

      {/* ========== SIGNATURE PACKAGES & PROMOTIONAL FLYERS SECTION ========== */}
      <PackagesSection />

      {/* ========== POPULAR VENUES — inspired by Luxury Resort / Travel Booking ========== */}
      <section className="section venues-section" id="venues">
        {/* Paper Tear Transition Divider from Packages to Venues */}
        <div className="tear-divider-top" aria-hidden="true" />

        {/* Oceanfront Infinity Pool Panoramic Background */}
        <div className="venues-bg-img" aria-hidden="true">
          <Image
            src="/images/Piscine_Couloir_de_Nage_-_202608272014.jpeg"
            alt="St. Lachland Oceanfront Luxury Pool & Venues"
            fill
            sizes="100vw"
            quality={85}
            priority={false}
            className="object-cover"
          />
          <div className="venues-bg-overlay" />
        </div>

        <div className="wrap">
          <Reveal>
            <div className="section-header">
              <div>
                <span className="eyebrow">Our Venues</span>
                <h2 className="display">
                  Popular Event Venues
                </h2>
              </div>
              <Link href="/events" className="view-all-link">
                View all venues <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
          <VenueCarousel venues={POPULAR_VENUES} />
        </div>

        {/* Paper Tear Transition Divider from Venues to What We Do */}
        <div className="tear-divider-bottom" aria-hidden="true" />
      </section>

      {/* ========== EVENT TYPES — inspired by Eloraharbor / Norvyn ========== */}
      <section className="section event-types-section" id="events-section">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">What we do</span>
            <h2 className="display">Events we specialise in</h2>
            <p>
              From intimate garden gatherings to grand ballroom galas, the estate
              rises to every occasion.
            </p>
          </Reveal>
          <div className="event-type-grid">
            {EVENT_TYPES.map((et, i) => {
              const IconComp = et.icon;
              return (
                <Reveal key={et.name} delay={i * 100}>
                  <Link href="/events" className="event-type-card">
                    <div className="event-type-img">
                      <Image
                        src={et.img}
                        alt={et.name}
                        fill
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
                        quality={70}
                        style={{ objectFit: "cover" }}
                      />
                      <div className="event-type-overlay" />
                      <span className="event-type-icon-circle">
                        <IconComp size={24} strokeWidth={1.5} />
                      </span>
                    </div>
                    <div className="event-type-body">
                      <h3>{et.name}</h3>
                      <p>{et.desc}</p>
                      <span className="event-type-link">
                        Plan now <ArrowRight size={16} strokeWidth={2} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Coastal Ocean Wave Decorative Bottom Artwork */}
        <div className="event-types-wave-bottom" aria-hidden="true">
          <Image
            src="/images/wave_hd.png"
            alt="Coastal Ocean Waves Pattern"
            width={2628}
            height={1520}
            quality={95}
            priority={false}
            className="wave-pattern-img"
          />
        </div>
      </section>

      {/* ========== OUR APPROACH — inspired by Norvyn Events / Eloraharbor ========== */}
      <section className="section process-section" id="process">
        <div className="wrap">
          <Reveal>
            <div className="section-head" style={{ textAlign: "center" }}>
              <span className="eyebrow">Our Approach</span>
              <h2 className="display">How We Bring Your Vision to Life</h2>
              <p>A seamless five-step process from first consultation to your perfect celebration.</p>
            </div>
          </Reveal>
          <div className="process-grid">
            {PROCESS_STEPS.map((s, i) => {
              const IconComp = s.icon;
              return (
                <Reveal key={s.step} delay={i * 100}>
                  <div className="process-item">
                    <div className="process-step-num">{s.step}</div>
                    <div className="process-icon-circle">
                      <IconComp size={28} strokeWidth={1.5} />
                    </div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== NEED ASSISTANCE — inspired by Travel Booking reference ========== */}
      <section className="assist-band">
        <div className="wrap">
          <Reveal>
            <div className="assist-card">
              {/* Background Watercolor Ocean Pattern */}
              <div className="assist-bg-img" aria-hidden="true">
                <Image
                  src="/images/pattern2.jpeg"
                  alt="Coastal Watercolor Ocean Art Pattern"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  quality={80}
                  className="object-cover object-center"
                />
                <div className="assist-bg-overlay" />
              </div>

              <div className="assist-main">
                <span className="assist-kicker">We&rsquo;re here to help</span>
                <h3 className="display">Need Assistance?</h3>
                <p>
                  Our event experts are ready to help you plan your perfect
                  celebration at the resort.
                </p>
                <div className="assist-actions">
                  <Link href="/events" className="btn btn-gold">
                    Plan an event
                  </Link>
                  <a href="tel:+94312220000" className="assist-phone">
                    +94 31 222 0000
                  </a>
                </div>
              </div>
              <div className="assist-features">
                <div className="assist-feat">
                  <span className="assist-feat-icon-wrap">
                    <CheckCircle2 size={24} strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>Best Price</strong>
                    <span>We guarantee the best price</span>
                  </div>
                </div>
                <div className="assist-feat">
                  <span className="assist-feat-icon-wrap">
                    <Headset size={24} strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>24/7 Support</strong>
                    <span>We&rsquo;re here anytime</span>
                  </div>
                </div>
                <div className="assist-feat">
                  <span className="assist-feat-icon-wrap">
                    <Lock size={24} strokeWidth={1.5} />
                  </span>
                  <div>
                    <strong>Secure Booking</strong>
                    <span>Book with confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== AI COORDINATOR FEATURE ========== */}
      <section className="section coord" id="coordinator">
        <div className="wrap">
          <Reveal>
            <div className="coord-card">
              {/* Background Watercolor Ocean Pattern */}
              <div className="coord-bg-img" aria-hidden="true">
                <Image
                  src="/images/pattern2.jpeg"
                  alt="Coastal Ocean Art Pattern"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  quality={80}
                  className="object-cover object-center"
                />
                <div className="coord-bg-overlay" />
              </div>

              <div className="coord-frond">
                <Frond stroke="#d6bb6e" />
              </div>
              <div className="coord-copy">
                <span className="eyebrow">
                  Featured · AI Event Coordinator
                </span>
                <h2 className="display">
                  Plan your event in a moment, not a month.
                </h2>
                <p>
                  Weddings, conferences, and celebrations by the sea — our
                  coordinator recommends the venue, menu, and décor for your
                  party and budget, and prices it instantly.
                </p>
                <Link href="/events" className="btn btn-gold">
                  <Sparkles size={18} strokeWidth={2} />
                  Open the coordinator
                </Link>
              </div>
              <div className="coord-features">
                {FEATURES.map((f, i) => {
                  const IconComp = f.icon;
                  return (
                    <div className="coord-feat" key={i}>
                      <span className="coord-feat-icon">
                        <IconComp size={24} strokeWidth={1.5} />
                      </span>
                      <div>
                        <h4>{f.title}</h4>
                        <p>{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ========== TESTIMONIALS — inspired by Luxury Resort / Modern Travel ========== */}
      <section className="section testimonials-section" id="testimonials">
        <div className="wrap">
          <Reveal>
            <div className="section-header">
              <div>
                <span className="eyebrow">What our guests say</span>
                <h2 className="display">
                  Memories That Last a Lifetime
                </h2>
              </div>
              <Link href="/events" className="view-all-link">
                View all reviews <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </div>
          </Reveal>
          <TestimonialCarousel testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* ========== TRUST BADGES — inspired by Modern Travel UI ========== */}
      <section className="trust-section">
        <div className="wrap">
          <div className="trust-grid">
            {[
              { icon: Trophy, title: "Award-Winning Venues", sub: "Top-rated in Sri Lanka" },
              { icon: ShieldCheck, title: "Best Price Guarantee", sub: "Transparent pricing" },
              { icon: Smile, title: "Trusted by 500+", sub: "Happy event hosts" },
              { icon: Lock, title: "Secure Reservations", sub: "100% safe & secure" },
            ].map((t, i) => {
              const IconComp = t.icon;
              return (
                <Reveal key={t.title} delay={i * 80}>
                  <div className="trust-item">
                    <span className="trust-icon-wrap">
                      <IconComp size={24} strokeWidth={1.5} />
                    </span>
                    <div>
                      <strong>{t.title}</strong>
                      <span>{t.sub}</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== NEWSLETTER CTA ========== */}
      <section className="cta-band">
        <div className="wrap">
          <Reveal>
            <div className="newsletter-card">
              <div className="newsletter-icon">
                <Mail size={48} strokeWidth={1} />
              </div>
              <div className="newsletter-copy">
                <span className="eyebrow" style={{ color: "var(--gold)" }}>
                  Stay updated
                </span>
                <h2 className="display">Subscribe to Our Newsletter</h2>
                <p>
                  Get the latest event packages and seasonal offers straight to
                  your inbox.
                </p>
              </div>
              <div className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  aria-label="Email address"
                />
                <button className="btn btn-gold">Subscribe</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
