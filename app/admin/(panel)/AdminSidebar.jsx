"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "../resources";
import { logout } from "../../(public)/auth-actions";

export default function AdminSidebar({ name }) {
  const pathname = usePathname();
  const router = useRouter();

  const doLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const linkClass = (active) => `ad-nav-link ${active ? "active" : ""}`;

  return (
    <aside className="ad-side">
      <div className="ad-brand">
        <span className="brand-mark">SL</span>
        <div>
          <div className="ad-brand-name">St. Lachland</div>
          <div className="ad-brand-sub">Admin{name ? ` · ${name}` : ""}</div>
        </div>
      </div>

      <nav className="ad-nav">
        <Link href="/admin" className={linkClass(pathname === "/admin")}>Dashboard</Link>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={`/admin/${item.key}`}
            className={linkClass(pathname === `/admin/${item.key}`)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="ad-side-foot">
        <Link href="/" className="ad-nav-link subtle">← View site</Link>
        <button className="ad-nav-link subtle logout" onClick={doLogout}>Log out</button>
      </div>
    </aside>
  );
}
