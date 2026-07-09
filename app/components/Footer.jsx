import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <span className="brand-name">St. Lachland</span>
            <p className="addr">Grand Estate Road, Nuwara Eliya<br />Central Province, Sri Lanka</p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li><a href="/#stay">Accommodation</a></li>
              <li><a href="/#dining">Dining</a></li>
              <li><a href="/#experiences">Experiences</a></li>
              <li><Link href="/events">Event Coordinator</Link></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li><a href="tel:+94520000000">+94 52 000 0000</a></li>
              <li><a href="mailto:stay@stlachland.lk">stay@stlachland.lk</a></li>
              <li><a href="mailto:events@stlachland.lk">events@stlachland.lk</a></li>
            </ul>
          </div>
          <div>
            <h5>Newsletter</h5>
            <p style={{ fontSize: "0.9rem", marginBottom: 6 }}>Seasonal offers and estate news.</p>
            <div className="foot-form">
              <input type="email" placeholder="Your email" aria-label="Email address" />
              <button aria-label="Subscribe">→</button>
            </div>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} St. Lachland Hotel. All rights reserved.</span>
          <span>Nuwara Eliya · Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
