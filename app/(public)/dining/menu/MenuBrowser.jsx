"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MenuItemCard from "../../../components/MenuItemCard";
import { Search, Utensils, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";

export default function MenuBrowser({ categories }) {
  const router = useRouter();

  const [selectedCat, setSelectedCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterSignatureOnly, setFilterSignatureOnly] = useState(false);

  const [cart, setCart] = useState({}); // { itemId: { item, count } }

  const handleAddItem = (item) => {
    setCart((prev) => {
      const existing = prev[item.id];
      return { ...prev, [item.id]: { item, count: existing ? existing.count + 1 : 1 } };
    });
  };

  const handleRemoveItem = (itemId) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.count <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...existing, count: existing.count - 1 } };
    });
  };

  const handleClearCart = () => setCart({});

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, { item, count }) => sum + Number(item.price) * count, 0);
  const cartItemCount = cartItems.reduce((sum, { count }) => sum + count, 0);

  const handleProceedToReserve = () => {
    // Persist cart across the navigation boundary via localStorage.
    // ReservationForm reads this on mount, calls placeOrder after booking.
    const payload = cartItems.map(({ item, count }) => ({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: count,
    }));
    try {
      localStorage.setItem("dining_preorder_cart", JSON.stringify(payload));
    } catch {}
    router.push("/dining/reserve");
  };

  // Filter items
  const allItems = categories.flatMap((c) =>
    c.items.map((i) => ({ ...i, category_slug: c.slug, category_name: c.name }))
  );

  const filteredItems = allItems.filter((item) => {
    if (selectedCat !== "all" && item.category_slug !== selectedCat) return false;
    if (filterVegOnly && !item.is_vegetarian) return false;
    if (filterSignatureOnly && !item.is_signature) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (!item.name.toLowerCase().includes(term) && !item.description?.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  return (
    <div className="menu-browser-container">
      {/* Filter Bar */}
      <div className="bg-white border border-line rounded-xl p-6 mb-10 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm focus:outline-none focus:border-emerald"
            />
          </div>

          {/* Dietary Filters */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterVegOnly}
                onChange={(e) => setFilterVegOnly(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald text-sm leading-none">eco</span>
                Vegetarian Only
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterSignatureOnly}
                onChange={(e) => setFilterSignatureOnly(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-gold text-sm leading-none">stars</span>
                Signature Dishes
              </span>
            </label>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          <button
            type="button"
            className={`btn btn-sm whitespace-nowrap ${selectedCat === "all" ? "btn-solid" : "btn-ghost"}`}
            onClick={() => setSelectedCat("all")}
          >
            All Courses ({allItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`btn btn-sm whitespace-nowrap ${selectedCat === cat.slug ? "btn-solid" : "btn-ghost"}`}
              onClick={() => setSelectedCat(cat.slug)}
            >
              {cat.name} ({cat.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid + Basket Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Dishes Grid */}
        <div className={cartItemCount > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-line rounded-xl">
              <Utensils size={32} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 text-sm">No dishes match your filters.</p>
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-4"
                onClick={() => {
                  setSelectedCat("all");
                  setSearchTerm("");
                  setFilterVegOnly(false);
                  setFilterSignatureOnly(false);
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddItem}
                  onRemove={handleRemoveItem}
                  count={cart[item.id]?.count || 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Pre-Order Basket */}
        {cartItemCount > 0 && (
          <aside className="sticky top-28 bg-white border border-emerald rounded-xl p-5 shadow-md">
            {/* Basket header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald" />
                <h3 className="font-serif font-bold text-lg text-emerald">Pre-Order</h3>
                <span className="bg-emerald text-white text-2xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearCart}
                className="text-2xs text-mist hover:text-red-500 flex items-center gap-1 transition-colors"
                title="Clear basket"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>

            {/* Line items */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 text-xs">
              {cartItems.map(({ item, count }) => (
                <div key={item.id} className="flex justify-between items-center gap-2 border-b border-stone-100 pb-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block truncate">{item.name}</span>
                    <span className="text-mist">
                      LKR {Number(item.price).toLocaleString()} × {count}
                      <span className="ml-1 text-stone-600 font-medium">
                        = LKR {(Number(item.price) * count).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center border border-line rounded hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors font-bold"
                    >
                      −
                    </button>
                    <span className="w-4 text-center font-bold">{count}</span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="w-6 h-6 flex items-center justify-center border border-emerald rounded bg-emerald/5 hover:bg-emerald hover:text-white transition-colors text-emerald font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-line pt-3 mt-3 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-sm text-emerald">
                <span>Pre-Order Subtotal</span>
                <span>LKR {cartTotal.toLocaleString()}</span>
              </div>
              <p className="text-2xs text-stone-400">
                Tax & service charge applied at checkout.
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleProceedToReserve}
              className="btn btn-solid w-full justify-center mt-4 text-xs py-2.5"
            >
              Reserve Table & Attach Pre-Order
              <ArrowRight size={14} />
            </button>

            <Link
              href="/dining/reserve"
              className="block text-center text-2xs text-mist hover:text-emerald mt-2 transition-colors"
            >
              Reserve a table only (without pre-order)
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
