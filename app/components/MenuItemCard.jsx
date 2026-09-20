"use client";

import { Sparkles, Flame, Leaf } from "lucide-react";

export default function MenuItemCard({ item, onAdd, onRemove, count = 0 }) {
  const hasImage = !!item.image_url;

  return (
    <article className="mic-card">
      {/* Image */}
      <div className="mic-img-wrap">
        {hasImage ? (
          <img src={item.image_url} alt={item.name} className="mic-img" />
        ) : (
          <div className="mic-img-placeholder">
            <span className="mic-placeholder-text">{item.name?.charAt(0) ?? "?"}</span>
          </div>
        )}
        {/* Price badge */}
        <div className="mic-price-badge">
          LKR {Number(item.price).toLocaleString()}
        </div>
        {/* Signature ribbon */}
        {!!item.is_signature && (
          <div className="mic-sig-ribbon">
            <Sparkles size={10} />
            Signature
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mic-body">
        {/* Badges row */}
        <div className="mic-badges">
          {!!item.is_vegetarian && (
            <span className="mic-badge mic-badge-green">
              <Leaf size={10} />Veg
            </span>
          )}
          {!!item.is_spicy && (
            <span className="mic-badge mic-badge-red">
              <Flame size={10} />Spicy
            </span>
          )}
          {item.category_name && (
            <span className="mic-badge mic-badge-neutral">{item.category_name}</span>
          )}
        </div>

        <h4 className="mic-name">{item.name}</h4>

        {item.description && (
          <p className="mic-desc">{item.description}</p>
        )}

        {item.allergens && (
          <p className="mic-allergens">
            <span className="mic-allergens-label">Allergens:</span> {item.allergens}
          </p>
        )}
      </div>

      {/* Add to cart */}
      {onAdd && (
        <div className="mic-footer">
          {count === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="mic-add-btn"
            >
              + Add to Pre-Order
            </button>
          ) : (
            <div className="mic-qty-row">
              <span className="mic-in-basket">{count} in basket</span>
              <div className="mic-qty-controls">
                <button
                  type="button"
                  onClick={() => onRemove && onRemove(item.id)}
                  className="mic-qty-btn mic-qty-minus"
                  aria-label="Remove one"
                >
                  −
                </button>
                <span className="mic-qty-num">{count}</span>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  className="mic-qty-btn mic-qty-plus"
                  aria-label="Add one more"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .mic-card {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow .2s, transform .2s, border-color .2s;
          height: 100%;
        }
        .mic-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,.1);
          transform: translateY(-2px);
          border-color: var(--emerald, #2d6a4f);
        }

        /* Image */
        .mic-img-wrap {
          position: relative;
          height: 190px;
          overflow: hidden;
          background: #f5f5f4;
          flex-shrink: 0;
        }
        .mic-img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform .35s ease;
        }
        .mic-card:hover .mic-img { transform: scale(1.04); }
        .mic-img-placeholder {
          width: 100%; height: 100%;
          background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%);
          display: flex; align-items: center; justify-content: center;
        }
        .mic-placeholder-text {
          font-size: 56px; font-weight: 800; color: rgba(255,255,255,.25);
          font-family: serif; line-height: 1;
        }

        /* Price badge */
        .mic-price-badge {
          position: absolute; bottom: 10px; right: 10px;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(4px);
          color: #fff; font-weight: 700; font-size: 13px;
          padding: 4px 10px; border-radius: 999px;
          letter-spacing: .01em;
        }

        /* Signature ribbon */
        .mic-sig-ribbon {
          position: absolute; top: 12px; left: -1px;
          background: var(--gold, #d4a017);
          color: #fff; font-size: 10px; font-weight: 700;
          padding: 4px 10px 4px 8px;
          border-radius: 0 999px 999px 0;
          display: flex; align-items: center; gap: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }

        /* Body */
        .mic-body {
          flex: 1; padding: 14px 16px 8px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mic-badges { display: flex; flex-wrap: wrap; gap: 5px; }
        .mic-badge {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 10px; font-weight: 700; padding: 2px 7px;
          border-radius: 999px;
        }
        .mic-badge-green { background: #d1fae5; color: #065f46; }
        .mic-badge-red   { background: #fee2e2; color: #991b1b; }
        .mic-badge-neutral { background: #f5f5f4; color: #78716c; }

        .mic-name {
          font-family: var(--font-serif, Georgia, serif);
          font-weight: 700; font-size: 16px; line-height: 1.25;
          color: #1c1917; margin: 0;
        }
        .mic-desc {
          font-size: 12px; line-height: 1.55; color: #78716c; margin: 0;
          display: -webkit-box; -webkit-line-clamp: 3;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .mic-allergens {
          font-size: 10.5px; color: #a8a29e; margin: 0;
        }
        .mic-allergens-label { font-weight: 600; color: #78716c; }

        /* Footer */
        .mic-footer {
          padding: 10px 16px 14px;
          border-top: 1px dashed #e7e5e4;
        }
        .mic-add-btn {
          width: 100%; padding: 8px;
          border: 1px solid var(--emerald, #2d6a4f);
          color: var(--emerald, #2d6a4f);
          background: transparent;
          border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all .15s;
        }
        .mic-add-btn:hover {
          background: var(--emerald, #2d6a4f);
          color: #fff;
        }

        .mic-qty-row {
          display: flex; align-items: center; justify-content: space-between;
        }
        .mic-in-basket { font-size: 11px; font-weight: 600; color: var(--emerald, #2d6a4f); }
        .mic-qty-controls { display: flex; align-items: center; gap: 8px; }
        .mic-qty-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #e7e5e4; border-radius: 7px;
          cursor: pointer; font-weight: 700; font-size: 16px;
          background: #fff; transition: all .15s; line-height: 1;
        }
        .mic-qty-minus:hover { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }
        .mic-qty-plus {
          border-color: var(--emerald, #2d6a4f);
          background: rgba(45,106,79,.06);
          color: var(--emerald, #2d6a4f);
        }
        .mic-qty-plus:hover {
          background: var(--emerald, #2d6a4f);
          color: #fff;
        }
        .mic-qty-num {
          width: 20px; text-align: center;
          font-weight: 700; font-size: 14px; color: #1c1917;
        }
      `}</style>
    </article>
  );
}
