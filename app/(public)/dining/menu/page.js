import { getMenuWithCategories } from "../../../../lib/restaurant";
import MenuBrowser from "./MenuBrowser";
import Link from "next/link";
import { ArrowLeft, Utensils, Leaf, Sparkles } from "lucide-react";

export const metadata = {
  title: "Restaurant Menu — St. Lachland Hotel",
  description: "Browse our complete coastal à la carte dining menu, Negombo lagoon seafood specialties, and chef signature creations.",
};

export default async function MenuPage() {
  const categories = await getMenuWithCategories();
  const totalItems = categories.reduce((a, c) => a + c.items.length, 0);
  const signatureCount = categories.reduce((a, c) => a + c.items.filter((i) => i.is_signature).length, 0);
  const vegCount = categories.reduce((a, c) => a + c.items.filter((i) => i.is_vegetarian).length, 0);

  return (
    <main>
      {/* ── Hero banner ──────────────────────────────────────────── */}
      <section
        className="menu-hero"
        style={{
          background: "linear-gradient(135deg, #1a3d2e 0%, #2d6a4f 50%, #52b788 100%)",
          padding: "56px 0 48px",
        }}
      >
        <div className="wrap">
          <Link
            href="/dining"
            className="inline-flex items-center gap-2 text-xs font-semibold mb-6"
            style={{ color: "rgba(255,255,255,.65)" }}
          >
            <ArrowLeft size={14} />
            Back to Dining Overview
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div>
              <span
                className="eyebrow mb-3 block"
                style={{ color: "var(--gold, #d4a017)", letterSpacing: ".12em" }}
              >
                The Ocean Dining Room &amp; Beachfront Terrace
              </span>
              <h1
                className="display mb-3"
                style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.15 }}
              >
                Coastal Dining Menu
              </h1>
              <p style={{ color: "rgba(255,255,255,.75)", fontSize: "14px", maxWidth: "520px", lineHeight: 1.65 }}>
                Crafted daily from fresh Negombo lagoon catches, coastal seafood, and artisanal Ceylon spices.
                Every dish tells a story of Sri Lanka&rsquo;s golden coastline.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-5 mt-5">
                <div style={{ color: "rgba(255,255,255,.85)" }}>
                  <span className="font-bold text-xl text-white">{totalItems}</span>
                  <span className="text-xs ml-1.5">Dishes</span>
                </div>
                <div style={{ color: "rgba(255,255,255,.85)" }}>
                  <span className="font-bold text-xl text-white">{signatureCount}</span>
                  <span className="text-xs ml-1.5 inline-flex items-center gap-1">
                    <Sparkles size={11} style={{ color: "var(--gold, #d4a017)" }} />
                    Signature
                  </span>
                </div>
                <div style={{ color: "rgba(255,255,255,.85)" }}>
                  <span className="font-bold text-xl text-white">{vegCount}</span>
                  <span className="text-xs ml-1.5 inline-flex items-center gap-1">
                    <Leaf size={11} style={{ color: "#86efac" }} />
                    Vegetarian
                  </span>
                </div>
                <div style={{ color: "rgba(255,255,255,.85)" }}>
                  <span className="font-bold text-xl text-white">{categories.length}</span>
                  <span className="text-xs ml-1.5">Courses</span>
                </div>
              </div>
            </div>

            <Link
              href="/dining/reserve"
              className="btn btn-gold shrink-0"
              style={{ fontWeight: 700, fontSize: "14px" }}
            >
              <Utensils size={15} />
              <span>Reserve a Table</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Menu browser ─────────────────────────────────────────── */}
      <section className="py-10" style={{ background: "#f9f8f6", minHeight: "60vh" }}>
        <div className="wrap">
          <MenuBrowser categories={categories} />
        </div>
      </section>
    </main>
  );
}
