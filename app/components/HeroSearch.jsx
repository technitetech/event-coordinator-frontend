"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PartyPopper, Building2, Package, UtensilsCrossed,
  LayoutGrid, Calendar, Users, Wallet, Search, Clock, Utensils,
} from "lucide-react";

/* ── Tab definitions ─────────────────────────────────────────────── */
const TABS = [
  { id: "events",   label: "Events",   icon: PartyPopper    },
  { id: "venues",   label: "Venues",   icon: Building2      },
  { id: "packages", label: "Packages", icon: Package        },
  { id: "dining",   label: "Dining",   icon: UtensilsCrossed },
];

/* ── Per-tab field configs ───────────────────────────────────────── */
const EVENT_TYPES = [
  { value: "wedding",    label: "Wedding"        },
  { value: "conference", label: "Conference"     },
  { value: "birthday",   label: "Birthday"       },
  { value: "dinner",     label: "Gala Dinner"    },
  { value: "corporate",  label: "Corporate Event"},
];

const VENUES = [
  { value: "",              label: "Any Venue"          },
  { value: "ballroom",      label: "Crystal Ballroom"   },
  { value: "garden",        label: "Garden Terrace"     },
  { value: "grand-hall",    label: "Grand Hall"         },
  { value: "conservatory",  label: "The Conservatory"   },
  { value: "spa-pavilion",  label: "Spa Pavilion"       },
];

const PACKAGE_TYPES = [
  { value: "wedding",    label: "Wedding Package"   },
  { value: "corporate",  label: "Corporate Package" },
  { value: "birthday",   label: "Birthday Package"  },
  { value: "honeymoon",  label: "Honeymoon Package" },
  { value: "dinner",     label: "Gala Dinner"       },
];

const GUEST_RANGES = [
  { value: "25",  label: "Up to 50"   },
  { value: "100", label: "51 – 150"   },
  { value: "200", label: "151 – 300"  },
  { value: "400", label: "301 – 500"  },
];

const BUDGETS = [
  { value: "100000",  label: "Under 100K"   },
  { value: "250000",  label: "100K – 250K"  },
  { value: "350000",  label: "250K – 500K"  },
  { value: "750000",  label: "500K+"        },
];

const PARTY_SIZES = [
  { value: "2",  label: "1 – 2 guests"  },
  { value: "4",  label: "3 – 5 guests"  },
  { value: "8",  label: "6 – 10 guests" },
  { value: "15", label: "10+ guests"    },
];

const MEAL_TYPES = [
  { value: "breakfast",      label: "Breakfast"      },
  { value: "lunch",          label: "Lunch"          },
  { value: "dinner",         label: "Dinner"         },
  { value: "brunch",         label: "Brunch"         },
  { value: "private-dining", label: "Private Dining" },
];

const today = () => new Date().toISOString().split("T")[0];

