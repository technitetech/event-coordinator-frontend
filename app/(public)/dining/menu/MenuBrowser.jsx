"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MenuItemCard from "../../../components/MenuItemCard";
import {
  Search, Utensils, ShoppingBag, ArrowRight, Trash2, X, ChevronRight,
} from "lucide-react";

export default function MenuBrowser({ categories }) {
  const router = useRouter();

  const [selectedCat, setSelectedCat] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterVegOnly, setFilterVegOnly] = useState(false);
  const [filterSignatureOnly, setFilterSignatureOnly] = useState(false);
  const [cart, setCart] = useState({});

  const handleAddItem = (item) =>
    setCart((prev) => ({
      ...prev,
      [item.id]: { item, count: (prev[item.id]?.count || 0) + 1 },
    }));

  const handleRemoveItem = (itemId) =>
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

  const handleClearCart = () => setCart({});

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((s, { item, count }) => s + Number(item.price) * count, 0);
  const cartItemCount = cartItems.reduce((s, { count }) => s + count, 0);

  const handleProceedToReserve = () => {
    const payload = cartItems.map(({ item, count }) => ({
      menu_item_id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: count,
    }));
    try { localStorage.setItem("dining_preorder_cart", JSON.stringify(payload)); } catch {}
    router.push("/dining/reserve");
  };

  // Flatten items and attach category_name for badges
  const allItems = categories.flatMap((c) =>
    c.items.map((i) => ({ ...i, category_slug: c.slug, category_name: c.name }))
  );

  const filteredItems = allItems.filter((item) => {
    if (selectedCat !== "all" && item.category_slug !== selectedCat) return false;
    if (filterVegOnly && !item.is_vegetarian) return false;
    if (filterSignatureOnly && !item.is_signature) return false;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      if (!item.name.toLowerCase().includes(t) && !(item.description || "").toLowerCase().includes(t)) return false;
    }
    return true;
  });

  // If viewing all, group by category; otherwise flat
  const grouped = selectedCat === "all" && !searchTerm.trim() && !filterVegOnly && !filterSignatureOnly;

  return (
    <div className="mb-browser">
      {/* ── Sticky filter bar ─────────────────────────────────────── */}
      <div className="mb-filter-bar">
        {/* Search */}
        <div className="mb-search-wrap">
          <Search size={15} className="mb-search-icon" />
          <input
            type="text"
            placeholder="Search dishes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-search"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm("")} className="mb-search-clear">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="mb-cat-tabs">
          <button
            type="button"
            className={`mb-tab ${selectedCat === "all" ? "mb-tab-active" : ""}`}
            onClick={() => setSelectedCat("all")}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`mb-tab ${selectedCat === cat.slug ? "mb-tab-active" : ""}`}
              onClick={() => setSelectedCat(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Toggles */}
        <div className="mb-toggles">
          <label className={`mb-toggle ${filterVegOnly ? "mb-toggle-on" : ""}`}>
            <input
              type="checkbox"
              checked={filterVegOnly}
              onChange={(e) => setFilterVegOnly(e.target.checked)}
              className="sr-only"
            />
            🌿 Vegetarian
          </label>
          <label className={`mb-toggle ${filterSignatureOnly ? "mb-toggle-on" : ""}`}>
            <input
              type="checkbox"
              checked={filterSignatureOnly}
              onChange={(e) => setFilterSignatureOnly(e.target.checked)}
              className="sr-only"
            />
            ✦ Signatures
          </label>
        </div>
      </div>

      {/* ── Content + Basket ──────────────────────────────────────── */}
      <div className="mb-layout">
        {/* Dishes */}
        <div className="mb-dishes">
          {filteredItems.length === 0 ? (
            <div className="mb-empty">
              <Utensils size={36} className="mb-empty-icon" />
              <p className="mb-empty-heading">No dishes match your selection</p>
              <button
                type="button"
                className="mb-reset-btn"
                onClick={() => {
                  setSelectedCat("all");
                  setSearchTerm("");
                  setFilterVegOnly(false);
                  setFilterSignatureOnly(false);
                }}
              >
                Reset all filters
              </button>
            </div>
          ) : grouped ? (
            /* Grouped by category when browsing "All" unfiltered */
            categories.map((cat) => {
              const catItems = cat.items.map((i) => ({ ...i, category_slug: cat.slug, category_name: cat.name }));
              if (catItems.length === 0) return null;
              return (
                <section key={cat.id} className="mb-cat-section">
                  <div className="mb-cat-header">
                    <h2 className="mb-cat-title">{cat.name}</h2>
                    <span className="mb-cat-count">{catItems.length} dishes</span>
                  </div>
                  <div className="mb-grid">
                    {catItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        onAdd={handleAddItem}
                        onRemove={handleRemoveItem}
                        count={cart[item.id]?.count || 0}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            /* Flat grid when filtered/searching */
            <div className="mb-grid">
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

        {/* ── Sticky basket ──────────────────────────────────────── */}
        {cartItemCount > 0 && (
          <aside className="mb-basket">
            <div className="mb-basket-header">
              <div className="mb-basket-title-row">
                <ShoppingBag size={17} className="text-emerald" />
                <h3 className="mb-basket-title">Pre-Order</h3>
                <span className="mb-basket-badge">{cartItemCount}</span>
              </div>
              <button type="button" onClick={handleClearCart} className="mb-basket-clear">
                <Trash2 size={11} />
                Clear
              </button>
            </div>

            <div className="mb-basket-items">
              {cartItems.map(({ item, count }) => (
                <div key={item.id} className="mb-basket-line">
                  <div className="mb-basket-line-info">
                    <span className="mb-basket-line-name">{item.name}</span>
                    <span className="mb-basket-line-meta">
                      LKR {Number(item.price).toLocaleString()} × {count}
                      <span className="ml-1 font-semibold text-stone-700">
                        = LKR {(Number(item.price) * count).toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="mb-basket-qty">
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="mb-basket-minus">−</button>
                    <span className="mb-basket-qty-num">{count}</span>
                    <button type="button" onClick={() => handleAddItem(item)} className="mb-basket-plus">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-basket-total">
              <span className="mb-basket-total-label">Pre-Order Subtotal</span>
              <span className="mb-basket-total-amt">LKR {cartTotal.toLocaleString()}</span>
            </div>
            <p className="mb-basket-note">Tax & service charge applied at checkout.</p>

            <button type="button" onClick={handleProceedToReserve} className="mb-basket-cta">
              Reserve & Attach Pre-Order
              <ArrowRight size={14} />
            </button>
            <Link href="/dining/reserve" className="mb-basket-skip">
              Reserve a table only
            </Link>
          </aside>
        )}
      </div>

      <style jsx>{`
        /* Filter bar */
        .mb-filter-bar {
          position: sticky; top: 64px; z-index: 40;
          background: rgba(255,255,255,.95);
          backdrop-filter: blur(8px);
          border: 1px solid #e7e5e4;
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 32px;
          display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
          box-shadow: 0 2px 12px rgba(0,0,0,.06);
        }

        .mb-search-wrap { position: relative; }
        .mb-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #a8a29e; pointer-events: none; }
        .mb-search {
          padding: 8px 32px 8px 34px; border: 1px solid #e7e5e4;
          border-radius: 9px; font-size: 13px; width: 210px;
          outline: none; background: #fafaf9;
          transition: border-color .15s;
        }
        .mb-search:focus { border-color: var(--emerald); background: #fff; }
        .mb-search-clear {
          position: absolute; right: 9px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #a8a29e;
          display: flex; align-items: center; padding: 2px;
        }
        .mb-search-clear:hover { color: #57534e; }

        .mb-cat-tabs {
          display: flex; gap: 6px; flex-wrap: nowrap;
          overflow-x: auto; scrollbar-width: none; flex: 1;
        }
        .mb-cat-tabs::-webkit-scrollbar { display: none; }
        .mb-tab {
          padding: 6px 14px; border-radius: 999px; font-size: 12px;
          font-weight: 600; white-space: nowrap; cursor: pointer;
          border: 1px solid #e7e5e4; background: #fff; color: #57534e;
          transition: all .15s;
        }
        .mb-tab:hover { border-color: var(--emerald); color: var(--emerald); }
        .mb-tab-active {
          background: var(--emerald); color: #fff; border-color: var(--emerald);
        }

        .mb-toggles { display: flex; gap: 8px; flex-shrink: 0; }
        .mb-toggle {
          padding: 6px 12px; border-radius: 999px; font-size: 12px;
          font-weight: 600; cursor: pointer; border: 1px solid #e7e5e4;
          background: #fff; color: #57534e; transition: all .15s;
          user-select: none;
        }
        .mb-toggle:hover { border-color: #a8a29e; }
        .mb-toggle-on { background: #f0fdf4; border-color: #86efac; color: #166534; }

        /* Layout */
        .mb-layout { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
        @media (min-width: 1024px) {
          .mb-layout { grid-template-columns: 1fr 300px; }
        }

        /* Category sections */
        .mb-cat-section { margin-bottom: 40px; }
        .mb-cat-section:last-child { margin-bottom: 0; }
        .mb-cat-header {
          display: flex; align-items: baseline; gap: 10px;
          margin-bottom: 18px; padding-bottom: 10px;
          border-bottom: 2px solid var(--emerald);
        }
        .mb-cat-title {
          font-family: var(--font-serif, Georgia, serif);
          font-weight: 700; font-size: 22px; color: #1c1917;
        }
        .mb-cat-count { font-size: 12px; color: #a8a29e; }

        /* Dishes grid */
        .mb-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* Empty state */
        .mb-empty {
          grid-column: 1 / -1; text-align: center; padding: 64px 24px;
          background: #fff; border: 1px solid #e7e5e4; border-radius: 16px;
        }
        .mb-empty-icon { margin: 0 auto 12px; color: #d6d3d1; }
        .mb-empty-heading { font-size: 15px; color: #78716c; margin-bottom: 16px; }
        .mb-reset-btn {
          padding: 8px 20px; border: 1px solid #e7e5e4; border-radius: 8px;
          font-size: 13px; font-weight: 600; cursor: pointer; background: #fff;
          color: #57534e; transition: all .15s;
        }
        .mb-reset-btn:hover { border-color: var(--emerald); color: var(--emerald); }

        /* Basket sidebar */
        .mb-basket {
          position: sticky; top: 148px;
          background: #fff; border: 1.5px solid var(--emerald);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 4px 24px rgba(45,106,79,.12);
        }
        .mb-basket-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid #e7e5e4;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }
        .mb-basket-title-row { display: flex; align-items: center; gap: 7px; }
        .mb-basket-title {
          font-family: var(--font-serif, Georgia, serif);
          font-weight: 700; font-size: 16px; color: var(--emerald);
        }
        .mb-basket-badge {
          background: var(--emerald); color: #fff;
          font-size: 11px; font-weight: 700;
          border-radius: 999px; min-width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 5px;
        }
        .mb-basket-clear {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; color: #a8a29e;
          background: none; border: none; cursor: pointer;
          transition: color .15s;
        }
        .mb-basket-clear:hover { color: #ef4444; }

        .mb-basket-items { max-height: 280px; overflow-y: auto; padding: 12px 16px; }
        .mb-basket-line {
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px; padding-bottom: 10px; margin-bottom: 10px;
          border-bottom: 1px solid #f5f5f4;
        }
        .mb-basket-line:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .mb-basket-line-info { flex: 1; min-width: 0; }
        .mb-basket-line-name {
          display: block; font-size: 12px; font-weight: 600;
          color: #1c1917; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mb-basket-line-meta { font-size: 11px; color: #a8a29e; }

        .mb-basket-qty { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .mb-basket-minus, .mb-basket-plus {
          width: 24px; height: 24px; border-radius: 6px; border: 1px solid #e7e5e4;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; font-weight: 700; background: #fff;
          transition: all .12s; line-height: 1;
        }
        .mb-basket-minus:hover { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }
        .mb-basket-plus { border-color: var(--emerald); background: rgba(45,106,79,.06); color: var(--emerald); }
        .mb-basket-plus:hover { background: var(--emerald); color: #fff; }
        .mb-basket-qty-num { width: 16px; text-align: center; font-size: 12px; font-weight: 700; }

        .mb-basket-total {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 16px 2px; border-top: 1px solid #e7e5e4;
        }
        .mb-basket-total-label { font-size: 12px; font-weight: 600; color: #57534e; }
        .mb-basket-total-amt { font-size: 14px; font-weight: 700; color: var(--emerald); }
        .mb-basket-note { font-size: 10px; color: #a8a29e; padding: 0 16px 10px; }

        .mb-basket-cta {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: calc(100% - 32px); margin: 0 16px 8px;
          padding: 10px 16px;
          background: var(--emerald); color: #fff;
          border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity .15s;
        }
        .mb-basket-cta:hover { opacity: .9; }
        .mb-basket-skip {
          display: block; text-align: center; font-size: 11px; color: #a8a29e;
          padding: 0 16px 14px; text-decoration: none; transition: color .15s;
        }
        .mb-basket-skip:hover { color: var(--emerald); }
      `}</style>
    </div>
  );
}
