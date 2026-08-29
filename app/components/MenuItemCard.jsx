"use client";

import { Sparkles, Flame, Leaf } from "lucide-react";

export default function MenuItemCard({ item, onAdd, onRemove, count = 0 }) {
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

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {!!item.is_signature && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-gold/15 text-stone-900 rounded">
              <Sparkles size={11} className="text-gold" />
              Signature
            </span>
          )}
          {!!item.is_vegetarian && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 bg-emerald/10 text-emerald rounded">
              <Leaf size={11} />
              Vegetarian
            </span>
          )}
          {!!item.is_spicy && (
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
        <div className="pt-3 border-t border-dashed border-line">
          {count === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="btn btn-ghost btn-sm w-full justify-center"
            >
              + Add to Pre-Order
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xs text-emerald font-semibold">{count} in basket</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onRemove && onRemove(item.id)}
                  className="w-7 h-7 flex items-center justify-center border border-line rounded-lg hover:bg-red-50 hover:border-red-200 text-stone-600 hover:text-red-600 font-bold text-base transition-colors"
                  aria-label="Remove one"
                >
                  −
                </button>
                <span className="w-5 text-center font-bold text-emerald text-sm">{count}</span>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="w-7 h-7 flex items-center justify-center border border-emerald rounded-lg bg-emerald/5 hover:bg-emerald text-emerald hover:text-white font-bold text-base transition-colors"
                  aria-label="Add one more"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