export default function HeroSearch() {
  const [activeTab, setActiveTab] = useState("events");
  const router = useRouter();

  // Per-tab form state
  const [eventsForm, setEventsForm] = useState({
    event_type: "wedding", event_date: "", guests: "100", budget: "350000",
  });
  const [venuesForm, setVenuesForm] = useState({
    venue: "", event_date: "", guests: "100", budget: "350000",
  });
  const [packagesForm, setPackagesForm] = useState({
    package_type: "wedding", event_date: "", guests: "100", budget: "350000",
  });
  const [diningForm, setDiningForm] = useState({
    meal_type: "dinner", date: "", covers: "2",
  });

  function handleSearch(e) {
    e.preventDefault();

    if (activeTab === "events") {
      const p = new URLSearchParams();
      if (eventsForm.event_type) p.set("event_type", eventsForm.event_type);
      if (eventsForm.event_date) p.set("event_date", eventsForm.event_date);
      if (eventsForm.guests)     p.set("guests",     eventsForm.guests);
      if (eventsForm.budget)     p.set("budget",     eventsForm.budget);
      router.push(`/events?${p}`);
    } else if (activeTab === "venues") {
      const p = new URLSearchParams();
      p.set("mode", "venues");
      if (venuesForm.venue)      p.set("venue",      venuesForm.venue);
      if (venuesForm.event_date) p.set("event_date", venuesForm.event_date);
      if (venuesForm.guests)     p.set("guests",     venuesForm.guests);
      if (venuesForm.budget)     p.set("budget",     venuesForm.budget);
      router.push(`/events?${p}`);
    } else if (activeTab === "packages") {
      const p = new URLSearchParams();
      p.set("mode", "packages");
      if (packagesForm.package_type) p.set("event_type",    packagesForm.package_type);
      if (packagesForm.event_date)   p.set("event_date",    packagesForm.event_date);
      if (packagesForm.guests)       p.set("guests",        packagesForm.guests);
      if (packagesForm.budget)       p.set("budget",        packagesForm.budget);
      router.push(`/events?${p}`);
    } else if (activeTab === "dining") {
      const p = new URLSearchParams();
      if (diningForm.date)      p.set("date",   diningForm.date);
      if (diningForm.covers)    p.set("covers", diningForm.covers);
      if (diningForm.meal_type) p.set("type",   diningForm.meal_type);
      router.push(`/dining/reserve?${p}`);
    }
  }

  return (
    <div className="hero-search" id="hero-search-bar">
      {/* Tab strip */}
      <div className="hero-search-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`hero-search-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form — switches based on active tab */}
      <form className="hero-search-form" onSubmit={handleSearch}>

        {/* ── EVENTS ───────────────────────────────────── */}
        {activeTab === "events" && <>
          <div className="hero-search-field">
            <label><LayoutGrid size={16} strokeWidth={2} /> EVENT TYPE</label>
            <div className="select-wrapper">
              <select value={eventsForm.event_type} onChange={e => setEventsForm(f => ({ ...f, event_type: e.target.value }))}>
                {EVENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Calendar size={16} strokeWidth={2} /> EVENT DATE</label>
            <input type="date" min={today()} value={eventsForm.event_date} onChange={e => setEventsForm(f => ({ ...f, event_date: e.target.value }))} />
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Users size={16} strokeWidth={2} /> GUESTS</label>
            <div className="select-wrapper">
              <select value={eventsForm.guests} onChange={e => setEventsForm(f => ({ ...f, guests: e.target.value }))}>
                {GUEST_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Wallet size={16} strokeWidth={2} /> BUDGET (LKR)</label>
            <div className="select-wrapper">
              <select value={eventsForm.budget} onChange={e => setEventsForm(f => ({ ...f, budget: e.target.value }))}>
                {BUDGETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </>}

        {/* ── VENUES ───────────────────────────────────── */}
        {activeTab === "venues" && <>
          <div className="hero-search-field">
            <label><Building2 size={16} strokeWidth={2} /> VENUE</label>
            <div className="select-wrapper">
              <select value={venuesForm.venue} onChange={e => setVenuesForm(f => ({ ...f, venue: e.target.value }))}>
                {VENUES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Calendar size={16} strokeWidth={2} /> EVENT DATE</label>
            <input type="date" min={today()} value={venuesForm.event_date} onChange={e => setVenuesForm(f => ({ ...f, event_date: e.target.value }))} />
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Users size={16} strokeWidth={2} /> CAPACITY</label>
            <div className="select-wrapper">
              <select value={venuesForm.guests} onChange={e => setVenuesForm(f => ({ ...f, guests: e.target.value }))}>
                {GUEST_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Wallet size={16} strokeWidth={2} /> BUDGET (LKR)</label>
            <div className="select-wrapper">
              <select value={venuesForm.budget} onChange={e => setVenuesForm(f => ({ ...f, budget: e.target.value }))}>
                {BUDGETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </>}

        {/* ── PACKAGES ─────────────────────────────────── */}
        {activeTab === "packages" && <>
          <div className="hero-search-field">
            <label><Package size={16} strokeWidth={2} /> PACKAGE TYPE</label>
            <div className="select-wrapper">
              <select value={packagesForm.package_type} onChange={e => setPackagesForm(f => ({ ...f, package_type: e.target.value }))}>
                {PACKAGE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Calendar size={16} strokeWidth={2} /> EVENT DATE</label>
            <input type="date" min={today()} value={packagesForm.event_date} onChange={e => setPackagesForm(f => ({ ...f, event_date: e.target.value }))} />
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Users size={16} strokeWidth={2} /> GUESTS</label>
            <div className="select-wrapper">
              <select value={packagesForm.guests} onChange={e => setPackagesForm(f => ({ ...f, guests: e.target.value }))}>
                {GUEST_RANGES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Wallet size={16} strokeWidth={2} /> BUDGET (LKR)</label>
            <div className="select-wrapper">
              <select value={packagesForm.budget} onChange={e => setPackagesForm(f => ({ ...f, budget: e.target.value }))}>
                {BUDGETS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </>}

        {/* ── DINING ───────────────────────────────────── */}
        {activeTab === "dining" && <>
          <div className="hero-search-field">
            <label><Utensils size={16} strokeWidth={2} /> MEAL TYPE</label>
            <div className="select-wrapper">
              <select value={diningForm.meal_type} onChange={e => setDiningForm(f => ({ ...f, meal_type: e.target.value }))}>
                {MEAL_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Calendar size={16} strokeWidth={2} /> DATE</label>
            <input type="date" min={today()} value={diningForm.date} onChange={e => setDiningForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="hero-search-divider" />
          <div className="hero-search-field">
            <label><Users size={16} strokeWidth={2} /> PARTY SIZE</label>
            <div className="select-wrapper">
              <select value={diningForm.covers} onChange={e => setDiningForm(f => ({ ...f, covers: e.target.value }))}>
                {PARTY_SIZES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </>}

        <button type="submit" className="hero-search-btn" id="hero-search-submit">
          <Search size={20} strokeWidth={2.5} />
          {activeTab === "dining" ? "Reserve Table" : "Search"}
        </button>
      </form>
    </div>
  );
}
