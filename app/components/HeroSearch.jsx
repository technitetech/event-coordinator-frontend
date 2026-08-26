"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartyPopper, Building2, Package, UtensilsCrossed, LayoutGrid, Calendar, Users, Wallet, Search } from "lucide-react";

const TABS = [
  { id: "events", label: "Events", icon: PartyPopper },
  { id: "venues", label: "Venues", icon: Building2 },
  { id: "packages", label: "Packages", icon: Package },
  { id: "dining", label: "Dining", icon: UtensilsCrossed },
];

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState("events");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    router.push("/events");
  };

  return (
    <div className="hero-search" id="hero-search-bar">
      <div className="hero-search-tabs">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`hero-search-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={18} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <form className="hero-search-form" onSubmit={handleSearch}>
        <div className="hero-search-field">
          <label><LayoutGrid size={16} strokeWidth={2} /> Event Type</label>
          <div className="select-wrapper">
            <select defaultValue="wedding">
              <option value="wedding">Wedding</option>
              <option value="conference">Conference</option>
              <option value="birthday">Birthday</option>
              <option value="dinner">Gala Dinner</option>
            </select>
          </div>
        </div>
        <div className="hero-search-divider" />
        <div className="hero-search-field">
          <label><Calendar size={16} strokeWidth={2} /> Event Date</label>
          <input type="date" />
        </div>
        <div className="hero-search-divider" />
        <div className="hero-search-field">
          <label><Users size={16} strokeWidth={2} /> Guests</label>
          <div className="select-wrapper">
            <select defaultValue="100">
              <option value="25">Up to 50</option>
              <option value="100">51 – 150</option>
              <option value="200">151 – 300</option>
              <option value="400">301 – 500</option>
            </select>
          </div>
        </div>
        <div className="hero-search-divider" />
        <div className="hero-search-field">
          <label><Wallet size={16} strokeWidth={2} /> Budget (LKR)</label>
          <div className="select-wrapper">
            <select defaultValue="350000">
              <option value="100000">Under 100K</option>
              <option value="250000">100K – 250K</option>
              <option value="350000">250K – 500K</option>
              <option value="750000">500K+</option>
            </select>
          </div>
        </div>
        <button type="submit" className="hero-search-btn" id="hero-search-submit">
          <Search size={20} strokeWidth={2.5} />
          Search
        </button>
      </form>
    </div>
  );
}
