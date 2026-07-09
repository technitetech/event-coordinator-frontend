import Link from "next/link";
import Reveal from "../components/Reveal.jsx";
import Frond from "../components/Frond.jsx";

const ROOMS = [
  { kicker: "Garden wing", name: "Garden Suite", img: "img-a",
    desc: "A serene suite opening onto the tea gardens, with a private veranda and clawfoot bath.",
    price: "48,000" },
  { kicker: "Heritage wing", name: "Colonial Villa", img: "img-f",
    desc: "Restored 1920s villa with a fireplace, four-poster bed, and butler service on call.",
    price: "72,000" },
  { kicker: "Estate loft", name: "Tea-Estate Loft", img: "img-d",
    desc: "A light-filled loft above the estate, framing uninterrupted views of the misted hills.",
    price: "56,000" },
];

const VENUES = [
  { name: "The Conservatory", desc: "Ceylon-inspired fine dining under glass" },
  { name: "High Tea Lawn", desc: "Afternoon tea on the colonial lawn" },
  { name: "Cellar & Bar", desc: "Estate spirits and rare Ceylon teas" },
];

const EXPERIENCES = [
  { name: "Estate High Tea", desc: "A curated tasting of single-estate Ceylon teas with the head planter." },
  { name: "Lake & Boathouse", desc: "Private rowing and sunrise breakfasts on Lake Gregory." },
  { name: "Cloud-Forest Trails", desc: "Guided treks through Horton Plains and the surrounding highlands." },
  { name: "The Spa at Lachland", desc: "Ayurvedic rituals drawing on local herbs and warm stone." },
  { name: "Planter's Table", desc: "A chef's-garden dinner sourced entirely from the estate." },
  { name: "Vintage Motoring", desc: "Tour the hill country in a restored classic car with a driver." },
];

const FEATURES = [
  { n: "01", h: "Instant venue match", p: "Enter guests and budget — the coordinator matches the right hall or lawn from our live availability." },
  { n: "02", h: "Transparent estimate", p: "An itemised cost for venue, menu, and décor, with a clear within-budget verdict." },
  { n: "03", h: "Seasonal intelligence", p: "It flags monsoon dates, moves outdoor plans indoors, and warns of clashes automatically." },
];

const GALLERY = [
  { c: "img-a", cls: "tall" }, { c: "img-c", cls: "" }, { c: "img-d", cls: "" },
  { c: "img-e", cls: "wide" }, { c: "img-f", cls: "" }, { c: "img-b", cls: "" },
];

