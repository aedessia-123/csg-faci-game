'use client';
import { useEffect, useState } from "react";

function emptyGame() {
  return { slug: "", name: "", levelId: "", occasion: "", status: "DRAFT" };
}

export default function GameForm({ gameId }) {
  const [levels, setLevels] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [form, setForm] = useState(emptyGame());
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(!!gameId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/levels").then((r) => r.json()).then(setLevels);
    fetch("/api/admin/scenarios").then((r) => r.json()).then(setScenarios);
  }, []);

  useEffect(() => {
    if (!gameId) return;
    fetch(`/api/admin/games/${gameId}`)
      .then((r) => r.json())
      .then((g) => {
        setForm({ slug: g.slug, name: g.name, levelId: g.levelId, occasion: g.occasion || "", status: g.status });
        setSelectedIds(g.scenarios.map((gs) => gs.scenarioId));
        setLoading(false);
      });
  }, [gameId]);

  const toggleScenario = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const move = (id, dir) => {
    setSelectedIds((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedIds.length === 0) {
      setError("Pick at least one scenario for this game.");
      return;
    }
    setSaving(true);
    const url = gameId ? `/api/admin/games/${gameId}` : "/api/admin/games";
    const method = gameId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, scenarioIds: selectedIds }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    window.location.href = "/admin/games";
  };

  if (loading) return <p className="admin-sub">Loading…</p>;

  const scenarioById = Object.fromEntries(scenarios.map((s) => [s.id, s]));
  const unselected = scenarios.filter((s) => !selectedIds.includes(s.id));

  return (
    <form onSubmit={submit}>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-field-row">
          <div className="admin-field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-field">
            <label>Slug (used in /play/&lt;slug&gt;)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              pattern="[a-z0-9-]+"
              required
            />
          </div>
        </div>
        <div className="admin-field-row">
          <div className="admin-field">
            <label>Level</label>
            <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} required>
              <option value="">Select…</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.key} — {l.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Occasion (optional)</label>
            <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
          </div>
        </div>
        <div className="admin-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Draft (not playable)</option>
            <option value="PUBLISHED">Published (live at /play/&lt;slug&gt;)</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <div className="admin-field-row">
        <div>
          <div className="admin-option-card-title">In this game ({selectedIds.length})</div>
          <div className="admin-scenario-picker">
            {selectedIds.length === 0 ? (
              <div className="admin-empty">Nothing selected yet — add scenarios from the right.</div>
            ) : (
              selectedIds.map((id, i) => {
                const s = scenarioById[id];
                if (!s) return null;
                return (
                  <div className="admin-scenario-picker-item" key={id}>
                    <span className="admin-scenario-picker-order">{i + 1}</span>
                    <span style={{ flex: 1 }}>{s.title}</span>
                    <button type="button" className="admin-btn secondary" onClick={() => move(id, -1)} disabled={i === 0}>↑</button>
                    <button type="button" className="admin-btn secondary" onClick={() => move(id, 1)} disabled={i === selectedIds.length - 1}>↓</button>
                    <button type="button" className="admin-btn danger" onClick={() => toggleScenario(id)}>Remove</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div>
          <div className="admin-option-card-title">Available scenarios ({unselected.length})</div>
          <div className="admin-scenario-picker">
            {unselected.length === 0 ? (
              <div className="admin-empty">All scenarios are already in this game.</div>
            ) : (
              unselected.map((s) => (
                <div className="admin-scenario-picker-item" key={s.id}>
                  <span style={{ flex: 1 }}>
                    {s.title}{" "}
                    <span className={`admin-badge ${s.status.toLowerCase()}`}>{s.status}</span>
                  </span>
                  <button type="button" className="admin-btn" onClick={() => toggleScenario(s.id)}>Add</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button className="admin-btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : gameId ? "Save changes" : "Create game"}
        </button>
        <a href="/admin/games" className="admin-btn secondary" style={{ marginLeft: 8 }}>
          Cancel
        </a>
      </div>
    </form>
  );
}
