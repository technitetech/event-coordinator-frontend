"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStats } from "../actions";
import { NAV_ITEMS } from "../resources";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <div className="ad-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of the estate&rsquo;s data</p>
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="stat-grid">
        {NAV_ITEMS.map((item) => {
          const count = stats ? stats[item.key] : null;
          return (
            <Link href={`/admin/${item.key}`} className="stat-card" key={item.key}>
              <span className="stat-num">{stats == null ? "…" : count == null ? "—" : count}</span>
              <span className="stat-label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {stats && stats.users == null && (
        <div className="ad-note">
          The <strong>users</strong> table isn&rsquo;t set up yet. Run
          <code> admin_migration.sql </code> in MySQL Workbench to enable user management.
        </div>
      )}
    </div>
  );
}
