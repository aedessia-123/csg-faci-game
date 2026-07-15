'use client';
import { useEffect, useState } from "react";

const EMPTY_OPTION = { text: "", scoreA: 3, whyA: "", scoreB: 3, whyB: "", isRedFlag: false, redFlagNote: "" };

function emptyScenario() {
  return {
    title: "",
    prompt: "",
    occasion: "",
    difficulty: "medium",
    status: "DRAFT",
    competencyAId: "",
    competencyBId: "",
    options: [
      { ...EMPTY_OPTION },
      { ...EMPTY_OPTION },
      { ...EMPTY_OPTION },
      { ...EMPTY_OPTION },
    ],
  };
}

export default function ScenarioForm({ scenarioId }) {
  const [competencies, setCompetencies] = useState([]);
  const [form, setForm] = useState(emptyScenario());
  const [loading, setLoading] = useState(!!scenarioId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/competencies")
      .then((r) => r.json())
      .then(setCompetencies);
  }, []);

  useEffect(() => {
    if (!scenarioId) return;
    fetch(`/api/admin/scenarios/${scenarioId}`)
      .then((r) => r.json())
      .then((s) => {
        setForm({
          title: s.title,
          prompt: s.prompt,
          occasion: s.occasion || "",
          difficulty: s.difficulty || "medium",
          status: s.status,
          competencyAId: s.competencyAId,
          competencyBId: s.competencyBId,
          options: s.options.map((o) => ({
            text: o.text,
            scoreA: o.scoreA,
            whyA: o.whyA,
            scoreB: o.scoreB,
            whyB: o.whyB,
            isRedFlag: o.isRedFlag,
            redFlagNote: o.redFlagNote || "",
          })),
        });
        setLoading(false);
      });
  }, [scenarioId]);

  const updateOption = (i, patch) => {
    const options = [...form.options];
    options[i] = { ...options[i], ...patch };
    setForm({ ...form, options });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const url = scenarioId ? `/api/admin/scenarios/${scenarioId}` : "/api/admin/scenarios";
    const method = scenarioId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }
    window.location.href = "/admin/scenarios";
  };

  if (loading) return <p className="admin-sub">Loading…</p>;

  const compA = competencies.find((c) => c.id === form.competencyAId);
  const compB = competencies.find((c) => c.id === form.competencyBId);

  return (
    <form onSubmit={submit}>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="admin-field">
          <label>Prompt (the scenario text shown to the player)</label>
          <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} required />
        </div>
        <div className="admin-field-row">
          <div className="admin-field">
            <label>Occasion (free tag, e.g. onboarding, refresher)</label>
            <input value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
          </div>
          <div className="admin-field">
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div className="admin-field-row">
          <div className="admin-field">
            <label>Competency A</label>
            <select
              value={form.competencyAId}
              onChange={(e) => setForm({ ...form, competencyAId: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label>Competency B</label>
            <select
              value={form.competencyBId}
              onChange={(e) => setForm({ ...form, competencyBId: e.target.value })}
              required
            >
              <option value="">Select…</option>
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin-field">
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <p className="admin-sub" style={{ marginTop: 0 }}>
        Four options. Each one scores against both Competency A ({compA ? compA.name : "?"}) and Competency B ({compB ? compB.name : "?"}).
      </p>

      {form.options.map((opt, i) => (
        <div className="admin-option-card" key={i}>
          <div className="admin-option-card-title">Option {String.fromCharCode(65 + i)}</div>
          <div className="admin-field">
            <label>Text</label>
            <textarea value={opt.text} onChange={(e) => updateOption(i, { text: e.target.value })} required />
          </div>
          <div className="admin-option-score-row">
            <div className="admin-field">
              <label>Score vs A (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                value={opt.scoreA}
                onChange={(e) => updateOption(i, { scoreA: Number(e.target.value) })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Why (A)</label>
              <input value={opt.whyA} onChange={(e) => updateOption(i, { whyA: e.target.value })} required />
            </div>
          </div>
          <div className="admin-option-score-row">
            <div className="admin-field">
              <label>Score vs B (1-4)</label>
              <input
                type="number"
                min="1"
                max="4"
                value={opt.scoreB}
                onChange={(e) => updateOption(i, { scoreB: Number(e.target.value) })}
                required
              />
            </div>
            <div className="admin-field">
              <label>Why (B)</label>
              <input value={opt.whyB} onChange={(e) => updateOption(i, { whyB: e.target.value })} required />
            </div>
          </div>
          <div className="admin-checkbox-row" style={{ marginBottom: 8 }}>
            <input
              type="checkbox"
              id={`redflag-${i}`}
              checked={opt.isRedFlag}
              onChange={(e) => updateOption(i, { isRedFlag: e.target.checked })}
            />
            <label htmlFor={`redflag-${i}`} style={{ margin: 0 }}>Flag as a red-flag pattern</label>
          </div>
          {opt.isRedFlag && (
            <div className="admin-field">
              <label>Red flag note (shown only in the results summary)</label>
              <input value={opt.redFlagNote} onChange={(e) => updateOption(i, { redFlagNote: e.target.value })} />
            </div>
          )}
        </div>
      ))}

      <button className="admin-btn" type="submit" disabled={saving}>
        {saving ? "Saving…" : scenarioId ? "Save changes" : "Create scenario"}
      </button>
      <a href="/admin/scenarios" className="admin-btn secondary" style={{ marginLeft: 8 }}>
        Cancel
      </a>
    </form>
  );
}
