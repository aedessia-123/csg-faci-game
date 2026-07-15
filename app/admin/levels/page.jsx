'use client';
import { useEffect, useState } from "react";

const EMPTY = { key: "", name: "", tagline: "", intro: "", threshold: 12, nextLevelName: "" };

export default function LevelsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/levels")
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
    const url = editingId ? `/api/admin/levels/${editingId}` : "/api/admin/levels";
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

  const edit = (l) => {
    setEditingId(l.id);
    setForm({
      key: l.key,
      name: l.name,
      tagline: l.tagline,
      intro: l.intro,
      threshold: l.threshold,
      nextLevelName: l.nextLevelName || "",
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  };

  const remove = async (id) => {
    if (!confirm("Delete this level? This only works if no game uses it.")) return;
    const res = await fetch(`/api/admin/levels/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Couldn't delete");
      return;
    }
    load();
  };

  return (
    <>
      <h1 className="admin-h1">Levels</h1>
      <p className="admin-sub">Readiness tiers (L0, L1, L2…). Each game belongs to one level.</p>

      <div className="admin-card">
        <div className="admin-option-card-title">{editingId ? "Edit level" : "New level"}</div>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Key (e.g. L0, L1)</label>
              <input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required />
            </div>
            <div className="admin-field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="admin-field">
            <label>Tagline</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Intro copy</label>
            <textarea value={form.intro} onChange={(e) => setForm({ ...form, intro: e.target.value })} required />
          </div>
          <div className="admin-field-row">
            <div className="admin-field">
              <label>Pass threshold (sum of 4 competency averages)</label>
              <input
                type="number"
                min="4"
                max="16"
                value={form.threshold}
                onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Next level name (optional)</label>
              <input value={form.nextLevelName} onChange={(e) => setForm({ ...form, nextLevelName: e.target.value })} />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            {editingId ? "Save changes" : "Create level"}
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
        <div className="admin-empty">No levels yet.</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Threshold</th>
              <th>Next level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td><code>{l.key}</code></td>
                <td>{l.name}</td>
                <td>{l.threshold}</td>
                <td>{l.nextLevelName || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="admin-btn secondary" onClick={() => edit(l)}>Edit</button>{" "}
                  <button className="admin-btn danger" onClick={() => remove(l.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
