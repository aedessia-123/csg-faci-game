'use client';
import { useEffect, useState } from "react";

const EMPTY = { key: "", name: "", icon: "", definition: "" };

export default function CompetenciesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/competencies")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const url = editingId ? `/api/admin/competencies/${editingId}` : "/api/admin/competencies";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const edit = (c) => {
    setEditingId(c.id);
    setForm({ key: c.key, name: c.name, icon: c.icon, definition: c.definition });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  };

  const remove = async (id) => {
    if (!confirm("Delete this competency? This only works if no scenario uses it.")) return;
    const res = await fetch(`/api/admin/competencies/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Couldn't delete");
      return;
    }
    load();
  };

  return (
    <>
      <h1 className="admin-h1">Competencies</h1>
      <p className="admin-sub">The shared taxonomy every scenario option scores against. Small and stable — edit rarely.</p>

      <div className="admin-card">
        <div className="admin-option-card-title">{editingId ? "Edit competency" : "New competency"}</div>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Key (stable id, e.g. execution_discipline)</label>
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
            </div>
            <div className="admin-field">
              <label>Icon (emoji)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} required />
            </div>
          </div>
          <div className="admin-field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Definition</label>
            <textarea value={form.definition} onChange={(e) => setForm({ ...form, definition: e.target.value })} required />
          </div>
          <button className="admin-btn" type="submit">
            {editingId ? "Save changes" : "Create competency"}
          </button>
          {editingId && (
            <button type="button" className="admin-btn secondary" style={{ marginLeft: 8 }} onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <p className="admin-sub">Loading…</p>
      ) : items.length === 0 ? (
        <div className="admin-empty">No competencies yet.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Key</th>
              <th>Definition</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.icon}</td>
                <td>{c.name}</td>
                <td><code>{c.key}</code></td>
                <td>{c.definition}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="admin-btn secondary" onClick={() => edit(c)}>Edit</button>{" "}
                  <button className="admin-btn danger" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
