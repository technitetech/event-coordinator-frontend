"use client";

import { useState } from "react";
import Link from "next/link";
import MenuItemCard from "../../../components/MenuItemCard";
import { Search, Filter, Utensils, ShoppingBag, ArrowRight } from "lucide-react";

export default function MenuBrowser({ categories }) {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterSignatureOnly, setFilterSignatureOnly] = useState(false);

  // Cart / Pre-order items
  const [cart, setCart] = useState({}); // { itemId: { item, count } }

  const handleAddItem = (item) => {
    setCart((prev) => {
      const existing = prev[item.id];
      const count = existing ? existing.count + 1 : 1;
      return { ...prev, [item.id]: { item, count } };
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

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, entry) => sum + entry.item.price * entry.count, 0);
  const cartItemCount = cartItems.reduce((sum, entry) => sum + entry.count, 0);

  // Filter items
  const allItems = categories.flatMap((c) =>
    c.items.map((i) => ({ ...i, category_slug: c.slug, category_name: c.name }))
  );

  const filteredItems = allItems.filter((item) => {
    if (selectedCat !== "all" && item.category_slug !== selectedCat) return false;
    if (filterVegOnly && !item.is_vegetarian) return false;
    if (filterSignatureOnly && !item.is_signature) return false;
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(term);
      const matchDesc = item.description?.toLowerCase().includes(term);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="menu-browser-container">
      {/* Top Filter Bar */}
      <div className="bg-white border border-line rounded-xl p-6 mb-10 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          {/* Search Input */}
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

          {/* Quick Dietary Checkboxes */}
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterVegOnly}
                onChange={(e) => setFilterVegOnly(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald text-sm leading-none">eco</span>
                <span>Vegetarian Only</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterSignatureOnly}
                onChange={(e) => setFilterSignatureOnly(e.target.checked)}
              />
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-gold text-sm leading-none">stars</span>
                <span>Signature Dishes</span>
              </span>
            </label>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
          <button
            type="button"
            className={`btn btn-sm ${selectedCat === "all" ? "btn-solid" : "btn-ghost"}`}
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

      {/* Main Grid + Floating Pre-Order Basket */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Dishes Grid (3 cols or 4 cols) */}
        <div className={cartItemCount > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white border border-line rounded-xl">
              <p className="text-stone-500 text-sm">No dishes match your selected filter or search term.</p>
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
                  count={cart[item.id]?.count || 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sticky Pre-Order Basket (1 col) */}
        {cartItemCount > 0 && (
          <aside className="sticky top-28 bg-white border border-emerald rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line">
              <ShoppingBag size={18} className="text-emerald" />
              <h3 className="font-serif font-bold text-lg text-emerald">Pre-Order Basket</h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
              {cartItems.map(({ item, count }) => (
                <div key={item.id} className="flex justify-between items-center gap-2 border-b border-stone-100 pb-2">
                  <div className="truncate">
                    <span className="font-semibold block truncate">{item.name}</span>
                    <span className="text-mist">LKR {Number(item.price).toLocaleString()} × {count}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-5 h-5 flex items-center justify-center border border-line rounded hover:bg-stone-100"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold">{count}</span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="w-5 h-5 flex items-center justify-center border border-line rounded hover:bg-stone-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line pt-3 mt-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-sm text-emerald">
                <span>Total Pre-Order</span>
                <span>LKR {cartTotal.toLocaleString()}</span>
              </div>
              <p className="text-2xs text-stone-500">
                Pre-ordering attaches your dish choices to your table reservation for expedited kitchen preparation.
              </p>
            </div>

            <Link
              href={`/dining/reserve?preOrderTotal=${cartTotal}&itemCount=${cartItemCount}`}
              className="btn btn-solid w-full justify-center mt-4 text-xs py-2.5"
            >
              <span>Proceed to Table Reservation</span>
              <ArrowRight size={14} />
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}
