"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../../(public)/auth-actions";
import {
  LayoutDashboard,
  CalendarCheck,
  UtensilsCrossed,
  BarChart3,
  Database,
  LogOut,
  ExternalLink,
  ChefHat,
  BedDouble,
} from "lucide-react";

export default function AdminSidebar({ name }) {
  const pathname = usePathname();
  const router = useRouter();

  const doLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const isActive = (path) => pathname === path;
  const linkClass = (active) => `ad-nav-link ${active ? "active" : ""}`;

  return (
    <aside className="ad-side">
      <div className="ad-brand">
        <span className="brand-mark">SL</span>
        <div>
          <div className="ad-brand-name">St. Lachland</div>
          <div className="ad-brand-sub">Admin Console{name ? ` · ${name}` : ""}</div>
        </div>
      </div>

      <nav className="ad-nav">
        <div className="ad-nav-section-title">Operations</div>
        <Link href="/admin" className={linkClass(isActive("/admin"))}>
          <LayoutDashboard size={16} />
          <span>Dashboard Overview</span>
        </Link>
        <Link href="/admin/bookings" className={linkClass(isActive("/admin/bookings"))}>
          <CalendarCheck size={16} />
          <span>Unified Bookings Hub</span>
        </Link>
        <Link href="/admin/restaurant" className={linkClass(isActive("/admin/restaurant"))}>
          <UtensilsCrossed size={16} />
          <span>Kitchen Ticket Board</span>
        </Link>
        <Link href="/admin/menu" className={linkClass(isActive("/admin/menu"))}>
          <ChefHat size={16} />
          <span>Menu Management</span>
        </Link>
        <Link href="/admin/rooms" className={linkClass(isActive("/admin/rooms"))}>
          <BedDouble size={16} />
          <span>Room Management</span>
        </Link>
        <Link href="/admin/revenue" className={linkClass(isActive("/admin/revenue"))}>
          <BarChart3 size={16} />
          <span>Revenue Analytics</span>
        </Link>

        <div className="ad-nav-section-title mt-4">Master Records</div>
        <Link href="/admin/stay_bookings" className={linkClass(isActive("/admin/stay_bookings"))}>
          <Database size={14} />
          <span>Stay Records</span>
        </Link>
        <Link href="/admin/event_bookings" className={linkClass(isActive("/admin/event_bookings"))}>
          <Database size={14} />
          <span>Event Records</span>
        </Link>
        <Link href="/admin/dining_reservations" className={linkClass(isActive("/admin/dining_reservations"))}>
          <Database size={14} />
          <span>Dining Tables</span>
        </Link>
        <Link href="/admin/users" className={linkClass(isActive("/admin/users"))}>
          <Database size={14} />
          <span>Users &amp; Staff</span>
        </Link>
      </nav>

      <div className="ad-side-foot">
        <Link href="/" className="ad-nav-link subtle">
          <ExternalLink size={14} />
          <span>View Public Site</span>
        </Link>
        <button type="button" className="ad-nav-link subtle logout" onClick={doLogout}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