export default function Home() {
  return (
    <main>
      {/* ---------- HERO ---------- */}
      <header className="hero">
        <div className="hero-frond"><Frond stroke="#d6bb6e" /></div>
        <div className="wrap">
          <div className="hero-content">
            <Reveal>
              <span className="eyebrow">Nuwara Eliya · Sri Lanka</span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="display">Where the hills<br />keep their secrets.</h1>
            </Reveal>
            <Reveal delay={240}>
              <p className="sub">
                A colonial-era estate reborn as a hill-country retreat — misted tea
                gardens, quiet luxury, and celebrations worth the journey.
              </p>
            </Reveal>
            <Reveal delay={360}>
              <div className="hero-actions">
                <Link href="/events" className="btn btn-gold">Plan an event</Link>
                <a href="/#stay" className="btn btn-light">Explore the estate</a>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="scroll-cue"><span>Scroll</span><span className="bar" /></div>
      </header>

      {/* ---------- WELCOME ---------- */}
      <section className="section">
        <div className="wrap welcome-grid">
          <Reveal className="welcome-copy">
            <span className="eyebrow">A century in the hills</span>
            <h2 className="display">An estate that has always known how to host.</h2>
            <p>
              Set among working tea gardens at 1,900 metres, St. Lachland began as a
              planter's residence in 1904. Today it keeps the same unhurried grace —
              wood fires, long verandas, and mornings that arrive wrapped in cloud.
            </p>
            <p>
              Forty-two rooms, three dining rooms, and grounds made for gathering.
              Whatever the occasion, the estate rises to it.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="welcome-panel">
              <div className="frond-deco"><Frond stroke="#d6bb6e" /></div>
              <div className="panel-tag">
                <div className="num">1904</div>
                <div className="lbl">Est. in the highlands</div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- ROOMS ---------- */}
      <section className="section rooms" id="stay">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">Accommodation</span>
            <h2 className="display">Rooms with a view of the weather.</h2>
            <p>Each room is its own retreat — restored with care, warmed against the highland chill.</p>
          </Reveal>
          <div className="room-grid">
            {ROOMS.map((r, i) => (
              <Reveal key={r.name} delay={i * 120}>
                <article className="room-card">
                  <div className={`room-img ${r.img}`}>
                    <div className="frond-deco"><Frond stroke="#ffffff" /></div>
                  </div>
                  <div className="room-body">
                    <span className="kicker">{r.kicker}</span>
                    <h3 className="display">{r.name}</h3>
                    <p>{r.desc}</p>
                    <div className="room-foot">
                      <span className="room-price">LKR {r.price} <span>/ night</span></span>
                      <Link href="/events" className="room-link">Enquire</Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DINING ---------- */}
      <section className="section dining" id="dining">
        <div className="wrap dining-grid">
          <Reveal>
            <span className="eyebrow">Dining</span>
            <h2 className="display">Grown on the estate,<br />served by the fire.</h2>
            <p>
              Our kitchens cook from the estate's own gardens and the day's best
              highland produce — Ceylon classics reimagined, and afternoon tea taken
              as seriously as it deserves.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <ul className="venue-list">
              {VENUES.map((v) => (
                <li key={v.name}>
                  <span className="venue-name">{v.name}</span>
                  <span className="venue-desc">{v.desc}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ---------- EXPERIENCES ---------- */}
      <section className="section" id="experiences">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">Experiences</span>
            <h2 className="display">Reasons to leave your veranda.</h2>
          </Reveal>
          <div className="exp-grid">
            {EXPERIENCES.map((e, i) => (
              <Reveal key={e.name} delay={(i % 3) * 100}>
                <div className="exp-cell">
                  <div className="exp-icon">
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M12 3v18M5 8c3 0 4 2 7 2s4-2 7-2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3>{e.name}</h3>
                  <p>{e.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- EVENT COORDINATOR (signature feature) ---------- */}
      <section className="section coord">
        <div className="wrap">
          <Reveal>
            <div className="coord-card">
              <div className="coord-frond"><Frond stroke="#d6bb6e" /></div>
              <div className="coord-copy">
                <span className="eyebrow">Featured · AI Event Coordinator</span>
                <h2 className="display">Plan your event in a moment, not a month.</h2>
                <p>
                  Weddings, conferences, and celebrations on the estate — our
                  coordinator recommends the venue, menu, and décor for your party
                  and budget, and prices it instantly.
                </p>
                <Link href="/events" className="btn btn-gold">Open the coordinator</Link>
              </div>
              <div className="coord-features">
                {FEATURES.map((f) => (
                  <div className="coord-feat" key={f.n}>
                    <span className="fn">{f.n}</span>
                    <div>
                      <h4>{f.h}</h4>
                      <p>{f.p}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- GALLERY ---------- */}
      <section className="section">
        <div className="wrap">
          <Reveal className="section-head">
            <span className="eyebrow">The estate</span>
            <h2 className="display">A closer look.</h2>
          </Reveal>
          <Reveal>
            <div className="gallery-grid">
              {GALLERY.map((g, i) => (
                <div key={i} className={`gtile ${g.c} ${g.cls}`}>
                  <div className="frond-deco"><Frond stroke="#ffffff" /></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- TESTIMONIAL ---------- */}
      <section className="section">
        <div className="wrap">
          <Reveal className="quote">
            <div className="mark">&ldquo;</div>
            <blockquote>
              We married on the lawn in the mist and it was the most beautiful day of
              our lives. The estate thought of everything before we could ask.
            </blockquote>
            <cite>Aisha &amp; Ravi — Wedding, 2024</cite>
          </Reveal>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="cta-band">
        <div className="wrap">
          <Reveal>
            <span className="eyebrow">Your visit begins here</span>
            <h2 className="display">Come up to the hills.</h2>
            <p>
              Reserve a room, book a table, or start planning a celebration — the
              estate is ready when you are.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/events" className="btn btn-gold">Plan an event</Link>
              <a href="/#stay" className="btn btn-light">Reserve a stay</a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
