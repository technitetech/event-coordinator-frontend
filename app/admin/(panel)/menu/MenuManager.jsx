"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Search, X,
  Sparkles, Leaf, Flame, Upload, ImageIcon, ChevronDown,
} from "lucide-react";
import {
  adminCreateMenuItem, adminUpdateMenuItem,
  adminDeleteMenuItem, adminToggleAvailability,
} from "./actions";

const EMPTY_FORM = {
  name: "", category_id: "", price: "", description: "",
  image_url: "", allergens: "",
  is_available: true, is_vegetarian: false, is_vegan: false,
  is_gluten_free: false, is_spicy: false, is_signature: false,
  display_order: 0,
};

export default function MenuManager({ initialItems, categories }) {
  const [items, setItems] = useState(initialItems);
  const [filterCat, setFilterCat] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterAvail, setFilterAvail] = useState("all");

  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null); // item or null for create
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Filter ──────────────────────────────────────────────────────────────
  const visible = items.filter((item) => {
    if (filterCat !== "all" && String(item.category_id) !== filterCat) return false;
    if (filterAvail === "available" && !item.is_available) return false;
    if (filterAvail === "hidden" && item.is_available) return false;
    if (filterSearch.trim()) {
      const t = filterSearch.toLowerCase();
      if (!item.name.toLowerCase().includes(t) && !(item.description || "").toLowerCase().includes(t)) return false;
    }
    return true;
  });

  // ── Panel helpers ────────────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" });
    setFormError(null);
    setUploadError(null);
    setPanelOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      name: item.name ?? "",
      category_id: item.category_id ?? "",
      price: item.price ?? "",
      description: item.description ?? "",
      image_url: item.image_url ?? "",
      allergens: item.allergens ?? "",
      is_available: !!item.is_available,
      is_vegetarian: !!item.is_vegetarian,
      is_vegan: !!item.is_vegan,
      is_gluten_free: !!item.is_gluten_free,
      is_spicy: !!item.is_spicy,
      is_signature: !!item.is_signature,
      display_order: item.display_order ?? 0,
    });
    setFormError(null);
    setUploadError(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditing(null);
    setFormError(null);
  }

  // ── Image upload ─────────────────────────────────────────────────────────
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-menu-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      ...form,
      price: Number(form.price),
      category_id: Number(form.category_id),
      display_order: Number(form.display_order) || 0,
    };

    startTransition(async () => {
      try {
        if (editing) {
          const res = await adminUpdateMenuItem(editing.id, payload);
          if (!res.ok) { setFormError(res.error); return; }
          const catName = categories.find((c) => c.id === payload.category_id)?.name ?? editing.category_name;
          setItems((prev) =>
            prev.map((i) => i.id === editing.id ? { ...i, ...payload, category_name: catName } : i)
          );
        } else {
          const res = await adminCreateMenuItem(payload);
          if (!res.ok) { setFormError(res.error); return; }
          const catName = categories.find((c) => c.id === payload.category_id)?.name ?? "";
          setItems((prev) => [{ id: res.id, ...payload, category_name: catName }, ...prev]);
        }
        closePanel();
      } catch (err) {
        setFormError(err.message);
      }
    });
  }

  // ── Toggle availability ──────────────────────────────────────────────────
  function handleToggle(item) {
    startTransition(async () => {
      await adminToggleAvailability(item.id);
      setItems((prev) =>
        prev.map((i) => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
      );
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete(item) {
    setDeleteConfirm(item);
  }

  function confirmDelete() {
    const item = deleteConfirm;
    setDeleteConfirm(null);
    startTransition(async () => {
      await adminDeleteMenuItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mm-root">
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="mm-toolbar">
        <div className="mm-toolbar-filters">
          {/* Search */}
          <div className="mm-search-wrap">
            <Search size={14} className="mm-search-icon" />
            <input
              className="mm-search"
              placeholder="Search items..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            {filterSearch && (
              <button type="button" onClick={() => setFilterSearch("")} className="mm-search-clear">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="mm-select-wrap">
            <select className="mm-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="mm-select-chevron" />
          </div>

          {/* Availability filter */}
          <div className="mm-select-wrap">
            <select className="mm-select" value={filterAvail} onChange={(e) => setFilterAvail(e.target.value)}>
              <option value="all">All ({items.length})</option>
              <option value="available">Available ({items.filter((i) => i.is_available).length})</option>
              <option value="hidden">Hidden ({items.filter((i) => !i.is_available).length})</option>
            </select>
            <ChevronDown size={12} className="mm-select-chevron" />
          </div>
        </div>

        <button type="button" onClick={openCreate} className="mm-add-btn">
          <Plus size={16} />
          Add Menu Item
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="mm-table-wrap">
        <table className="mm-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>Image</th>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>Tags</th>
              <th>Status</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="mm-empty-row">
                  No items match your filters.
                </td>
              </tr>
            )}
            {visible.map((item) => (
              <tr key={item.id} className={item.is_available ? "" : "mm-row-dim"}>
                <td>
                  <div className="mm-thumb-wrap">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="mm-thumb" />
                    ) : (
                      <div className="mm-thumb-placeholder">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="mm-item-name">{item.name}</div>
                  {item.description && (
                    <div className="mm-item-desc">{item.description.slice(0, 60)}{item.description.length > 60 ? "…" : ""}</div>
                  )}
                </td>
                <td className="mm-cell-muted">{item.category_name}</td>
                <td className="mm-price">LKR {Number(item.price).toLocaleString()}</td>
                <td>
                  <div className="mm-tags">
                    {!!item.is_signature && <span className="mm-tag mm-tag-gold"><Sparkles size={10} />Sig</span>}
                    {!!item.is_vegetarian && <span className="mm-tag mm-tag-green"><Leaf size={10} />Veg</span>}
                    {!!item.is_spicy && <span className="mm-tag mm-tag-red"><Flame size={10} />Spicy</span>}
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleToggle(item)}
                    disabled={isPending}
                    className={`mm-avail-btn ${item.is_available ? "mm-avail-on" : "mm-avail-off"}`}
                    title={item.is_available ? "Click to hide" : "Click to show"}
                  >
                    {item.is_available ? <><Eye size={12} /> On Menu</> : <><EyeOff size={12} /> Hidden</>}
                  </button>
                </td>
                <td>
                  <div className="mm-row-actions">
                    <button type="button" onClick={() => openEdit(item)} className="mm-action-btn mm-edit-btn" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(item)} className="mm-action-btn mm-del-btn" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Slide-in panel ──────────────────────────────────────────── */}
      {panelOpen && (
        <div className="mm-overlay" onClick={(e) => e.target === e.currentTarget && closePanel()}>
          <div className="mm-panel">
            <div className="mm-panel-header">
              <h2 className="mm-panel-title">{editing ? "Edit Menu Item" : "Add New Item"}</h2>
              <button type="button" onClick={closePanel} className="mm-panel-close"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="mm-panel-body">
              {formError && <div className="mm-form-error">{formError}</div>}

              {/* Image preview + upload */}
              <div className="mm-image-section">
                {form.image_url ? (
                  <div className="mm-img-preview-wrap">
                    <img src={form.image_url} alt="Preview" className="mm-img-preview" />
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                      className="mm-img-remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mm-img-placeholder">
                    <ImageIcon size={32} className="text-stone-300" />
                    <span className="text-xs text-stone-400">No image</span>
                  </div>
                )}

                <div className="mm-img-controls">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mm-upload-btn"
                  >
                    <Upload size={14} />
                    {uploading ? "Uploading…" : "Upload Image"}
                  </button>
                  <span className="mm-img-or">or</span>
                  <input
                    type="url"
                    placeholder="Paste image URL…"
                    value={form.image_url}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                    className="mm-input mm-input-url"
                  />
                  {uploadError && <p className="mm-field-error">{uploadError}</p>}
                </div>
              </div>

              {/* Name + category */}
              <div className="mm-form-row">
                <div className="mm-field">
                  <label className="mm-label">Item Name <span className="mm-required">*</span></label>
                  <input
                    required
                    type="text"
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mm-input"
                    placeholder="Grilled Jaffna Crab"
                  />
                </div>
                <div className="mm-field">
                  <label className="mm-label">Category <span className="mm-required">*</span></label>
                  <div className="mm-select-wrap mm-select-full">
                    <select
                      required
                      value={form.category_id}
                      onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                      className="mm-select"
                    >
                      <option value="">Select…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="mm-select-chevron" />
                  </div>
                </div>
              </div>

              {/* Price + display order */}
              <div className="mm-form-row">
                <div className="mm-field">
                  <label className="mm-label">Price (LKR) <span className="mm-required">*</span></label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="mm-input"
                    placeholder="2200"
                  />
                </div>
                <div className="mm-field">
                  <label className="mm-label">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                    className="mm-input"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mm-field">
                <label className="mm-label">Description</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mm-input mm-textarea"
                  placeholder="Brief description of the dish…"
                />
              </div>

              {/* Allergens */}
              <div className="mm-field">
                <label className="mm-label">Allergens</label>
                <input
                  type="text"
                  maxLength={255}
                  value={form.allergens}
                  onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
                  className="mm-input"
                  placeholder="Gluten, Shellfish, Dairy…"
                />
              </div>

              {/* Flags */}
              <div className="mm-checkboxes">
                {[
                  ["is_available",    "Available on Menu"],
                  ["is_signature",    "Signature Dish"],
                  ["is_vegetarian",   "Vegetarian"],
                  ["is_vegan",        "Vegan"],
                  ["is_gluten_free",  "Gluten-Free"],
                  ["is_spicy",        "Ceylon Spiced"],
                ].map(([key, label]) => (
                  <label key={key} className="mm-checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              <div className="mm-panel-footer">
                <button type="button" onClick={closePanel} className="mm-btn-cancel">Cancel</button>
                <button type="submit" disabled={isPending || uploading} className="mm-btn-save">
                  {isPending ? "Saving…" : editing ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="mm-overlay">
          <div className="mm-confirm">
            <Trash2 size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold text-stone-800 mb-1">Delete &ldquo;{deleteConfirm.name}&rdquo;?</h3>
            <p className="text-xs text-stone-500 mb-5">This cannot be undone. Orders referencing this item will be unaffected but the item will no longer appear on the menu.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setDeleteConfirm(null)} className="mm-btn-cancel">Cancel</button>
              <button type="button" onClick={confirmDelete} className="mm-btn-del">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mm-root { position: relative; }

        /* Toolbar */
        .mm-toolbar {
          display: flex; flex-wrap: wrap; gap: 12px;
          align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .mm-toolbar-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }

        .mm-search-wrap { position: relative; display: flex; align-items: center; }
        .mm-search-icon { position: absolute; left: 10px; color: #a8a29e; pointer-events: none; }
        .mm-search {
          padding: 7px 28px 7px 32px; border: 1px solid #e7e5e4;
          border-radius: 8px; font-size: 13px; width: 220px;
          background: #fff; outline: none;
        }
        .mm-search:focus { border-color: var(--emerald); }
        .mm-search-clear {
          position: absolute; right: 8px; background: none; border: none;
          cursor: pointer; color: #a8a29e; display: flex; align-items: center;
          padding: 2px;
        }
        .mm-search-clear:hover { color: #57534e; }

        .mm-select-wrap { position: relative; display: flex; align-items: center; }
        .mm-select-full { width: 100%; }
        .mm-select {
          appearance: none; padding: 7px 28px 7px 10px;
          border: 1px solid #e7e5e4; border-radius: 8px;
          font-size: 13px; background: #fff; cursor: pointer; outline: none;
        }
        .mm-select:focus { border-color: var(--emerald); }
        .mm-select-chevron {
          position: absolute; right: 8px; pointer-events: none; color: #a8a29e;
        }

        .mm-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: var(--emerald); color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; white-space: nowrap; transition: opacity .15s;
        }
        .mm-add-btn:hover { opacity: .9; }

        /* Table */
        .mm-table-wrap {
          background: #fff; border: 1px solid #e7e5e4;
          border-radius: 12px; overflow: hidden;
        }
        .mm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .mm-table thead tr { background: #f5f5f4; border-bottom: 1px solid #e7e5e4; }
        .mm-table th {
          padding: 10px 12px; text-align: left; font-size: 11px;
          font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
          color: #78716c;
        }
        .mm-table td { padding: 10px 12px; border-bottom: 1px solid #f5f5f4; vertical-align: middle; }
        .mm-table tbody tr:last-child td { border-bottom: none; }
        .mm-table tbody tr:hover { background: #fafaf9; }
        .mm-row-dim { opacity: .55; }

        .mm-empty-row { text-align: center; padding: 32px 12px !important; color: #a8a29e; }

        .mm-thumb-wrap { width: 40px; height: 40px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
        .mm-thumb { width: 40px; height: 40px; object-fit: cover; }
        .mm-thumb-placeholder {
          width: 40px; height: 40px; background: #f5f5f4;
          display: flex; align-items: center; justify-content: center; color: #c4c0b8;
          border-radius: 6px;
        }

        .mm-item-name { font-weight: 600; color: #1c1917; }
        .mm-item-desc { font-size: 11px; color: #a8a29e; margin-top: 2px; }
        .mm-cell-muted { color: #78716c; }
        .mm-price { font-weight: 600; color: #1c1917; white-space: nowrap; }

        .mm-tags { display: flex; flex-wrap: wrap; gap: 4px; }
        .mm-tag {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 10px; font-weight: 700; padding: 2px 6px;
          border-radius: 999px;
        }
        .mm-tag-gold { background: #fef3c7; color: #92400e; }
        .mm-tag-green { background: #d1fae5; color: #065f46; }
        .mm-tag-red { background: #fee2e2; color: #991b1b; }

        .mm-avail-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; padding: 4px 8px;
          border-radius: 6px; border: 1px solid; cursor: pointer;
          transition: all .15s; white-space: nowrap;
        }
        .mm-avail-on { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
        .mm-avail-on:hover { background: #a7f3d0; }
        .mm-avail-off { background: #f5f5f4; color: #78716c; border-color: #e7e5e4; }
        .mm-avail-off:hover { background: #e7e5e4; }

        .mm-row-actions { display: flex; gap: 4px; }
        .mm-action-btn {
          width: 30px; height: 30px; display: flex; align-items: center;
          justify-content: center; border-radius: 6px; border: 1px solid #e7e5e4;
          cursor: pointer; transition: all .15s; background: #fff;
        }
        .mm-edit-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
        .mm-del-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

        /* Overlay + panel */
        .mm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          z-index: 9000; display: flex; align-items: flex-start;
          justify-content: flex-end;
        }
        .mm-panel {
          background: #fff; width: 100%; max-width: 520px; height: 100%;
          overflow-y: auto; display: flex; flex-direction: column;
          box-shadow: -4px 0 24px rgba(0,0,0,.18);
        }
        .mm-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px; border-bottom: 1px solid #e7e5e4;
          position: sticky; top: 0; background: #fff; z-index: 1;
        }
        .mm-panel-title { font-size: 16px; font-weight: 700; color: #1c1917; }
        .mm-panel-close {
          width: 32px; height: 32px; display: flex; align-items: center;
          justify-content: center; border: none; background: #f5f5f4;
          border-radius: 6px; cursor: pointer; color: #78716c;
        }
        .mm-panel-close:hover { background: #e7e5e4; }
        .mm-panel-body { flex: 1; display: flex; flex-direction: column; gap: 16px; padding: 20px 24px; }
        .mm-panel-footer {
          display: flex; gap: 10px; justify-content: flex-end;
          padding: 16px 24px; border-top: 1px solid #e7e5e4;
          position: sticky; bottom: 0; background: #fff;
        }

        .mm-form-error {
          background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;
          padding: 10px 14px; border-radius: 8px; font-size: 13px;
        }

        /* Image section */
        .mm-image-section {
          display: flex; gap: 12px; align-items: flex-start;
          padding: 12px; background: #fafaf9; border: 1px solid #e7e5e4;
          border-radius: 10px;
        }
        .mm-img-preview-wrap { position: relative; flex-shrink: 0; }
        .mm-img-preview {
          width: 80px; height: 80px; object-fit: cover;
          border-radius: 8px; border: 1px solid #e7e5e4;
        }
        .mm-img-remove {
          position: absolute; top: -6px; right: -6px;
          width: 20px; height: 20px; background: #ef4444; color: #fff;
          border-radius: 50%; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }
        .mm-img-placeholder {
          width: 80px; height: 80px; background: #f5f5f4;
          border: 1px dashed #d6d3d1; border-radius: 8px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 4px; flex-shrink: 0;
        }
        .mm-img-controls { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .mm-upload-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; border: 1px solid #e7e5e4; border-radius: 6px;
          font-size: 12px; font-weight: 600; background: #fff; cursor: pointer;
          transition: all .15s; color: #57534e; width: fit-content;
        }
        .mm-upload-btn:hover { border-color: var(--emerald); color: var(--emerald); }
        .mm-upload-btn:disabled { opacity: .6; cursor: not-allowed; }
        .mm-img-or { font-size: 11px; color: #a8a29e; }
        .mm-input-url { width: 100%; }
        .mm-field-error { font-size: 11px; color: #dc2626; }

        /* Form fields */
        .mm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 500px) { .mm-form-row { grid-template-columns: 1fr; } }

        .mm-field { display: flex; flex-direction: column; gap: 5px; }
        .mm-label { font-size: 12px; font-weight: 600; color: #44403c; }
        .mm-required { color: #ef4444; }
        .mm-input {
          padding: 8px 10px; border: 1px solid #e7e5e4; border-radius: 8px;
          font-size: 13px; outline: none; background: #fff; width: 100%;
          box-sizing: border-box;
        }
        .mm-input:focus { border-color: var(--emerald); }
        .mm-textarea { resize: vertical; min-height: 72px; }

        /* Checkboxes */
        .mm-checkboxes {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        @media (max-width: 400px) { .mm-checkboxes { grid-template-columns: 1fr; } }
        .mm-checkbox-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; cursor: pointer; color: #44403c;
          padding: 6px 8px; border: 1px solid #f5f5f4;
          border-radius: 6px; user-select: none;
        }
        .mm-checkbox-label:hover { background: #fafaf9; border-color: #e7e5e4; }

        /* Buttons */
        .mm-btn-cancel {
          padding: 8px 16px; border: 1px solid #e7e5e4; border-radius: 8px;
          font-size: 13px; font-weight: 600; background: #fff; cursor: pointer; color: #57534e;
        }
        .mm-btn-cancel:hover { background: #f5f5f4; }
        .mm-btn-save {
          padding: 8px 20px; background: var(--emerald); color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity .15s;
        }
        .mm-btn-save:hover { opacity: .9; }
        .mm-btn-save:disabled { opacity: .6; cursor: not-allowed; }

        /* Delete confirm */
        .mm-confirm {
          background: #fff; border-radius: 14px; padding: 28px 32px;
          width: 100%; max-width: 380px; text-align: center;
          margin: auto; box-shadow: 0 20px 60px rgba(0,0,0,.25);
        }
        .mm-btn-del {
          padding: 8px 20px; background: #ef4444; color: #fff;
          border: none; border-radius: 8px; font-size: 13px;
          font-weight: 600; cursor: pointer;
        }
        .mm-btn-del:hover { background: #dc2626; }
      `}</style>
    </div>
  );
}
