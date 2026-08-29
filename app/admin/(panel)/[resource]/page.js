"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RESOURCES } from "../../resources";
import { listRecords, createRecord, updateRecord, deleteRecord } from "../../actions";

const money = (n) => "LKR " + Number(n).toLocaleString();

function cellValue(col, row) {
  const v = row[col.key];
  if (col.money) return money(v);
  if (col.map) return col.map[v] ?? v;
  if (col.badge) return <span className={`tag tag-${String(v)}`}>{v}</span>;
  return v == null || v === "" ? "—" : String(v);
}

function emptyRecord(fields) {
  const r = {};
  fields.forEach((f) => {
    r[f.key] = f.type === "select" && f.options
      ? (typeof f.options[0] === "object" ? f.options[0].value : f.options[0])
      : "";
  });
  return r;
}

export default function ResourceManager() {
  const { resource } = useParams();
  const cfg = RESOURCES[resource];

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!cfg) return;
    setLoading(true); setError(null);
    try {
      setRows(await listRecords(cfg.endpoint));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cfg]);

  useEffect(() => { load(); }, [load]);

  if (!cfg) return <div className="ad-empty">Unknown section.</div>;

  const openAdd = () => setEditing({ __new: true, ...emptyRecord(cfg.fields) });
  const openEdit = (row) => setEditing({ ...row, password: "" });
  const close = () => setEditing(null);
  const setField = (key, value) => setEditing((e) => ({ ...e, [key]: value }));

  const save = async () => {
    setSaving(true); setError(null);

    // ── Client-side validation ────────────────────────────────────────────────
    for (const f of cfg.fields) {
      const raw = editing[f.key];

      // Required check (skip password field for edits — blank = keep current)
      const isRequiredField = f.required || (f.newOnly && editing.__new);
      if (isRequiredField && (raw === "" || raw == null)) {
        if (f.type === "password" && !editing.__new) continue; // allow blank on edit
        setError(`${f.label} is required.`);
        setSaving(false);
        return;
      }

      if (raw === "" || raw == null) continue;

      // Number range checks
      if ((f.type === "number" || f.numeric) && raw !== "") {
        const n = Number(raw);
        if (!Number.isFinite(n)) {
          setError(`${f.label} must be a valid number.`);
          setSaving(false);
          return;
        }
        if (f.min !== undefined && n < f.min) {
          setError(`${f.label} must be at least ${f.min}.`);
          setSaving(false);
          return;
        }
        if (f.max !== undefined && n > f.max) {
          setError(`${f.label} must not exceed ${f.max}.`);
          setSaving(false);
          return;
        }
      }

      // Text / textarea length checks
      if ((f.type === "text" || f.type === "email" || f.type === "tel" || f.type === "password" || f.type === "textarea") && typeof raw === "string") {
        if (f.minLength && raw.length < f.minLength) {
          setError(`${f.label} must be at least ${f.minLength} characters.`);
          setSaving(false);
          return;
        }
        if (f.maxLength && raw.length > f.maxLength) {
          setError(`${f.label} must not exceed ${f.maxLength} characters.`);
          setSaving(false);
          return;
        }
        if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          setError("Please enter a valid email address.");
          setSaving(false);
          return;
        }
      }

      // Pattern check (e.g. slug, phone)
      if (f.pattern && typeof raw === "string" && raw) {
        if (!new RegExp(f.pattern).test(raw)) {
          setError(`${f.label} has an invalid format.`);
          setSaving(false);
          return;
        }
      }
    }

    // Cross-field check: min_capacity must be <= max_capacity for venues
    if (editing.min_capacity !== undefined && editing.max_capacity !== undefined) {
      if (Number(editing.min_capacity) > Number(editing.max_capacity)) {
        setError("Minimum capacity cannot exceed maximum capacity.");
        setSaving(false);
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const payload = {};
    cfg.fields.forEach((f) => {
      let val = editing[f.key];
      if (val === "" || val == null) return; // skip blanks — e.g. leave password unchanged
      if (f.type === "number" || f.numeric) val = Number(val);
      payload[f.key] = val;
    });

    try {
      if (editing.__new) await createRecord(cfg.endpoint, payload);
      else await updateRecord(cfg.endpoint, editing.id, payload);
      close();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${cfg.title.slice(0, -1).toLowerCase()}? This cannot be undone.`)) return;
    setError(null);
    try {
      await deleteRecord(cfg.endpoint, row.id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="ad-head">
        <div>
          <h1>{cfg.title}</h1>
          <p>{rows.length} record{rows.length === 1 ? "" : "s"}</p>
        </div>
        <button className="ad-btn ad-btn-primary" onClick={openAdd}>+ Add {cfg.title.slice(0, -1)}</button>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {loading ? (
        <div className="ad-empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">No records yet. Click “Add” to create one.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>ID</th>
                {cfg.columns.map((c) => <th key={c.key}>{c.label}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="muted">{row.id}</td>
                  {cfg.columns.map((c) => <td key={c.key}>{cellValue(c, row)}</td>)}
                  <td className="ad-row-actions">
                    <button className="ad-link" onClick={() => openEdit(row)}>Edit</button>
                    <button className="ad-link danger" onClick={() => remove(row)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="ad-modal-overlay" onClick={close}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.__new ? `Add ${cfg.title.slice(0, -1)}` : `Edit ${cfg.title.slice(0, -1)}`}</h2>
            <div className="ad-form">
              {cfg.fields
                .filter((f) => !(f.newOnly && !editing.__new) || f.key === "password")
                .map((f) => (
                <div className={`ad-field ${f.type === "textarea" ? "wide" : ""}`} key={f.key}>
                  <label>{f.label}{(f.required || (f.newOnly && editing.__new)) && <span className="req"> *</span>}</label>
                  {f.type === "select" ? (
                    <select value={editing[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                      {f.options.map((o) => {
                        const val = typeof o === "object" ? o.value : o;
                        const lab = typeof o === "object" ? o.label : o;
                        return <option key={val} value={val}>{lab}</option>;
                      })}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={editing[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      maxLength={f.maxLength}
                    />
                  ) : (
                    <input
                      type={
                        f.type === "number"   ? "number"   :
                        f.type === "date"     ? "date"     :
                        f.type === "password" ? "password" :
                        f.type === "email"    ? "email"    :
                        f.type === "tel"      ? "tel"      :
                        "text"
                      }
                      value={editing[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={!editing.__new && f.type === "password" ? "Leave blank to keep current password" : (f.placeholder ?? "")}
                      min={f.min}
                      max={f.max}
                      minLength={f.minLength}
                      maxLength={f.maxLength}
                      pattern={f.pattern}
                    />
                  )}
                  {f.hint && <span className="ad-field-hint">{f.hint}</span>}
                </div>
              ))}
            </div>
            {error && <div className="ad-error">{error}</div>}
            <div className="ad-modal-actions">
              <button className="ad-btn" onClick={close} disabled={saving}>Cancel</button>
              <button className="ad-btn ad-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
