import { getMenuWithCategories } from "../../../../lib/restaurant";
import MenuBrowser from "./MenuBrowser";
import Link from "next/link";
import { ArrowLeft, Utensils } from "lucide-react";

export const metadata = {
  title: "Restaurant Menu — St. Lachland Hotel",
  description: "Browse our complete coastal a la carte dining menu, Negombo lagoon seafood specialties, and chef signature creations.",
};

export default async function MenuPage() {
  const categories = await getMenuWithCategories();

  return (
    <main className="menu-page py-12">
      <div className="wrap">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Link href="/dining" className="inline-flex items-center gap-2 text-xs text-mist hover:text-emerald mb-2">
              <ArrowLeft size={14} />
              <span>Back to Dining Overview</span>
            </Link>
            <h1 className="display text-3xl md:text-4xl text-emerald">The Coastal Dining Menu</h1>
            <p className="text-sm text-mist">Crafted daily using fresh lagoon seafood, coastal catches, and artisanal Ceylon spices.</p>
          </div>

          <Link href="/dining/reserve" className="btn btn-gold btn-sm">
            <Utensils size={14} />
            <span>Reserve a Table</span>
          </Link>
        </div>

        {/* Interactive Menu Browser */}
        <MenuBrowser categories={categories} />
      </div>
    </main>
  );
}
