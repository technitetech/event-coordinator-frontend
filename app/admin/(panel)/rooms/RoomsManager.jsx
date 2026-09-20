"use client";

import { useState, useRef, useTransition } from "react";
import {
  Plus, Pencil, Trash2, X, Upload, ImageIcon,
  ChevronDown, BedDouble, Users, Maximize2, DoorOpen, AlertTriangle,
  GripVertical, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  adminCreateRoomType, adminUpdateRoomType, adminDeleteRoomType,
  adminGetRoomsForType, adminCreateRoom, adminUpdateRoom, adminDeleteRoom,
} from "./actions";

const EMPTY_TYPE_FORM = {
  name: "", slug: "", tagline: "", description: "",
  max_occupancy: 2, size_sqm: "", base_rate_per_night: "",
  display_order: 0, is_active: true,
  amenities: [], images: [],
};

const ROOM_STATUSES = ["available", "occupied", "maintenance", "reserved"];
const STATUS_COLORS = {
  available:   { bg: "#d1fae5", color: "#065f46", label: "Available" },
  occupied:    { bg: "#fee2e2", color: "#991b1b", label: "Occupied"  },
  maintenance: { bg: "#fef3c7", color: "#92400e", label: "Maintenance" },
  reserved:    { bg: "#ede9fe", color: "#5b21b6", label: "Reserved"  },
};

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function RoomsManager({ initialRoomTypes }) {
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [expandedType, setExpandedType] = useState(null);
  const [roomsMap, setRoomsMap] = useState({});
  const [loadingRooms, setLoadingRooms] = useState(null);

  // ── Room-type panel ──────────────────────────────────────────────────────
  const [typePanel, setTypePanel] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [typeError, setTypeError] = useState(null);
  const [amenityInput, setAmenityInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Image upload — multiple files, track per-file progress
  const [uploadQueue, setUploadQueue] = useState([]); // [{ name, status: 'uploading'|'done'|'error', error? }]
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Delete confirm
  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState(null);

  // ── Physical room panel ──────────────────────────────────────────────────
  const [roomPanel, setRoomPanel] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [parentTypeId, setParentTypeId] = useState(null);
  const [roomForm, setRoomForm] = useState({ room_number: "", floor: 1, status: "available", notes: "" });
  const [roomError, setRoomError] = useState(null);
  const [deleteRoomConfirm, setDeleteRoomConfirm] = useState(null);

  // ── Load rooms ───────────────────────────────────────────────────────────
  async function toggleRooms(typeId) {
    if (expandedType === typeId) { setExpandedType(null); return; }
    setExpandedType(typeId);
    if (roomsMap[typeId]) return;
    setLoadingRooms(typeId);
    try {
      const rooms = await adminGetRoomsForType(typeId);
      setRoomsMap(m => ({ ...m, [typeId]: rooms }));
    } finally {
      setLoadingRooms(null);
    }
  }

  // ── Type panel helpers ───────────────────────────────────────────────────
  function openCreateType() {
    setEditingType(null);
    setTypeForm(EMPTY_TYPE_FORM);
    setTypeError(null);
    setUploadError(null);
    setUploadQueue([]);
    setAmenityInput("");
    setTypePanel(true);
  }

  function openEditType(rt) {
    setEditingType(rt);
    setTypeForm({
      name: rt.name ?? "",
      slug: rt.slug ?? "",
      tagline: rt.tagline ?? "",
      description: rt.description ?? "",
      max_occupancy: rt.max_occupancy ?? 2,
      size_sqm: rt.size_sqm ?? "",
      base_rate_per_night: rt.base_rate_per_night ?? "",
      display_order: rt.display_order ?? 0,
      is_active: !!rt.is_active,
      amenities: Array.isArray(rt.amenities_json) ? [...rt.amenities_json] : [],
      images: Array.isArray(rt.images_json) ? [...rt.images_json] : [],
    });
    setTypeError(null);
    setUploadError(null);
    setUploadQueue([]);
    setAmenityInput("");
    setTypePanel(true);
  }

  function closeTypePanel() { setTypePanel(false); setEditingType(null); setUploadQueue([]); }

  function removeImage(url) {
    setTypeForm(f => ({ ...f, images: f.images.filter(x => x !== url) }));
  }

  // Upload multiple files sequentially, appending each URL as it finishes
  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadError(null);

    // Build queue entries
    const entries = files.map(f => ({ name: f.name, status: "uploading" }));
    setUploadQueue(entries);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload-room-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        // Append URL to images list
        setTypeForm(f => ({ ...f, images: [...f.images, data.url] }));
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: "done" } : item));
      } catch (err) {
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: "error", error: err.message } : item));
        setUploadError(`Failed to upload "${file.name}": ${err.message}`);
      }
    }
  }

  const isUploading = uploadQueue.some(q => q.status === "uploading");

  function addAmenity() {
    const val = amenityInput.trim();
    if (!val || typeForm.amenities.includes(val)) return;
    setTypeForm(f => ({ ...f, amenities: [...f.amenities, val] }));
    setAmenityInput("");
  }

  function removeAmenity(a) {
    setTypeForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }));
  }

  function handleTypeSubmit(e) {
    e.preventDefault();
    setTypeError(null);
    startTransition(async () => {
      try {
        if (editingType) {
          const res = await adminUpdateRoomType(editingType.id, typeForm);
          if (!res.ok) { setTypeError(res.error); return; }
          setRoomTypes(prev => prev.map(rt =>
            rt.id === editingType.id
              ? { ...rt, ...typeForm, amenities_json: typeForm.amenities, images_json: typeForm.images }
              : rt
          ));
        } else {
          const res = await adminCreateRoomType(typeForm);
          if (!res.ok) { setTypeError(res.error); return; }
          setRoomTypes(prev => [{
            id: res.id, ...typeForm,
            amenities_json: typeForm.amenities, images_json: typeForm.images,
            room_count: 0,
          }, ...prev]);
        }
        closeTypePanel();
      } catch (err) { setTypeError(err.message); }
    });
  }

  function confirmDeleteType() {
    const rt = deleteTypeConfirm; setDeleteTypeConfirm(null);
    startTransition(async () => {
      const res = await adminDeleteRoomType(rt.id);
      if (!res.ok) { alert(res.error); return; }
      setRoomTypes(prev => prev.filter(r => r.id !== rt.id));
    });
  }

  // ── Physical room helpers ────────────────────────────────────────────────
  function openAddRoom(typeId) {
    setEditingRoom(null); setParentTypeId(typeId);
    setRoomForm({ room_number: "", floor: 1, status: "available", notes: "" });
    setRoomError(null); setRoomPanel(true);
  }

  function openEditRoom(room, typeId) {
    setEditingRoom(room); setParentTypeId(typeId);
    setRoomForm({ room_number: room.room_number ?? "", floor: room.floor ?? 1, status: room.status ?? "available", notes: room.notes ?? "" });
    setRoomError(null); setRoomPanel(true);
  }

  function closeRoomPanel() { setRoomPanel(false); setEditingRoom(null); }

  function handleRoomSubmit(e) {
    e.preventDefault(); setRoomError(null);
    startTransition(async () => {
      try {
        if (editingRoom) {
          const res = await adminUpdateRoom(editingRoom.id, roomForm);
          if (!res.ok) { setRoomError(res.error); return; }
          setRoomsMap(m => ({ ...m, [parentTypeId]: (m[parentTypeId] || []).map(r => r.id === editingRoom.id ? { ...r, ...roomForm } : r) }));
        } else {
          const res = await adminCreateRoom({ ...roomForm, room_type_id: parentTypeId });
          if (!res.ok) { setRoomError(res.error); return; }
          setRoomsMap(m => ({ ...m, [parentTypeId]: [...(m[parentTypeId] || []), { id: res.id, room_type_id: parentTypeId, ...roomForm }] }));
          setRoomTypes(prev => prev.map(rt => rt.id === parentTypeId ? { ...rt, room_count: (rt.room_count || 0) + 1 } : rt));
        }
        closeRoomPanel();
      } catch (err) { setRoomError(err.message); }
    });
  }

  function confirmDeleteRoom() {
    const room = deleteRoomConfirm; setDeleteRoomConfirm(null);
    startTransition(async () => {
      const res = await adminDeleteRoom(room.id);
      if (!res.ok) { alert(res.error); return; }
      setRoomsMap(m => ({ ...m, [room.room_type_id]: (m[room.room_type_id] || []).filter(r => r.id !== room.id) }));
      setRoomTypes(prev => prev.map(rt => rt.id === room.room_type_id ? { ...rt, room_count: Math.max(0, (rt.room_count || 1) - 1) } : rt));
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rm-root">
      {/* Toolbar */}
      <div className="rm-toolbar">
        <p className="text-sm text-stone-500">
          {roomTypes.length} room types · {roomTypes.reduce((s, rt) => s + (rt.room_count || 0), 0)} physical rooms
        </p>
        <button type="button" onClick={openCreateType} className="rm-add-btn">
          <Plus size={15} /> Add Room Type
        </button>
      </div>

      {/* Room Type Cards */}
      <div className="rm-list">
        {roomTypes.length === 0 && (
          <div className="rm-empty"><BedDouble size={32} /><p>No room types yet. Add one to get started.</p></div>
        )}
        {roomTypes.map(rt => {
          const images = rt.images_json || [];
          const expanded = expandedType === rt.id;
          const rooms = roomsMap[rt.id] || [];
          return (
            <div key={rt.id} className={`rm-card ${rt.is_active ? "" : "rm-card-dim"}`}>
              <div className="rm-card-header">
                {/* Thumbnail strip */}
                <div className="rm-thumb-wrap">
                  {images.length > 0 ? (
                    <img src={images[0]} alt={rt.name} className="rm-thumb" />
                  ) : (
                    <div className="rm-thumb-placeholder"><BedDouble size={20} /></div>
                  )}
                  {images.length > 1 && (
                    <span className="rm-img-count">+{images.length - 1}</span>
                  )}
                </div>

                <div className="rm-card-info">
                  <div className="rm-card-title-row">
                    <h3 className="rm-card-name">{rt.name}</h3>
                    {!rt.is_active && <span className="rm-inactive-badge">Inactive</span>}
                    {images.length === 0 && <span className="rm-no-img-badge">No images</span>}
                  </div>
                  {rt.tagline && <p className="rm-card-tagline">{rt.tagline}</p>}
                  <div className="rm-card-meta">
                    <span><Users size={12} /> {rt.max_occupancy} guests</span>
                    {rt.size_sqm && <span><Maximize2 size={12} /> {rt.size_sqm} m²</span>}
                    <span className="rm-rate">LKR {Number(rt.base_rate_per_night).toLocaleString()} /night</span>
                    <span className="rm-img-meta"><ImageIcon size={12} /> {images.length} photo{images.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="rm-card-amenities">
                    {(rt.amenities_json || []).slice(0, 4).map((a, i) => (
                      <span key={i} className="rm-amenity-chip">{a}</span>
                    ))}
                    {(rt.amenities_json || []).length > 4 && (
                      <span className="rm-amenity-more">+{rt.amenities_json.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="rm-card-actions">
                  <button type="button" onClick={() => openEditType(rt)} className="rm-action-btn rm-edit-btn" title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setDeleteTypeConfirm(rt)} className="rm-action-btn rm-del-btn" title="Delete">
                    <Trash2 size={14} />
                  </button>
                  <button type="button" onClick={() => toggleRooms(rt.id)} className={`rm-rooms-toggle ${expanded ? "active" : ""}`}>
                    <DoorOpen size={14} />
                    {rt.room_count || 0} Rooms
                    <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                  </button>
                </div>
              </div>

              {/* Expandable Rooms */}
              {expanded && (
                <div className="rm-rooms-section">
                  <div className="rm-rooms-header">
                    <span className="rm-rooms-title">Physical Rooms — {rt.name}</span>
                    <button type="button" onClick={() => openAddRoom(rt.id)} className="rm-add-room-btn">
                      <Plus size={13} /> Add Room
                    </button>
                  </div>
                  {loadingRooms === rt.id ? (
                    <p className="rm-rooms-loading">Loading rooms…</p>
                  ) : rooms.length === 0 ? (
                    <p className="rm-rooms-empty">No physical rooms yet for this type.</p>
                  ) : (
                    <div className="rm-rooms-grid">
                      {rooms.map(room => {
                        const s = STATUS_COLORS[room.status] || STATUS_COLORS.available;
                        return (
                          <div key={room.id} className="rm-room-chip">
                            <div className="rm-room-chip-top">
                              <span className="rm-room-number">Room {room.room_number}</span>
                              <span className="rm-room-status-dot" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                            </div>
                            <div className="rm-room-chip-meta">Floor {room.floor ?? 1}</div>
                            <div className="rm-room-chip-actions">
                              <button type="button" onClick={() => openEditRoom(room, rt.id)} className="rm-action-btn rm-edit-btn" title="Edit"><Pencil size={12} /></button>
                              <button type="button" onClick={() => setDeleteRoomConfirm(room)} className="rm-action-btn rm-del-btn" title="Delete"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Room Type Panel ──────────────────────────────────────────────── */}
      {typePanel && (
        <div className="rm-overlay" onClick={e => e.target === e.currentTarget && closeTypePanel()}>
          <div className="rm-panel">
            <div className="rm-panel-header">
              <h2 className="rm-panel-title">{editingType ? `Edit — ${editingType.name}` : "Add Room Type"}</h2>
              <button type="button" onClick={closeTypePanel} className="rm-panel-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleTypeSubmit} className="rm-panel-body">
              {typeError && <div className="rm-form-error">{typeError}</div>}

              {/* ── IMAGE MANAGER ── */}
              <div className="rm-field">
                <label className="rm-label">
                  Room Photos
                  <span className="rm-label-hint">Shown as gallery on the rooms page. First photo is the cover image.</span>
                </label>

                {/* Existing image grid */}
                {typeForm.images.length > 0 ? (
                  <div className="rm-img-grid">
                    {typeForm.images.map((url, i) => (
                      <div key={url} className={`rm-img-card ${i === 0 ? "rm-img-cover" : ""}`}>
                        <img src={url} alt={`Photo ${i + 1}`} className="rm-img-preview" />
                        {i === 0 && <span className="rm-img-cover-badge">Cover</span>}
                        <button type="button" onClick={() => removeImage(url)} className="rm-img-remove" title="Remove photo">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {/* Upload-more tile */}
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rm-img-add-tile">
                      <Upload size={18} />
                      <span>{isUploading ? "Uploading…" : "Add more"}</span>
                    </button>
                  </div>
                ) : (
                  /* Empty state — big drop zone */
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="rm-img-dropzone">
                    <Upload size={24} />
                    <span className="rm-img-dropzone-title">{isUploading ? "Uploading…" : "Upload Photos"}</span>
                    <span className="rm-img-dropzone-hint">Click to select — multiple files supported · JPEG, PNG, WebP · max 8 MB each</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="rm-hidden"
                  onChange={handleFilesSelected}
                />

                {/* Upload queue status */}
                {uploadQueue.length > 0 && (
                  <div className="rm-upload-queue">
                    {uploadQueue.map((item, i) => (
                      <div key={i} className={`rm-upload-item rm-upload-${item.status}`}>
                        <span className="rm-upload-name">{item.name}</span>
                        <span className="rm-upload-status-label">
                          {item.status === "uploading" && "Uploading…"}
                          {item.status === "done" && "✓ Done"}
                          {item.status === "error" && `✗ ${item.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {uploadError && <p className="rm-field-error">{uploadError}</p>}
              </div>

              {/* Name + Slug */}
              <div className="rm-form-row">
                <div className="rm-field">
                  <label className="rm-label">Name <span className="rm-req">*</span></label>
                  <input required type="text" maxLength={120} value={typeForm.name}
                    onChange={e => { const name = e.target.value; setTypeForm(f => ({ ...f, name, slug: editingType ? f.slug : slugify(name) })); }}
                    className="rm-input" placeholder="Deluxe Ocean View Room" />
                </div>
                <div className="rm-field">
                  <label className="rm-label">Slug <span className="rm-req">*</span></label>
                  <input required type="text" maxLength={80} value={typeForm.slug}
                    onChange={e => setTypeForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                    className="rm-input" placeholder="deluxe-ocean-view" />
                </div>
              </div>

              {/* Tagline */}
              <div className="rm-field">
                <label className="rm-label">Tagline</label>
                <input type="text" maxLength={255} value={typeForm.tagline}
                  onChange={e => setTypeForm(f => ({ ...f, tagline: e.target.value }))}
                  className="rm-input" placeholder="Panoramic views of the Indian Ocean" />
              </div>

              {/* Description */}
              <div className="rm-field">
                <label className="rm-label">Description</label>
                <textarea rows={3} maxLength={2000} value={typeForm.description}
                  onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                  className="rm-input rm-textarea" placeholder="Full description shown on the room detail page…" />
              </div>

              {/* Rate / Occupancy / Size / Order */}
              <div className="rm-form-row rm-form-row-4">
                <div className="rm-field">
                  <label className="rm-label">Rate /night (LKR) <span className="rm-req">*</span></label>
                  <input required type="number" min={0} value={typeForm.base_rate_per_night}
                    onChange={e => setTypeForm(f => ({ ...f, base_rate_per_night: e.target.value }))}
                    className="rm-input" placeholder="28000" />
                </div>
                <div className="rm-field">
                  <label className="rm-label">Max Occupancy</label>
                  <input type="number" min={1} max={20} value={typeForm.max_occupancy}
                    onChange={e => setTypeForm(f => ({ ...f, max_occupancy: e.target.value }))}
                    className="rm-input" />
                </div>
                <div className="rm-field">
                  <label className="rm-label">Size (m²)</label>
                  <input type="number" min={1} value={typeForm.size_sqm}
                    onChange={e => setTypeForm(f => ({ ...f, size_sqm: e.target.value }))}
                    className="rm-input" placeholder="48" />
                </div>
                <div className="rm-field">
                  <label className="rm-label">Display Order</label>
                  <input type="number" min={0} value={typeForm.display_order}
                    onChange={e => setTypeForm(f => ({ ...f, display_order: e.target.value }))}
                    className="rm-input" />
                </div>
              </div>

              {/* Amenities */}
              <div className="rm-field">
                <label className="rm-label">Amenities</label>
                <div className="rm-amenities-input-row">
                  <input type="text" value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                    className="rm-input" placeholder="King Bed, Ocean View, Minibar…" />
                  <button type="button" onClick={addAmenity} className="rm-mini-btn">Add</button>
                </div>
                {typeForm.amenities.length > 0 && (
                  <div className="rm-chips-wrap">
                    {typeForm.amenities.map(a => (
                      <span key={a} className="rm-chip">
                        {a}<button type="button" onClick={() => removeAmenity(a)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Active */}
              <label className="rm-checkbox-label">
                <input type="checkbox" checked={!!typeForm.is_active}
                  onChange={e => setTypeForm(f => ({ ...f, is_active: e.target.checked }))} />
                <span>Active (visible on public rooms page)</span>
              </label>

              <div className="rm-panel-footer">
                <button type="button" onClick={closeTypePanel} className="rm-btn-cancel">Cancel</button>
                <button type="submit" disabled={isPending || isUploading} className="rm-btn-save">
                  {isPending ? "Saving…" : isUploading ? "Wait for uploads…" : editingType ? "Save Changes" : "Create Room Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Physical Room Panel ──────────────────────────────────────────── */}
      {roomPanel && (
        <div className="rm-overlay" onClick={e => e.target === e.currentTarget && closeRoomPanel()}>
          <div className="rm-panel rm-panel-sm">
            <div className="rm-panel-header">
              <h2 className="rm-panel-title">{editingRoom ? "Edit Room" : "Add Physical Room"}</h2>
              <button type="button" onClick={closeRoomPanel} className="rm-panel-close"><X size={18} /></button>
            </div>
            <form onSubmit={handleRoomSubmit} className="rm-panel-body">
              {roomError && <div className="rm-form-error">{roomError}</div>}
              <div className="rm-form-row">
                <div className="rm-field">
                  <label className="rm-label">Room Number <span className="rm-req">*</span></label>
                  <input required type="text" maxLength={10} value={roomForm.room_number}
                    onChange={e => setRoomForm(f => ({ ...f, room_number: e.target.value }))}
                    className="rm-input" placeholder="101" />
                </div>
                <div className="rm-field">
                  <label className="rm-label">Floor</label>
                  <input type="number" min={1} max={50} value={roomForm.floor}
                    onChange={e => setRoomForm(f => ({ ...f, floor: e.target.value }))}
                    className="rm-input" />
                </div>
              </div>
              <div className="rm-field">
                <label className="rm-label">Status</label>
                <div className="rm-select-wrap rm-select-full">
                  <select value={roomForm.status} onChange={e => setRoomForm(f => ({ ...f, status: e.target.value }))} className="rm-select">
                    {ROOM_STATUSES.map(s => <option key={s} value={s}>{STATUS_COLORS[s]?.label || s}</option>)}
                  </select>
                  <ChevronDown size={12} className="rm-select-chevron" />
                </div>
              </div>
              <div className="rm-field">
                <label className="rm-label">Notes</label>
                <textarea rows={2} maxLength={500} value={roomForm.notes}
                  onChange={e => setRoomForm(f => ({ ...f, notes: e.target.value }))}
                  className="rm-input rm-textarea" placeholder="Optional internal notes…" />
              </div>
              <div className="rm-panel-footer">
                <button type="button" onClick={closeRoomPanel} className="rm-btn-cancel">Cancel</button>
                <button type="submit" disabled={isPending} className="rm-btn-save">
                  {isPending ? "Saving…" : editingRoom ? "Save Room" : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirms */}
      {deleteTypeConfirm && (
        <div className="rm-overlay" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="rm-confirm">
            <AlertTriangle size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold text-stone-800 mb-1">Delete &ldquo;{deleteTypeConfirm.name}&rdquo;?</h3>
            <p className="text-xs text-stone-500 mb-5">This deletes the room type and all its physical rooms. Active bookings will block deletion.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setDeleteTypeConfirm(null)} className="rm-btn-cancel">Cancel</button>
              <button type="button" onClick={confirmDeleteType} className="rm-btn-del">Delete</button>
            </div>
          </div>
        </div>
      )}
      {deleteRoomConfirm && (
        <div className="rm-overlay" style={{ justifyContent: "center", alignItems: "center" }}>
          <div className="rm-confirm">
            <Trash2 size={24} className="text-red-500 mb-3" />
            <h3 className="font-bold text-stone-800 mb-1">Delete Room {deleteRoomConfirm.room_number}?</h3>
            <p className="text-xs text-stone-500 mb-5">Active bookings will block this. Cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button type="button" onClick={() => setDeleteRoomConfirm(null)} className="rm-btn-cancel">Cancel</button>
              <button type="button" onClick={confirmDeleteRoom} className="rm-btn-del">Delete</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .rm-root { position: relative; }
        .rm-hidden { display: none; }
        .rm-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .rm-add-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; background: var(--emerald); color: #fff;
          border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: opacity .15s;
        }
        .rm-add-btn:hover { opacity: .9; }
        .rm-list { display: flex; flex-direction: column; gap: 12px; }
        .rm-empty { text-align: center; padding: 48px; color: #a8a29e; display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 14px; }

        /* Card */
        .rm-card { background: #fff; border: 1px solid #e7e5e4; border-radius: 14px; overflow: hidden; transition: border-color .15s; }
        .rm-card:hover { border-color: #c4c0b8; }
        .rm-card-dim { opacity: .65; }
        .rm-card-header { display: flex; align-items: flex-start; gap: 14px; padding: 16px; flex-wrap: wrap; }

        .rm-thumb-wrap { position: relative; width: 88px; height: 70px; border-radius: 10px; overflow: hidden; flex-shrink: 0; }
        .rm-thumb { width: 100%; height: 100%; object-fit: cover; }
        .rm-thumb-placeholder { width: 88px; height: 70px; background: #f0fdf4; display: flex; align-items: center; justify-content: center; color: var(--emerald); border-radius: 10px; }
        .rm-img-count { position: absolute; bottom: 4px; right: 4px; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 6px; }

        .rm-card-info { flex: 1; min-width: 200px; }
        .rm-card-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
        .rm-card-name { font-weight: 700; font-size: 15px; color: #1c1917; }
        .rm-inactive-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; background: #fef3c7; color: #92400e; border-radius: 999px; }
        .rm-no-img-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; background: #fef2f2; color: #991b1b; border-radius: 999px; }
        .rm-card-tagline { font-size: 12px; color: #78716c; margin-bottom: 6px; }
        .rm-card-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: #78716c; align-items: center; margin-bottom: 6px; }
        .rm-card-meta span { display: inline-flex; align-items: center; gap: 4px; }
        .rm-rate { font-weight: 700; color: var(--emerald); }
        .rm-img-meta { color: #a8a29e; }
        .rm-card-amenities { display: flex; flex-wrap: wrap; gap: 4px; }
        .rm-amenity-chip { font-size: 10px; padding: 2px 8px; background: #f5f5f4; color: #57534e; border-radius: 999px; border: 1px solid #e7e5e4; }
        .rm-amenity-more { font-size: 10px; color: #a8a29e; }

        .rm-card-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
        .rm-action-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 1px solid #e7e5e4; border-radius: 7px; cursor: pointer; background: #fff; transition: all .12s; }
        .rm-edit-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; }
        .rm-del-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
        .rm-rooms-toggle { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; background: #fff; color: #57534e; transition: all .15s; }
        .rm-rooms-toggle:hover, .rm-rooms-toggle.active { border-color: var(--emerald); color: var(--emerald); background: #f0fdf4; }

        /* Rooms section */
        .rm-rooms-section { border-top: 1px solid #f5f5f4; padding: 14px 16px; background: #fafaf9; }
        .rm-rooms-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .rm-rooms-title { font-size: 12px; font-weight: 700; color: #57534e; }
        .rm-add-room-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border: 1px solid var(--emerald); border-radius: 6px; font-size: 11px; font-weight: 600; color: var(--emerald); background: #fff; cursor: pointer; transition: all .12s; }
        .rm-add-room-btn:hover { background: var(--emerald); color: #fff; }
        .rm-rooms-loading, .rm-rooms-empty { font-size: 12px; color: #a8a29e; padding: 8px 0; }
        .rm-rooms-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .rm-room-chip { background: #fff; border: 1px solid #e7e5e4; border-radius: 10px; padding: 10px 12px; min-width: 110px; }
        .rm-room-chip-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px; }
        .rm-room-number { font-weight: 700; font-size: 13px; color: #1c1917; }
        .rm-room-status-dot { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
        .rm-room-chip-meta { font-size: 11px; color: #a8a29e; margin-bottom: 6px; }
        .rm-room-chip-actions { display: flex; gap: 4px; }

        /* Panel overlay */
        .rm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 9000; display: flex; align-items: flex-start; justify-content: flex-end; }
        .rm-panel { background: #fff; width: 100%; max-width: 580px; height: 100%; overflow-y: auto; display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,.18); }
        .rm-panel-sm { max-width: 400px; }
        .rm-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #e7e5e4; position: sticky; top: 0; background: #fff; z-index: 1; }
        .rm-panel-title { font-size: 16px; font-weight: 700; color: #1c1917; }
        .rm-panel-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #f5f5f4; border-radius: 6px; cursor: pointer; color: #78716c; }
        .rm-panel-close:hover { background: #e7e5e4; }
        .rm-panel-body { flex: 1; display: flex; flex-direction: column; gap: 16px; padding: 18px 22px; }
        .rm-panel-footer { display: flex; gap: 10px; justify-content: flex-end; padding: 14px 22px; border-top: 1px solid #e7e5e4; position: sticky; bottom: 0; background: #fff; }
        .rm-form-error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 10px 14px; border-radius: 8px; font-size: 13px; }

        /* Image manager */
        .rm-img-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 8px;
        }
        .rm-img-card { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 4/3; border: 2px solid #e7e5e4; }
        .rm-img-card.rm-img-cover { border-color: var(--emerald); }
        .rm-img-preview { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rm-img-cover-badge { position: absolute; bottom: 4px; left: 4px; background: var(--emerald); color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; letter-spacing: .05em; }
        .rm-img-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; background: rgba(0,0,0,.65); color: #fff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background .12s; }
        .rm-img-remove:hover { background: #ef4444; }
        .rm-img-add-tile {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
          aspect-ratio: 4/3; border: 2px dashed #d6d3d1; border-radius: 10px;
          background: #fafaf9; color: #a8a29e; cursor: pointer; font-size: 11px; font-weight: 600;
          transition: all .15s;
        }
        .rm-img-add-tile:hover:not(:disabled) { border-color: var(--emerald); color: var(--emerald); background: #f0fdf4; }
        .rm-img-add-tile:disabled { opacity: .6; cursor: not-allowed; }
        .rm-img-dropzone {
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          padding: 32px 20px; border: 2px dashed #d6d3d1; border-radius: 12px;
          background: #fafaf9; cursor: pointer; width: 100%; text-align: center;
          transition: all .15s;
        }
        .rm-img-dropzone:hover:not(:disabled) { border-color: var(--emerald); background: #f0fdf4; color: var(--emerald); }
        .rm-img-dropzone:disabled { opacity: .6; cursor: not-allowed; }
        .rm-img-dropzone-title { font-size: 14px; font-weight: 700; color: #44403c; }
        .rm-img-dropzone-hint { font-size: 11px; color: #a8a29e; max-width: 280px; }
        .rm-upload-queue { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; }
        .rm-upload-item { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 8px; border-radius: 6px; gap: 8px; }
        .rm-upload-uploading { background: #eff6ff; color: #1d4ed8; }
        .rm-upload-done { background: #f0fdf4; color: #065f46; }
        .rm-upload-error { background: #fef2f2; color: #991b1b; }
        .rm-upload-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .rm-upload-status-label { white-space: nowrap; font-weight: 600; }
        .rm-field-error { font-size: 11px; color: #dc2626; margin-top: 4px; }

        /* Form fields */
        .rm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .rm-form-row-4 { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 520px) {
          .rm-form-row { grid-template-columns: 1fr; }
          .rm-form-row-4 { grid-template-columns: 1fr 1fr; }
        }
        .rm-field { display: flex; flex-direction: column; gap: 5px; }
        .rm-label { font-size: 12px; font-weight: 600; color: #44403c; display: flex; flex-direction: column; gap: 2px; }
        .rm-label-hint { font-size: 11px; font-weight: 400; color: #a8a29e; }
        .rm-req { color: #ef4444; }
        .rm-input { padding: 7px 10px; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 13px; outline: none; background: #fff; box-sizing: border-box; width: 100%; }
        .rm-input:focus { border-color: var(--emerald); }
        .rm-textarea { resize: vertical; min-height: 68px; }
        .rm-select-wrap { position: relative; }
        .rm-select-full { width: 100%; }
        .rm-select { appearance: none; padding: 7px 28px 7px 10px; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 13px; background: #fff; width: 100%; outline: none; cursor: pointer; }
        .rm-select:focus { border-color: var(--emerald); }
        .rm-select-chevron { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #a8a29e; }
        .rm-amenities-input-row { display: flex; gap: 6px; }
        .rm-chips-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .rm-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; padding: 3px 8px; background: #f0fdf4; border: 1px solid #86efac; color: #065f46; border-radius: 999px; }
        .rm-chip button { background: none; border: none; cursor: pointer; display: flex; align-items: center; color: #065f46; }
        .rm-mini-btn { padding: 5px 10px; background: var(--emerald); color: #fff; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .rm-mini-btn:hover { opacity: .9; }
        .rm-checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: #44403c; padding: 8px 10px; border: 1px solid #f5f5f4; border-radius: 8px; }
        .rm-checkbox-label:hover { background: #fafaf9; }
        .rm-btn-cancel { padding: 8px 16px; border: 1px solid #e7e5e4; border-radius: 8px; font-size: 13px; font-weight: 600; background: #fff; cursor: pointer; color: #57534e; }
        .rm-btn-cancel:hover { background: #f5f5f4; }
        .rm-btn-save { padding: 8px 20px; background: var(--emerald); color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .15s; }
        .rm-btn-save:hover { opacity: .9; }
        .rm-btn-save:disabled { opacity: .6; cursor: not-allowed; }
        .rm-confirm { background: #fff; border-radius: 14px; padding: 28px 32px; width: 100%; max-width: 380px; text-align: center; margin: auto; box-shadow: 0 20px 60px rgba(0,0,0,.25); display: flex; flex-direction: column; align-items: center; }
        .rm-btn-del { padding: 8px 20px; background: #ef4444; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .rm-btn-del:hover { background: #dc2626; }
      `}</style>
    </div>
  );
}
