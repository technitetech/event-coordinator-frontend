import Link from "next/link";
import { getMenuWithCategories } from "../../../lib/restaurant";
import MenuItemCard from "../../components/MenuItemCard";
import { Utensils, Clock, Wine, Sparkles, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Fine Dining & Ceylon High Tea — St. Lachland Hotel",
  description: "Experience artisanal hill-country dining. Savor estate-grown spices, fresh coastal seafood, and rare single-origin Ceylon tea pairings.",
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
          <span className="eyebrow">Gastronomy &amp; Tea Pairings</span>
          <h1 className="display">The Dining Room &amp; Highland Terrace</h1>
          <p className="max-w-2xl mx-auto">
            From sunrise Ceylon hoppers to candlelit Jaffna crab feasts and heirloom tea ceremonies — every dish honors the rich culinary tapestry of the Central Highlands.
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
              <h4 className="font-serif font-bold text-base text-emerald">Highland Breakfast</h4>
              <p className="text-xs text-mist">07:00 – 10:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Colonial &amp; Sri Lankan</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Utensils size={20} className="text-emerald mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Estate Lunch</h4>
              <p className="text-xs text-mist">12:00 – 15:00 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">A la carte &amp; seasonal salads</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Sparkles size={20} className="text-gold mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">High Tea Ceremony</h4>
              <p className="text-xs text-mist">15:30 – 17:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Single-estate tea flights</span>
            </div>

            <div className="p-5 bg-white border border-line rounded-xl">
              <Wine size={20} className="text-emerald mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base text-emerald">Fine Dining Dinner</h4>
              <p className="text-xs text-mist">18:30 – 22:30 Daily</p>
              <span className="text-2xs text-stone-500 block mt-1">Candlelit fireside seating</span>
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
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Soil to Table</span>
          <h2 className="display text-3xl md:text-4xl text-ivory">Estate-Grown Botanical Ingredients</h2>
          <p className="text-sm md:text-base leading-relaxed opacity-90">
            Over 60% of our organic herbs, seasonal highland vegetables, and artisanal teas are cultivated directly within the St. Lachland estate grounds. Our culinary team partners closely with local fishermen from the southern shores to bring freshly caught seer fish and lagoon crabs each morning.
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
