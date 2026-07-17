'use client';
import { useEffect, useMemo, useState } from "react";

const EMPTY_OPTION = { text: "", scoreA: 3, whyA: "", scoreB: 3, whyB: "", isRedFlag: false, redFlagNote: "" };

const LETTER = (i) => String.fromCharCode(65 + i);

// Checks the 4 options against the trade-off rubric and returns plain-language
// warnings. These are hints, not hard validation - a scenario can still be
// saved even if it trips one of these, since there may be a deliberate reason.
function getScoreWarnings(options) {
  const warnings = [];

  options.forEach((opt, i) => {
    const a = Number(opt.scoreA);
    const b = Number(opt.scoreB);
    if (a === 4 && b === 4) {
      warnings.push(`Option ${LETTER(i)} scores 4/4 on both competencies — no trade-off, so it's a risk-free "always pick this" choice.`);
    }
    if (a === 1 && b === 1 && !opt.isRedFlag) {
      warnings.push(`Option ${LETTER(i)} scores 1/1 but isn't flagged as a red flag — consider whether it should be.`);
    }
  });

  for (let i = 0; i < options.length; i++) {
    for (let j = i + 1; j < options.length; j++) {
      const a1 = Number(options[i].scoreA), b1 = Number(options[i].scoreB);
      const a2 = Number(options[j].scoreA), b2 = Number(options[j].scoreB);
      if (a1 === a2 && b1 === b2) {
        warnings.push(`Options ${LETTER(i)} and ${LETTER(j)} have identical scores (${a1}/${b1}) — consider varying them so the choices are more distinct.`);
      }
    }
  }

  if (!options.some((o) => o.isRedFlag)) {
    warnings.push("No option is flagged as a red flag in this scenario — fine if intentional, but most scenarios pair one clearly weaker choice.");
  }

  return warnings;
}

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

  const scoreWarnings = useMemo(() => getScoreWarnings(form.options), [form.options]);

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

      <details className="admin-guide">
        <summary>How scoring works — read before writing options</summary>
        <ul>
          <li>Every scenario tests exactly the 2 competencies picked below (A and B). Each of the 4 options should be a genuine trade-off, not one "correct" answer.</li>
          <li><strong>Two options should lean hard into one competency at the cost of the other</strong> — e.g. 4 on A / 2 on B, and the reverse (2 on A / 4 on B).</li>
          <li><strong>One option should be a middle path</strong> — solid on both but not maxed out (e.g. 3/3, or 3/2 for variety). Vary this across different scenarios — don't always use the same pair — so there's no single "always safe" pattern a player can learn to spot.</li>
          <li><strong>One option should reflect a real but weaker pattern</strong> — low on both (e.g. 1/1 or 2/1) — usually the one worth flagging as a red flag. It should still read as something a real person might plausibly do, not an obviously bad strawman.</li>
          <li><strong>Avoid 4/4</strong> — a risk-free, no-downside option undermines the "no single right answer" design.</li>
          <li><strong>Each "why" is one short, neutral, concrete sentence</strong> about the actual consequence — e.g. "Cuts them off before their point is fully out," not "This is rude."</li>
        </ul>
      </details>

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

      {scoreWarnings.length > 0 && (
        <div className="admin-guide-warnings">
          <div className="admin-option-card-title" style={{ marginBottom: 6 }}>Trade-off check</div>
          <ul>
            {scoreWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

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
