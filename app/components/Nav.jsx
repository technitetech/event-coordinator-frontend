"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "../(public)/auth-actions";
import { Shield } from "lucide-react";

export default function Nav({ session }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  // Only the homepage has a full-bleed hero behind the nav — every other
  // page needs the solid nav background from the first frame, otherwise
  // the transparent nav is unreadable against light page content.
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const doLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className={`nav ${scrolled || !isHome ? "scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="St. Lachland Hotel — home">
          <span className="brand-mark">SL</span>
          <span className="brand-name">St.&nbsp;<span className="thin">Lachland</span></span>
        </Link>

        <div className={`nav-links ${open ? "open" : ""}`}>
          <Link href="/rooms" className="nav-link" onClick={() => setOpen(false)}>
            Rooms &amp; Suites
          </Link>
          <Link href="/dining" className="nav-link" onClick={() => setOpen(false)}>
            Dining &amp; Tea
          </Link>
          <Link href="/events" className="nav-link" onClick={() => setOpen(false)}>
            AI Events
          </Link>
          <a href="/#experiences" className="nav-link" onClick={() => setOpen(false)}>
            Experiences
          </a>

          {session ? (
            <>
              {session.role === "admin" && (
                <Link
                  href="/admin"
                  className="nav-link text-gold font-bold flex items-center gap-1"
                  onClick={() => setOpen(false)}
                >
                  <Shield size={13} />
                  <span>Admin Console</span>
                </Link>
              )}
              <Link href="/account" className="nav-link font-semibold" onClick={() => setOpen(false)}>
                {session.name.split(" ")[0]}&rsquo;s Account
              </Link>
              <button type="button" className="btn btn-gold nav-cta" onClick={doLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/register" className="btn btn-gold nav-cta" onClick={() => setOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>

        <button className="nav-toggle" aria-label="Toggle menu" onClick={() => setOpen((o) => !o)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></>}
          </svg>
        </button>
      </div>
    </nav>
  );
}
