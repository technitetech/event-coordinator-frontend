import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link href="/" className="footer-brand block mb-4" aria-label="St. Lachlan Hotel & Suites">
              <Image
                src="/images/logo_white.png"
                alt="St. Lachlan Hotel & Suites"
                width={170}
                height={55}
                className="footer-brand-logo"
              />
            </Link>
            <p className="addr">
              No.25 St.Anthoney&apos;s road, Eththukala,<br />
              Negombo, Sri Lanka
            </p>
            <p className="text-2xs text-stone-400 mt-2">
              Official Website:{" "}
              <a
                href="https://www.stlachlanhotelnegombo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline hover:text-white transition-colors"
              >
                stlachlanhotelnegombo.com
              </a>
            </p>
          </div>
          <div>
            <h5>Sanctuary &amp; Dining</h5>
            <ul>
              <li><Link href="/rooms">Accommodation &amp; Suites</Link></li>
              <li><Link href="/dining">The Ocean Dining Room</Link></li>
              <li><Link href="/dining/menu">A La Carte Menu</Link></li>
              <li><Link href="/dining/reserve">Table Reservations</Link></li>
            </ul>
          </div>
          <div>
            <h5>Events &amp; Guests</h5>
            <ul>
              <li><Link href="/events">AI Event Coordinator</Link></li>
              <li><Link href="/events/feedback">Guest Feedback System</Link></li>
              <li><Link href="/account">Customer Portal</Link></li>
              <li><Link href="/admin/login">Admin Console</Link></li>
            </ul>
          </div>
          <div>
            <h5>Contact &amp; Reservations</h5>
            <ul>
              <li><a href="tel:+94312275000">+94 31 227 5000</a></li>
              <li><a href="tel:+9433603505454">+94 33 6035 05454</a></li>
              <li><a href="mailto:info@stlachlanhotelnegombo.com">info@stlachlanhotelnegombo.com</a></li>
              <li><a href="mailto:reservations@stlachlanhotelnegombo.com">reservations@stlachlanhotelnegombo.com</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} St. Lachlan Hotel &amp; Suites. All rights reserved.</span>
          <span>No.25 St.Anthoney&apos;s road, Eththukala, Negombo, Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
