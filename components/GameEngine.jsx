'use client';
import { useState, useMemo } from "react";

/* ============================================================
   SCORING ENGINE — config-agnostic
   config shape:
   {
     collectionLabel: "The Facilitator Matrix",
     game: { name: "Game 1 — Pre-Facilitator" },
     level: { key: "L0", name, tagline, intro, threshold, nextLevelName },
     competencies: { [key]: { name, icon, def } },
     compOrder: [key, key, key, key],
     questions: [{ title, text, comps: [keyA, keyB], options: [{ text, scores: [a,b], why: [a,b], redFlagNote? }] }]
   }
   ============================================================ */

function computeResults(config, answers) {
  const { questions, compOrder, level } = config;
  const sums = {};
  const counts = {};
  compOrder.forEach((c) => {
    sums[c] = 0;
    counts[c] = 0;
  });
  const redFlagsHit = [];

  answers.forEach((optIdx, qIdx) => {
    if (optIdx == null) return;
    const q = questions[qIdx];
    const opt = q.options[optIdx];
    q.comps.forEach((c, i) => {
      sums[c] += opt.scores[i];
      counts[c] += 1;
    });
    if (opt.redFlagNote) {
      redFlagsHit.push({ q: q.title, flag: opt.redFlagNote });
    }
  });

  const avg = {};
  compOrder.forEach((c) => {
    avg[c] = counts[c] > 0 ? sums[c] / counts[c] : null;
  });

  const touched = compOrder.every((c) => avg[c] !== null);
  const allPass = touched && compOrder.every((c) => avg[c] >= 3);
  const total = compOrder.reduce((s, c) => s + (avg[c] || 0), 0);
  // Red flags aren't a hard block — a red-flag option already scores low,
  // which drags down the competency averages on its own.
  const cleared = allPass && total >= level.threshold;
  const strongSignal = cleared && total > level.threshold + 1;

  return { avg, redFlagsHit, total, cleared, strongSignal, touched };
}

