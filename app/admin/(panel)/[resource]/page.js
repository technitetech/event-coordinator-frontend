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

    if (editing.__new) {
      const req = cfg.fields.find((f) => f.key === "password" && f.newOnly);
      if (req && !editing.password) {
        setError("Password is required for a new user.");
        setSaving(false);
        return;
      }
    }

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
                    <textarea rows={3} value={editing[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)} />
                  ) : (
                    <input
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "password" ? "password" : "text"}
                      value={editing[f.key] ?? ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      placeholder={!editing.__new && f.type === "password" ? "Leave blank to keep current password" : ""}
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
