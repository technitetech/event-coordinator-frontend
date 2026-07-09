"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../(public)/auth-actions";

const SECTIONS = [
  { href: "/#stay", label: "Stay" },
  { href: "/#dining", label: "Dining" },
  { href: "/#experiences", label: "Experiences" },
];

export default function Nav({ session }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="St. Lachland Hotel — home">
          <span className="brand-mark">SL</span>
          <span className="brand-name">St.&nbsp;<span className="thin">Lachland</span></span>
        </Link>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {SECTIONS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <Link href="/events" className="nav-link" onClick={() => setOpen(false)}>Events</Link>

          {session ? (
            <>
              <Link href="/account" className="nav-link" onClick={() => setOpen(false)}>
                {session.name.split(" ")[0]}
              </Link>
              <button className="btn btn-gold nav-cta" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/register" className="btn btn-gold nav-cta" onClick={() => setOpen(false)}>Register</Link>
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