function fmtScore(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function getCompetencyBreakdown(config, answers) {
  const { questions, compOrder } = config;
  const instances = {};
  compOrder.forEach((c) => {
    instances[c] = [];
  });
  answers.forEach((optIdx, qIdx) => {
    if (optIdx == null) return;
    const q = questions[qIdx];
    const opt = q.options[optIdx];
    q.comps.forEach((c, i) => {
      instances[c].push({ title: q.title, score: opt.scores[i], why: opt.why?.[i] });
    });
  });
  return instances;
}

/* ============================================================
   UI PIECES
   ============================================================ */

function CompBar({ competency, avg }) {
  const filled = avg !== null;
  const pct = filled ? Math.max((avg / 4) * 100, 6) : 0;
  const pass = filled && avg >= 3;
  const color = filled ? (pass ? "var(--moss)" : "var(--ember)") : "var(--dash-line)";
  return (
    <div className="comp-bar">
      <span className="comp-bar-icon">{competency.icon}</span>
      <span className="comp-bar-name">{competency.name}</span>
      <div className="comp-bar-track">
        <div className="comp-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="comp-bar-threshold" />
      </div>
      <span className="comp-bar-value">{filled ? fmtScore(avg) : "–"}</span>
    </div>
  );
}

function Dashboard({ config, answers, qIndex, total }) {
  const results = useMemo(() => computeResults(config, answers), [config, answers]);
  const segments = Array.from({ length: total });
  const scoreColor = results.cleared ? "var(--moss)" : "var(--dash-text)";
  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="brand">
          <span className="brand-mark">◐</span>
          <span className="brand-name">
            {config.collectionLabel} · {config.game.name} · {config.level.key}
          </span>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-score-block">
            <span className="dashboard-score-label">Your score</span>
            <span className="dashboard-score-value" style={{ color: scoreColor }}>
              {fmtScore(results.total)}
              <span className="dashboard-score-sep"> / </span>
              {config.level.threshold}
            </span>
          </div>
          <div className="comp-bars">
            {config.compOrder.map((c) => (
              <CompBar key={c} competency={config.competencies[c]} avg={results.avg[c]} />
            ))}
          </div>
        </div>

        <div className="dashboard-progress">
          <span className="dashboard-progress-label">
            Q{Math.min(qIndex + 1, total)}/{total}
          </span>
          <div className="progress-ticks">
            {segments.map((_, i) => (
              <span key={i} className={`tick${i < qIndex ? " tick-filled" : ""}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntroScreen({ config, onStart }) {
  const { level, compOrder, competencies } = config;
  return (
    <div className="screen intro">
      <div className="intro-glow" />
      <span className="eyebrow">
        {config.game.name} · {config.collectionLabel}
      </span>
      <h1 className="intro-title">
        {level.key}
        <br />
        {level.name}
      </h1>
      <p className="intro-tagline">{level.tagline}</p>
      <p className="intro-body">{level.intro}</p>

      <div className="comp-legend">
        {compOrder.map((c) => (
          <div className="comp-legend-item" key={c}>
            <span className="comp-legend-icon">{competencies[c].icon}</span>
            <div>
              <div className="comp-legend-name">{competencies[c].name}</div>
              <div className="comp-legend-def">{competencies[c].def}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="intro-rule">
        There's no single right answer here — every option trades a strength for a weakness,
        so pick the one you'd actually defend, not the one that sounds best. Pass gate: all four
        competencies at 3/4 or above.
        {level.nextLevelName ? ` Clear it and ${level.nextLevelName} unlocks next.` : ""} The real
        value is in comparing notes with the group afterward — argue it out.
      </p>

      <button className="btn-primary" onClick={onStart}>
        Begin →
      </button>
    </div>
  );
}

function shuffledIndices(length) {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function QuestionScreen({ q, qIndex, onAnswer, animKey, selectedOption }) {
  // Options are shown in a fresh random order each time this question is displayed,
  // but onAnswer is always called with the option's original index so scoring,
  // the popup, and the results breakdown can keep indexing into q.options unchanged.
  const order = useMemo(() => shuffledIndices(q.options.length), [q]);

  return (
    <div className="screen question" key={animKey}>
      <span className="q-tag">scenario {qIndex + 1}</span>
      <h2 className="q-title">{q.title}</h2>
      <p className="q-text">{q.text}</p>
      <div className="options">
        {order.map((origIdx, pos) => {
          const opt = q.options[origIdx];
          return (
            <button
              className={`option-card${selectedOption === origIdx ? " option-card-selected" : ""}`}
              key={origIdx}
              onClick={() => onAnswer(origIdx)}
              disabled={selectedOption !== null}
            >
              <span className="option-letter">{String.fromCharCode(65 + pos)}</span>
              <span className="option-text">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScorePopup({ config, feedback, onContinue, isLast }) {
  const { comps, scores, why } = feedback;
  const dataByComp = {};
  comps.forEach((c, i) => {
    dataByComp[c] = { score: scores[i], why: why?.[i] };
  });

  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <span className="popup-eyebrow">How that choice landed</span>
        <div className="popup-rows">
          {config.compOrder.map((c) => {
            const data = dataByComp[c];
            const tested = data !== undefined;
            const positive = tested && data.score >= 3;
            return (
              <div className="popup-row" key={c}>
                <div className="popup-row-top">
                  <div className="popup-row-label">
                    <span>{config.competencies[c].icon}</span>
                    <span>{config.competencies[c].name}</span>
                  </div>
                  <span
                    className={`popup-badge ${
                      tested ? (positive ? "popup-badge-pos" : "popup-badge-neg") : "popup-badge-neutral"
                    }`}
                  >
                    {tested ? `${positive ? "+" : "–"} ${data.score}/4` : "+0"}
                  </span>
                </div>
                {tested && data.why && <p className="popup-row-why">{data.why}</p>}
              </div>
            );
          })}
        </div>
        <button className="btn-primary popup-continue" onClick={onContinue}>
          {isLast ? "See your results →" : "Continue →"}
        </button>
      </div>
    </div>
  );
}

function ResultsScreen({ config, answers, onRestart }) {
  const results = useMemo(() => computeResults(config, answers), [config, answers]);
  const breakdown = useMemo(() => getCompetencyBreakdown(config, answers), [config, answers]);
  const [copied, setCopied] = useState(false);
  const { compOrder, competencies, level } = config;

  const strengths = compOrder.filter((c) => results.avg[c] !== null && results.avg[c] >= 3);
  const gaps = compOrder.filter((c) => results.avg[c] !== null && results.avg[c] < 3);

  const bestInstance = (c) => breakdown[c].reduce((a, b) => (b.score > a.score ? b : a), breakdown[c][0]);
  const worstInstance = (c) => breakdown[c].reduce((a, b) => (b.score < a.score ? b : a), breakdown[c][0]);

  const copySummary = () => {
    const lines = [
      `${config.collectionLabel} — ${config.game.name} (${level.key} ${level.name})`,
      results.cleared ? `Result: GATE CLEARED` : `Result: Not yet cleared`,
      `Total: ${fmtScore(results.total)} / ${level.threshold} needed`,
      "",
      ...compOrder.map((c) => `${competencies[c].name}: ${results.avg[c] !== null ? fmtScore(results.avg[c]) : "—"} / 4`),
      "",
      strengths.length
        ? `Strong on: ${strengths.map((c) => competencies[c].name).join(", ")}`
        : "No competency cleared the pass line this run.",
      gaps.length
        ? `Gaps remaining: ${gaps.map((c) => competencies[c].name).join(", ")}`
        : "No gaps — every competency cleared the pass line.",
      "",
      results.redFlagsHit.length
        ? `Red flags triggered: ${results.redFlagsHit.map((r) => r.flag).join("; ")}`
        : "No red flags triggered.",
    ];
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="screen results">
      <span className="eyebrow">your gate reading · {level.key}</span>
      <h1 className="results-verdict" style={{ color: results.cleared ? "var(--moss)" : "var(--paper)" }}>
        {results.cleared ? "Gate Cleared" : "Gate Not Yet Cleared"}
      </h1>
      <p className="results-tagline">
        {results.cleared
          ? results.strongSignal
            ? `Strong signal — well clear of the ${level.key} bar.${
                level.nextLevelName ? ` Ready for ${level.nextLevelName}.` : ""
              }`
            : `Cleared the ${level.key} bar.${level.nextLevelName ? ` Ready for ${level.nextLevelName} when it's built.` : ""}`
          : `Below the pass line for one or more competencies — see the breakdown above.`}
      </p>

      <div className="summary-section">
        {strengths.length > 0 && (
          <div className="summary-block summary-strengths">
            <span className="summary-heading">What went well</span>
            <ul>
              {strengths.map((c) => {
                const inst = bestInstance(c);
                return (
                  <li key={c}>
                    <strong>{competencies[c].name}</strong> ({fmtScore(results.avg[c])}/4)
                    {inst?.why ? <> — {inst.why}</> : null}
                    {inst?.title ? <span className="summary-source"> · {inst.title}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {gaps.length > 0 && (
          <div className="summary-block summary-gaps">
            <span className="summary-heading">Gaps remaining</span>
            <ul>
              {gaps.map((c) => {
                const inst = worstInstance(c);
                return (
                  <li key={c}>
                    <strong>{competencies[c].name}</strong> ({fmtScore(results.avg[c])}/4)
                    {inst?.why ? <> — {inst.why}</> : null}
                    {inst?.title ? <span className="summary-source"> · {inst.title}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {results.redFlagsHit.length > 0 && (
        <div className="redflag-panel">
          <span className="redflag-title">🚩 Red flags this run triggered</span>
          <ul>
            {results.redFlagsHit.map((rf, i) => (
              <li key={i}>
                <strong>{rf.q}</strong> — {rf.flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="results-actions">
        <button className="btn-secondary" onClick={copySummary}>
          {copied ? "Copied ✓" : "Copy summary"}
        </button>
        <button className="btn-primary" onClick={onRestart}>
          Run it again
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   ENGINE ROOT — the only exported piece. Takes a config object
   (see shape above) and renders the full intro → quiz → results flow.
   ============================================================ */

export default function GameEngine({ config }) {
  const [screen, setScreen] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(config.questions.length).fill(null));
  const [animKey, setAnimKey] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleAnswer = (optIdx) => {
    if (selectedOption !== null) return;
    const next = [...answers];
    next[qIndex] = optIdx;
    setAnswers(next);
    setSelectedOption(optIdx);
  };

  const handleContinue = () => {
    setSelectedOption(null);
    if (qIndex + 1 < config.questions.length) {
      setQIndex(qIndex + 1);
      setAnimKey((k) => k + 1);
    } else {
      setScreen("results");
    }
  };

  const restart = () => {
    setAnswers(Array(config.questions.length).fill(null));
    setQIndex(0);
    setAnimKey((k) => k + 1);
    setSelectedOption(null);
    setScreen("intro");
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .app {
          --ink: #FFF8EF;
          --surface: #FFFFFF;
          --surface-2: #F2E4CE;
          --line: #E9DAC0;
          --paper: #2E2A22;
          --paper-soft: #6B6152;
          --muted: #9C8F79;
          --moss: #2E9E63;
          --ember: #F2A93B;
          --rose: #E1574F;

          background: var(--ink);
          color: var(--paper);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          width: 100%;
          position: relative;
        }
        .app * { box-sizing: border-box; }
        .app button { font-family: inherit; cursor: pointer; }

        .dashboard {
          --dash-text: #F4EFE6;
          --dash-muted: #A9BBAA;
          --dash-line: rgba(244,239,230,0.16);
          position: sticky;
          top: 0;
          z-index: 10;
          background: linear-gradient(160deg, #234433 0%, #17291F 100%);
          border-radius: 0 0 22px 22px;
          box-shadow: 0 14px 30px rgba(20, 35, 25, 0.22);
        }
        .dashboard-inner {
          max-width: 820px;
          margin: 0 auto;
          padding: 16px 28px 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-mark { color: var(--moss); font-size: 16px; }
        .brand-name {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--dash-muted);
        }

        .dashboard-main { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 28px; }
        .dashboard-score-block { display: flex; flex-direction: column; gap: 2px; }
        .dashboard-score-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dash-muted);
        }
        .dashboard-score-value {
          font-family: 'Fraunces', serif;
          font-size: 40px;
          font-weight: 600;
          color: var(--dash-text);
          line-height: 1;
        }
        .dashboard-score-sep { color: var(--dash-muted); font-weight: 400; font-size: 0.6em; }

        .comp-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 24px; }
        .comp-bar { display: flex; align-items: center; gap: 9px; }
        .comp-bar-icon { font-size: 16px; width: 18px; text-align: center; flex-shrink: 0; }
        .comp-bar-name { font-size: 13.5px; line-height: 1.2; color: var(--dash-muted); width: 116px; flex-shrink: 0; }
        .comp-bar-track { position: relative; flex: 1; height: 6px; background: var(--dash-line); border-radius: 3px; }
        .comp-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease, background 0.3s ease; }
        .comp-bar-threshold { position: absolute; top: -2px; left: 75%; width: 2px; height: 10px; background: var(--dash-muted); opacity: 0.7; }
        .comp-bar-value {
          font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: var(--dash-text);
          width: 26px; text-align: right; flex-shrink: 0;
        }

        .dashboard-progress { display: flex; align-items: center; gap: 8px; }
        .dashboard-progress-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--dash-muted); letter-spacing: 0.04em;
        }
        .progress-ticks { display: flex; gap: 4px; flex: 1; }
        .tick { width: 18px; height: 4px; border-radius: 2px; background: var(--dash-line); }
        .tick-filled { background: var(--moss); box-shadow: 0 0 6px rgba(46, 158, 99, 0.65); }

        .screen { max-width: 680px; margin: 0 auto; padding: 40px 24px 56px; animation: rise 0.5s ease both; }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .screen { animation: none; } }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--moss);
        }

        .intro { position: relative; padding-top: 72px; }
        .intro-glow {
          position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(242,169,59,0.22) 0%, rgba(242,169,59,0) 70%);
          pointer-events: none;
        }
        .intro-title {
          font-family: 'Fraunces', serif;
          font-size: 48px;
          line-height: 1.05;
          font-weight: 600;
          margin: 14px 0 10px;
        }
        .intro-tagline { font-family: 'Fraunces', serif; font-style: italic; font-size: 17px; color: var(--moss); margin-bottom: 18px; }
        .intro-body { font-size: 15.5px; line-height: 1.7; color: var(--paper-soft); max-width: 560px; margin-bottom: 24px; }

        .comp-legend { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .comp-legend-item { display: flex; gap: 12px; align-items: flex-start; }
        .comp-legend-icon { font-size: 18px; margin-top: 1px; }
        .comp-legend-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
        .comp-legend-def { font-size: 13px; color: var(--muted); line-height: 1.5; }

        .intro-rule {
          font-size: 13.5px;
          color: var(--muted);
          border-left: 2px solid var(--moss);
          padding-left: 14px;
          margin-bottom: 24px;
          max-width: 480px;
          line-height: 1.6;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--moss), #249457);
          color: #FFFFFF;
          border: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 6px 16px rgba(46,158,99,0.28);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(46,158,99,0.36); }
        .btn-primary:focus-visible { outline: 2px solid var(--paper); outline-offset: 3px; }

        .q-tag {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--moss);
        }
        .q-title { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 600; margin: 10px 0 14px; }
        .q-text { font-size: 15.5px; line-height: 1.65; color: var(--paper-soft); margin-bottom: 28px; }
        .options { display: flex; flex-direction: column; gap: 10px; }
        .option-card {
          display: flex; align-items: flex-start; gap: 14px;
          background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
          padding: 16px 18px; text-align: left; color: var(--paper);
          box-shadow: 0 2px 10px rgba(60,45,20,0.04);
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
        }
        .option-card:hover { border-color: var(--moss); background: var(--surface-2); transform: translateX(2px); }
        .option-card:focus-visible { outline: 2px solid var(--moss); outline-offset: 2px; }
        .option-card:disabled { cursor: default; }
        .option-card:disabled:hover { transform: none; }
        .option-card-selected { border-color: var(--moss); background: var(--surface-2); }

        .popup-overlay {
          position: fixed; inset: 0; z-index: 50;
          background: rgba(20, 15, 5, 0.45);
          backdrop-filter: blur(2px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: fadeIn 0.2s ease both;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .popup-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px 26px;
          max-width: 420px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(20, 15, 5, 0.25);
          animation: popIn 0.25s ease both;
        }
        @keyframes popIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .popup-overlay, .popup-card { animation: none; } }
        .popup-eyebrow {
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--moss);
        }
        .popup-rows { display: flex; flex-direction: column; gap: 14px; margin: 16px 0 20px; }
        .popup-row-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .popup-row-label { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--paper); font-weight: 500; }
        .popup-badge {
          font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600;
          padding: 3px 10px; border-radius: 20px; white-space: nowrap;
        }
        .popup-badge-pos { background: rgba(46,158,99,0.14); color: var(--moss); }
        .popup-badge-neg { background: rgba(242,169,59,0.16); color: #B87A15; }
        .popup-badge-neutral { background: var(--surface-2); color: var(--muted); }
        .popup-row-why { font-size: 12.5px; line-height: 1.5; color: var(--paper-soft); margin-top: 4px; }
        .popup-continue { width: 100%; }
        .option-letter {
          font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; color: var(--moss);
          border: 1px solid var(--line); border-radius: 50%; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .option-text { font-size: 14.5px; line-height: 1.55; }

        .results-verdict { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 600; margin: 10px 0 12px; }
        .results-tagline { color: var(--paper-soft); font-size: 15px; line-height: 1.6; max-width: 480px; margin-bottom: 28px; }

        .summary-section { display: flex; flex-direction: column; gap: 18px; margin-bottom: 28px; }
        .summary-block {
          background: var(--surface); border: 1px solid var(--line); border-radius: 10px;
          padding: 16px 20px;
        }
        .summary-heading {
          font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.08em;
          text-transform: uppercase; font-weight: 600;
        }
        .summary-strengths .summary-heading { color: var(--moss); }
        .summary-gaps .summary-heading { color: #B87A15; }
        .summary-block ul { margin: 10px 0 0; padding-left: 18px; }
        .summary-block li { font-size: 13.5px; line-height: 1.6; color: var(--paper-soft); margin-bottom: 6px; }
        .summary-block li:last-child { margin-bottom: 0; }
        .summary-block li strong { color: var(--paper); }
        .summary-source { color: var(--muted); font-size: 12px; }

        .redflag-panel {
          background: rgba(225,87,79,0.07); border: 1px solid rgba(225,87,79,0.28);
          border-radius: 10px; padding: 18px 20px; margin-bottom: 28px;
        }
        .redflag-title { font-weight: 600; font-size: 13.5px; color: var(--rose); }
        .redflag-panel ul { margin: 10px 0 0; padding-left: 18px; }
        .redflag-panel li { font-size: 13px; line-height: 1.6; color: var(--paper-soft); margin-bottom: 4px; }

        .results-actions { display: flex; gap: 12px; }
        .btn-secondary {
          background: var(--surface); color: var(--paper); border: 1px solid var(--line);
          padding: 13px 22px; border-radius: 6px; font-size: 14px; font-weight: 500;
          box-shadow: 0 2px 8px rgba(60,45,20,0.04);
        }
        .btn-secondary:hover { border-color: var(--paper); }

        @media (max-width: 640px) {
          .dashboard-main { grid-template-columns: 1fr; gap: 10px; }
          .comp-bars { grid-template-columns: 1fr; gap: 6px; }
          .intro-title { font-size: 34px; }
          .q-title { font-size: 24px; }
        }
      `}</style>

      {screen !== "intro" && (
        <Dashboard config={config} answers={answers} qIndex={screen === "results" ? config.questions.length : qIndex} total={config.questions.length} />
      )}

      {screen === "intro" && <IntroScreen config={config} onStart={() => setScreen("quiz")} />}

      {screen === "quiz" && (
        <QuestionScreen
          q={config.questions[qIndex]}
          qIndex={qIndex}
          onAnswer={handleAnswer}
          animKey={animKey}
          selectedOption={selectedOption}
        />
      )}

      {screen === "quiz" && selectedOption !== null && (
        <ScorePopup
          config={config}
          feedback={{
            comps: config.questions[qIndex].comps,
            scores: config.questions[qIndex].options[selectedOption].scores,
            why: config.questions[qIndex].options[selectedOption].why,
          }}
          onContinue={handleContinue}
          isLast={qIndex + 1 >= config.questions.length}
        />
      )}

      {screen === "results" && <ResultsScreen config={config} answers={answers} onRestart={restart} />}
    </div>
  );
}
