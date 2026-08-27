import Link from "next/link";
import { getMenuWithCategories } from "../../../lib/restaurant";
import MenuItemCard from "../../components/MenuItemCard";
import { Utensils, Clock, Wine, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Fine Dining & Ceylon Coastal Flavors — St. Lachland Hotel",
  description: "Experience artisanal beachfront dining in Negombo. Savor fresh lagoon crab, coastal seafood catches, organic spices, and rare single-origin Ceylon tea pairings.",
};

export default async function DiningPage() {
  const categories = await getMenuWithCategories();

  // Extract signature items across categories
  const signatureItems = [];
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.is_signature && signatureItems.length < 4) {
        signatureItems.push(item);
      }
    });
  });

  return (
    <main className="dining-page">
      {/* Hero */}
      <section className="tool-hero bg-emerald text-ivory">
        <div className="wrap text-center">
          <span className="eyebrow">Coastal Gastronomy &amp; Sunset Dining</span>
          <h1 className="display">The Ocean Dining Room &amp; Beachfront Terrace</h1>
          <p className="max-w-2xl mx-auto">
            From sunrise Ceylon hoppers and fresh lagoon seafood to candlelit Negombo crab feasts and tropical sunset cocktails — every dish honors the rich culinary heritage of Sri Lanka&rsquo;s golden coast.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link href="/dining/reserve" className="btn btn-gold">
              <Utensils size={16} />
              <span>Reserve a Table</span>
            </Link>
            <Link href="/dining/menu" className="btn btn-ghost">
              <span>View Full Menu</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Service Hours Grid */}
      <section className="py-12 bg-stone-50 border-b border-line">
        <div className="wrap">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-5 bg-white border border-line rounded-xl">
              <Clock size={20} className="text-emerald mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Coastal Breakfast</h4>
              <p className="text-xs text-mist">07:00 – 10:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Tropical &amp; Sri Lankan</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Utensils size={20} className="text-emerald mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Lagoon &amp; Ocean Lunch</h4>
              <p className="text-xs text-mist">12:00 – 15:00 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">A la carte &amp; seafood specialties</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Sparkles size={20} className="text-gold mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Sunset High Tea</h4>
              <p className="text-xs text-mist">15:30 – 17:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Artisan Ceylon tea flights</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Wine size={20} className="text-emerald mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Beachfront Dinner</h4>
              <p className="text-xs text-mist">18:30 – 22:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Candlelit oceanfront seating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Signature Dishes Showcase */}
      <section className="py-20">
        <div className="wrap">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-12">
            <div>
              <span className="eyebrow">Chef&rsquo;s Selection</span>
              <h2 className="display">Signature Creations</h2>
            </div>
            <Link href="/dining/menu" className="btn btn-ghost text-sm">
              <span>Explore All {categories.reduce((acc, c) => acc + c.items.length, 0)} Dishes</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {signatureItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy / Atmosphere banner */}
      <section className="py-20 bg-emerald text-ivory">
        <div className="wrap max-w-3xl text-center space-y-6">
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Ocean &amp; Lagoon Harvest</span>
          <h2 className="display text-3xl md:text-4xl text-ivory">Fresh Coastal Seafood &amp; Botanical Spices</h2>
          <p className="text-sm md:text-base leading-relaxed opacity-90">
            Our culinary team partners closely with artisanal local fishermen from the Negombo lagoon and coastal shores to bring freshly caught jumbo prawns, mud crabs, and ocean seer fish each morning. Every dish is seasoned with organic Ceylon spices and garden herbs.
          </p>
          <div className="pt-4">
            <Link href="/dining/reserve" className="btn btn-gold">
              Reserve Your Table Experience
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
