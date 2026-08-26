"use client";

import { Sparkles, Flame, Leaf } from "lucide-react";

export default function MenuItemCard({ item, onAdd, count = 0 }) {
  return (
    <article className="menu-item-card bg-white border border-line rounded-xl p-5 shadow-xs hover:border-emerald transition-all flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-3 mb-2">
          <h4 className="font-serif font-bold text-lg text-emerald leading-snug">
            {item.name}
          </h4>
          <span className="font-serif font-bold text-base text-stone-800 shrink-0">
            LKR {Number(item.price).toLocaleString()}
          </span>
        </div>

        {/* Badges / Dietary Icons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {item.is_signature === 1 && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-gold/15 text-stone-900 rounded">
              <Sparkles size={11} className="text-gold" />
              Signature
            </span>
          )}
          {item.is_vegetarian === 1 && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-emerald/10 text-emerald rounded">
              <Leaf size={11} />
              Vegetarian
            </span>
          )}
          {item.is_spicy === 1 && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded">
              <Flame size={11} />
              Ceylon Spiced
            </span>
          )}
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-4">
          {item.description}
        </p>
      </div>

      {onAdd && (
        <div className="pt-3 border-t border-dashed border-line flex justify-between items-center">
          <span className="text-2xs text-mist">
            {count > 0 ? `${count} selected` : "Add to pre-order"}
          </span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            className={`btn btn-sm ${count > 0 ? "btn-solid" : "btn-ghost"}`}
            style={{ fontSize: "0.75rem", padding: "4px 12px" }}
          >
            {count > 0 ? `+ Add More (${count})` : "+ Add"}
          </button>
        </div>
      )}
    </article>
  );
}
