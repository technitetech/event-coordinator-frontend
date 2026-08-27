import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <span className="brand-name">St. Lachland</span>
            <p className="addr">Porutota Road, Ethukala, Negombo<br />Western Province, Sri Lanka</p>
            <p className="text-2xs text-stone-400 mt-2">Boutique Luxury Sanctuary &amp; Beachfront Coastal Resort</p>
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
              <li><a href="tel:+94312220000">+94 31 222 0000</a></li>
              <li><a href="mailto:stay@stlachland.lk">stay@stlachland.lk</a></li>
              <li><a href="mailto:dining@stlachland.lk">dining@stlachland.lk</a></li>
              <li><a href="mailto:events@stlachland.lk">events@stlachland.lk</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} St. Lachland Hotel. All rights reserved.</span>
          <span>Negombo · Golden Coast · Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
