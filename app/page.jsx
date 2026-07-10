'use client';
import React, { useState, useMemo, useRef } from "react";

/* ============================================================
   LEVEL CONFIG — Game 1: L0 Pre-Facilitator
   (This block is the only thing that changes for Game 2 / Game 3.
   Everything below the config is a level-agnostic engine.)
   ============================================================ */

const LEVEL = {
  gameNumber: 1,
  totalGames: 3,
  id: 0,
  name: "Pre-Facilitator",
  tagline: "You show up and you execute.",
  intro:
    "No formal training or coaching is provided at this level. Readiness is assessed through performance — it is earned, not taught. This game puts you through eight prep-and-ownership scenarios that mirror what actually breaks (or holds) before a facilitator ever walks into a room.",
  threshold: 12, // sum of 4 competency averages (out of 4 each), pass = each avg >= 3
  nextLevelName: "Small Group Facilitator",
  accent: "var(--moss)",
};

const COMPETENCIES = {
  execution_discipline: {
    name: "Execution Discipline",
    icon: "🎯",
    def: "Completes tasks without supervision. Delivers on time. Sustains focus.",
  },
  cognitive_ownership: {
    name: "Cognitive Ownership",
    icon: "🧠",
    def: "Thinks through problems before asking. Fills gaps independently. Does not stall.",
  },
  task_integrity: {
    name: "Task Integrity",
    icon: "📋",
    def: "Produces usable output. Does not create rework for others.",
  },
  stability: {
    name: "Stability",
    icon: "⚓",
    def: "Continues despite ambiguity. Maintains momentum when disrupted.",
  },
};

const COMP_ORDER = ["execution_discipline", "cognitive_ownership", "task_integrity", "stability"];

const RED_FLAG_LIBRARY = [
  "Fails to complete tasks without follow-up",
  "Misses deadlines or produces inconsistent output",
  "Requires repeated instructions / supervision",
  "Escalates problems without attempting solutions",
  "Stalls when faced with ambiguity or missing information",
  "Produces work that creates rework for others",
];

const QUESTIONS = [
  {
    title: "The Silent Deadline",
    text: "You're asked to prepare the participant workbook for a session in 5 days. No one checks in on your progress. The day before, you realize you're not finished.",
    comps: ["execution_discipline", "task_integrity"],
    options: [
      { text: "Submit what you have, even though some sections are still placeholder text — it's mostly done.", scores: [2, 1] },
      { text: "Pull a late night to finish it properly and send a complete, usable workbook by the deadline.", scores: [4, 4] },
      { text: "Send a message saying you're behind and ask what you should do.", scores: [1, 1], redFlag: 2 },
      { text: "Finish the core sections fully, clearly flag the two that are incomplete with a note on what's missing, and deliver on time.", scores: [3, 3] },
    ],
  },
  {
    title: "The Broken Brief",
    text: "Halfway through building a session, the client changes the audience from “new hires” to “senior leaders” with no other details. Your prep deadline hasn't moved.",
    comps: ["cognitive_ownership", "stability"],
    options: [
      { text: "Stop working until the client clarifies exactly what senior leaders need.", scores: [1, 1], redFlag: 4 },
      { text: "Rework the session yourself based on what you know about senior-leader audiences, and flag your assumptions to the client for a quick check.", scores: [4, 4] },
      { text: "Keep building the original version since it's already half done.", scores: [1, 2] },
      { text: "Redo only the parts that obviously clash with a senior audience, and leave the rest as is.", scores: [2, 3] },
    ],
  },
  {
    title: "The Gap in the Instructions",
    text: "You've been asked to design an icebreaker for a group of 30, but no one tells you the room layout — or whether they'll be seated or standing.",
    comps: ["execution_discipline", "cognitive_ownership"],
    options: [
      { text: "Wait for someone to tell you the room layout before designing anything.", scores: [1, 1], redFlag: 2 },
      { text: "Design an icebreaker that works for both seated and standing groups, so it's ready regardless of layout.", scores: [4, 4] },
      { text: "Design based on a seated layout since that's most common, and hope for the best.", scores: [2, 2] },
      { text: "Check with the venue contact yourself, quickly, and adapt your design once you get a same-day answer.", scores: [3, 3] },
    ],
  },
  {
    title: "The Reused Deck",
    text: "Your laptop crashes and you lose the latest version of the slide deck two days before a session. You have an older backup from three weeks ago.",
    comps: ["task_integrity", "stability"],
    options: [
      { text: "Use the old backup as-is and hope no one notices the missing updates.", scores: [1, 2], redFlag: 6 },
      { text: "Rebuild the missing updates from memory and whatever notes you can find, checking each section as you go.", scores: [3, 3] },
      { text: "Tell the client the deck might be a bit outdated and use the backup.", scores: [2, 2] },
      { text: "Reconstruct the deck late into the night, cross-checking your prep notes line by line so nothing is missed.", scores: [4, 4] },
    ],
  },
  {
    title: "The Interruption",
    text: "You're in the middle of building session materials when you're pulled into an unrelated urgent meeting that eats two hours of your day. Your deadline is unchanged.",
    comps: ["execution_discipline", "stability"],
    options: [
      { text: "Let the deadline slip a little since the interruption wasn't your fault.", scores: [1, 1], redFlag: 1 },
      { text: "Come back afterward, reassess what's left, and adjust your evening plans to still deliver on time.", scores: [4, 4] },
      { text: "Rush through the remaining prep quickly to make up time, cutting corners where you can.", scores: [2, 2] },
      { text: "Finish the most critical sections first and deliver a slightly leaner but complete version on time.", scores: [3, 3] },
    ],
  },
  {
    title: "The Handoff Gap",
    text: "You inherit a session outline from a colleague who's left the project. Some of their notes don't make sense, and a few slides reference an activity that isn't included anywhere.",
    comps: ["cognitive_ownership", "task_integrity"],
    options: [
      { text: "Deliver the outline as-is and let whoever runs the session figure out the missing activity.", scores: [1, 1], redFlag: 5 },
      { text: "Work out what the missing activity was likely meant to be, build it, and note where you made a judgment call.", scores: [4, 4] },
      { text: "Delete the confusing references so the deck looks clean, without addressing what's actually missing.", scores: [1, 2] },
      { text: "Flag the exact gaps to your team lead with your best guess at a fix, and proceed once you get a quick thumbs up.", scores: [3, 3] },
    ],
  },
  {
    title: "The Last-Minute Ask",
    text: "Two days before a session, you're asked to also prepare a printed handout — something that wasn't in the original scope.",
    comps: ["execution_discipline", "task_integrity"],
    options: [
      { text: "Say there isn't enough time and let it slide.", scores: [1, 1], redFlag: 0 },
      { text: "Build a clean, complete handout that covers the essentials, and get it printed with a day to spare.", scores: [4, 4] },
      { text: "Throw together a rough handout at the last minute, typos and all — something is better than nothing.", scores: [2, 1] },
      { text: "Build a solid first draft, reusing a couple of slides you know are already polished to save time.", scores: [3, 3] },
    ],
  },
  {
    title: "The Contradicting Stakeholders",
    text: "Two people on the client side give you contradicting instructions about what the session should focus on, three days before it runs.",
    comps: ["cognitive_ownership", "stability"],
    options: [
      { text: "Follow whichever instruction came most recently, without flagging the contradiction.", scores: [1, 1], redFlag: 3 },
      { text: "Send one short email naming the contradiction and proposing a specific way to reconcile it, then keep building while you wait.", scores: [4, 4] },
      { text: "Try to build a session that somehow includes both directions in full.", scores: [2, 2] },
      { text: "Pick the instruction that seems more senior, and proceed without confirming.", scores: [2, 3] },
    ],
  },
];

/* ============================================================
   SCORING ENGINE — level-agnostic
   ============================================================ */

function computeResults(answers) {
  const sums = {};
  const counts = {};
  COMP_ORDER.forEach((c) => {
    sums[c] = 0;
    counts[c] = 0;
  });
  const redFlagsHit = [];

  answers.forEach((optIdx, qIdx) => {
    if (optIdx == null) return;
    const q = QUESTIONS[qIdx];
    const opt = q.options[optIdx];
    q.comps.forEach((c, i) => {
      sums[c] += opt.scores[i];
      counts[c] += 1;
    });
    if (opt.redFlag !== undefined) {
      redFlagsHit.push({ q: q.title, flag: RED_FLAG_LIBRARY[opt.redFlag] });
    }
  });

  const avg = {};
  COMP_ORDER.forEach((c) => {
    avg[c] = counts[c] > 0 ? sums[c] / counts[c] : null;
  });

  const touched = COMP_ORDER.every((c) => avg[c] !== null);
  const allPass = touched && COMP_ORDER.every((c) => avg[c] >= 3);
  const total = COMP_ORDER.reduce((s, c) => s + (avg[c] || 0), 0);
  // Red flags aren't a hard block — a red-flag option already scores low (1/4),
  // which drags down the competency averages on its own. Whether that's enough
  // to fail the gate depends on the rest of the run, same as any other answer.
  const cleared = allPass && total >= LEVEL.threshold;
  const strongSignal = cleared && total > LEVEL.threshold + 1;

  return { avg, redFlagsHit, total, cleared, strongSignal, touched };
}

/* ============================================================
   SIGNATURE VISUAL — the Gate
   Four pillars (one per competency), a lintel that lights up
   only once every pillar clears the pass line.
   ============================================================ */

function Gate({ avg, size = 340 }) {
  const width = 400;
  const height = 260;
  const groundY = 220;
  const maxH = 140;
  const pillarW = 46;
  const xs = [70, 160, 250, 340];
  const passLineFrac = 0.75; // score 3 out of 4

  const allPass = COMP_ORDER.every((c) => avg[c] !== null && avg[c] >= 3);
  const lintelY = groundY - maxH - 24;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={size} height={(size * height) / width} className="gate">
      {/* lintel */}
      <rect
        x={xs[0] - pillarW / 2 - 6}
        y={lintelY}
        width={xs[3] - xs[0] + pillarW + 12}
        height={14}
        rx="3"
        fill={allPass ? "var(--moss)" : "var(--surface-2)"}
        opacity={allPass ? 1 : 0.85}
        style={{ transition: "fill 0.5s ease" }}
      />
      {allPass && (
        <rect
          x={xs[0] - pillarW / 2 - 6}
          y={lintelY}
          width={xs[3] - xs[0] + pillarW + 12}
          height={14}
          rx="3"
          fill="none"
          stroke="var(--paper)"
          strokeOpacity="0.4"
        />
      )}

      {/* ground */}
      <line x1="20" y1={groundY} x2={width - 20} y2={groundY} stroke="var(--line)" strokeWidth="1" />

      {/* pass-line marker */}
      <line
        x1={xs[0] - pillarW}
        y1={groundY - maxH * passLineFrac}
        x2={xs[3] + pillarW}
        y2={groundY - maxH * passLineFrac}
        stroke="var(--muted)"
        strokeDasharray="3 4"
        strokeWidth="1"
        opacity="0.55"
      />

      {COMP_ORDER.map((c, i) => {
        const a = avg[c];
        const filled = a !== null;
        const h = filled ? Math.max((a / 4) * maxH, 6) : 4;
        const pass = filled && a >= 3;
        return (
          <g key={c}>
            <rect
              x={xs[i] - pillarW / 2}
              y={groundY - maxH}
              width={pillarW}
              height={maxH}
              fill="var(--surface-2)"
              opacity="0.9"
              rx="4"
            />
            <rect
              x={xs[i] - pillarW / 2}
              y={groundY - h}
              width={pillarW}
              height={h}
              fill={pass ? "var(--moss)" : "var(--ember)"}
              opacity={filled ? 1 : 0}
              rx="4"
              style={{ transition: "height 0.5s ease, y 0.5s ease" }}
            />
            <text
              x={xs[i]}
              y={groundY + 20}
              textAnchor="middle"
              className="gate-label"
            >
              {COMPETENCIES[c].icon}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   UI PIECES
   ============================================================ */

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

const GAUGE_START = -120;
const GAUGE_END = 120;

function Gauge({ id, avg, size = 76 }) {
  const c = COMPETENCIES[id];
  const filled = avg !== null;
  const pct = filled ? Math.max(0, Math.min(1, avg / 4)) : 0;
  const valueAngle = GAUGE_START + pct * (GAUGE_END - GAUGE_START);
  const passAngle = GAUGE_START + 0.75 * (GAUGE_END - GAUGE_START);
  const pass = filled && avg >= 3;
  const color = !filled ? "var(--dash-muted)" : pass ? "var(--moss)" : "var(--ember)";
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const needleTip = polarToCartesian(cx, cy, r - 6, filled ? valueAngle : GAUGE_START);
  const tickOuter = polarToCartesian(cx, cy, r + 6, passAngle);
  const tickInner = polarToCartesian(cx, cy, r - 6, passAngle);

  return (
    <div className="gauge">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <path d={describeArc(cx, cy, r, GAUGE_START, GAUGE_END)} className="gauge-track" fill="none" />
        {filled && (
          <path
            d={describeArc(cx, cy, r, GAUGE_START, valueAngle)}
            stroke={color}
            className="gauge-value"
            fill="none"
          />
        )}
        <line x1={tickInner.x} y1={tickInner.y} x2={tickOuter.x} y2={tickOuter.y} className="gauge-passtick" />
        <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} className="gauge-needle" />
        <circle cx={cx} cy={cy} r="4" className="gauge-hub" />
      </svg>
      <div className="gauge-readout">
        <span className="gauge-icon">{c.icon}</span>
        <span className="gauge-value-text">{filled ? avg.toFixed(1) : "–"}</span>
      </div>
    </div>
  );
}

function Dashboard({ answers, qIndex, total }) {
  const results = useMemo(() => computeResults(answers), [answers]);
  const segments = Array.from({ length: total });
  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-left">
          <div className="brand">
            <span className="brand-mark">◐</span>
            <span className="brand-name">
              The Facilitator Matrix · Game {LEVEL.gameNumber} of {LEVEL.totalGames} · L{LEVEL.id}
            </span>
          </div>
          <div className="readout-row">
            <span className="readout-label">Question</span>
            <span className="readout-value">
              {String(Math.min(qIndex + 1, total)).padStart(2, "0")}
              <span className="readout-sep"> / </span>
              {String(total).padStart(2, "0")}
            </span>
          </div>
          <div className="progress-ticks">
            {segments.map((_, i) => (
              <span key={i} className={`tick${i < qIndex ? " tick-filled" : ""}`} />
            ))}
          </div>
        </div>
        <div className="dashboard-right">
          {COMP_ORDER.map((c) => (
            <Gauge key={c} id={c} avg={results.avg[c]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IntroScreen({ onStart }) {
  return (
    <div className="screen intro">
      <div className="intro-glow" />
      <span className="eyebrow">
        game {LEVEL.gameNumber} of {LEVEL.totalGames} · the facilitator matrix
      </span>
      <h1 className="intro-title">
        L{LEVEL.id}
        <br />
        {LEVEL.name}
      </h1>
      <p className="intro-tagline">{LEVEL.tagline}</p>
      <p className="intro-body">{LEVEL.intro}</p>

      <div className="comp-legend">
        {COMP_ORDER.map((c) => (
          <div className="comp-legend-item" key={c}>
            <span className="comp-legend-icon">{COMPETENCIES[c].icon}</span>
            <div>
              <div className="comp-legend-name">{COMPETENCIES[c].name}</div>
              <div className="comp-legend-def">{COMPETENCIES[c].def}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="intro-rule">
        Pass gate: all four competencies at 3/4 or above. Some options reflect classic red-flag
        behavior — they won't auto-fail you, but they score low and pull your average down. Clear
        the gate and the door to L{LEVEL.id + 1} — {LEVEL.nextLevelName} — opens.
      </p>

      <button className="btn-primary" onClick={onStart}>
        Begin Game {LEVEL.gameNumber} →
      </button>
    </div>
  );
}

function QuestionScreen({ q, qIndex, total, onAnswer, animKey }) {
  return (
    <div className="screen question" key={animKey}>
      <span className="q-tag">
        scenario {qIndex + 1} · testing {q.comps.map((c) => COMPETENCIES[c].name).join(" + ")}
      </span>
      <h2 className="q-title">{q.title}</h2>
      <p className="q-text">{q.text}</p>
      <div className="options">
        {q.options.map((opt, i) => (
          <button className="option-card" key={i} onClick={() => onAnswer(i)}>
            <span className="option-letter">{String.fromCharCode(65 + i)}</span>
            <span className="option-text">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompetencyBar({ id, avg }) {
  const c = COMPETENCIES[id];
  const pct = avg !== null ? Math.max((avg / 4) * 100, 3) : 0;
  const pass = avg !== null && avg >= 3;
  return (
    <div className="comp-row">
      <div className="comp-label">
        <span>{c.icon}</span>
        <span>{c.name}</span>
      </div>
      <div className="comp-track">
        <div className="comp-fill" style={{ width: `${pct}%`, background: pass ? "var(--moss)" : "var(--ember)" }} />
        <div className="comp-threshold" style={{ left: "75%" }} />
      </div>
      <span className="comp-score">{avg !== null ? avg.toFixed(1) : "—"} / 4</span>
    </div>
  );
}

function ResultsScreen({ answers, onRestart }) {
  const results = useMemo(() => computeResults(answers), [answers]);
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef(null);

  const copySummary = () => {
    const lines = [
      `The Facilitator Matrix — Game ${LEVEL.gameNumber} (L${LEVEL.id} ${LEVEL.name})`,
      results.cleared
        ? `Result: GATE CLEARED — ready for L${LEVEL.id + 1} readiness track`
        : `Result: Not yet cleared`,
      `Total: ${results.total.toFixed(1)} / ${LEVEL.threshold} needed`,
      "",
      ...COMP_ORDER.map((c) => `${COMPETENCIES[c].name}: ${results.avg[c]?.toFixed(1) ?? "—"} / 4`),
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
    <div className="screen results" ref={summaryRef}>
      <span className="eyebrow">your gate reading · L{LEVEL.id}</span>
      <div className="results-hero">
        <div className="gate-card">
          <Gate avg={results.avg} size={260} />
        </div>
        <div className="results-hero-text">
          <span className="results-standing-label">{results.cleared ? "gate cleared" : "gate not yet cleared"}</span>
          <h1 className="results-standing" style={{ color: results.cleared ? "var(--moss)" : "var(--paper)" }}>
            {results.total.toFixed(1)} / {LEVEL.threshold}
          </h1>
          <p className="results-tagline">
            {results.cleared
              ? results.strongSignal
                ? `Strong signal — well clear of the L${LEVEL.id} bar. Ready to start Game 2 (L1).`
                : `Cleared the L${LEVEL.id} bar. Ready to start Game 2 (L1) when it's built.`
              : `Below the pass line for one or more competencies. That's useful data — see the breakdown below.`}
          </p>
        </div>
      </div>

      <div className="level-card">
        {COMP_ORDER.map((c) => (
          <CompetencyBar key={c} id={c} avg={results.avg[c]} />
        ))}
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
   APP
   ============================================================ */

export default function FacilitatorMatrixGameL0() {
  const [screen, setScreen] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [animKey, setAnimKey] = useState(0);

  const handleAnswer = (optIdx) => {
    const next = [...answers];
    next[qIndex] = optIdx;
    setAnswers(next);
    if (qIndex + 1 < QUESTIONS.length) {
      setTimeout(() => {
        setQIndex(qIndex + 1);
        setAnimKey((k) => k + 1);
      }, 160);
    } else {
      setTimeout(() => setScreen("results"), 220);
    }
  };

  const restart = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setQIndex(0);
    setAnimKey((k) => k + 1);
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
          --dash-muted: #98A2B8;
          --dash-line: rgba(255,255,255,0.12);
          position: sticky;
          top: 0;
          z-index: 10;
          background: linear-gradient(160deg, #1B1F2A 0%, #10131A 100%);
          border-radius: 0 0 22px 22px;
          box-shadow: 0 14px 30px rgba(30, 20, 5, 0.18);
        }
        .dashboard-inner {
          max-width: 820px;
          margin: 0 auto;
          padding: 22px 28px 24px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 24px;
        }
        .dashboard-left { display: flex; flex-direction: column; gap: 10px; min-width: 0; color: var(--dash-text); }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-mark { color: var(--moss); font-size: 15px; }
        .brand-name {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--dash-muted);
        }
        .readout-row { display: flex; align-items: baseline; gap: 8px; }
        .readout-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--dash-muted);
        }
        .readout-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 28px;
          font-weight: 600;
          color: var(--dash-text);
          letter-spacing: 0.02em;
          text-shadow: 0 0 18px rgba(46, 158, 99, 0.35);
        }
        .readout-sep { color: var(--dash-muted); font-weight: 400; }
        .progress-ticks { display: flex; gap: 5px; }
        .tick { width: 20px; height: 6px; border-radius: 3px; background: var(--dash-line); }
        .tick-filled { background: var(--moss); box-shadow: 0 0 8px rgba(46, 158, 99, 0.65); }

        .dashboard-right { display: flex; gap: 16px; }
        .gauge { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .gauge-track { stroke: var(--dash-line); stroke-width: 8; stroke-linecap: round; }
        .gauge-value { stroke-width: 8; stroke-linecap: round; transition: stroke 0.3s ease; }
        .gauge-passtick { stroke: var(--dash-muted); stroke-width: 2; }
        .gauge-needle { stroke: var(--dash-text); stroke-width: 2; stroke-linecap: round; }
        .gauge-hub { fill: var(--dash-text); }
        .gauge-readout { display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; }
        .gauge-icon { font-size: 13px; }
        .gauge-value-text { font-size: 13px; color: var(--dash-text); font-weight: 600; }

        .gate-label { font-size: 16px; fill: var(--paper); }
        .gate-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 20px 24px;
          box-shadow: 0 10px 26px rgba(60, 45, 20, 0.06);
        }

        .screen { max-width: 680px; margin: 0 auto; padding: 56px 24px 80px; animation: rise 0.5s ease both; }
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
        .intro-tagline { font-family: 'Fraunces', serif; font-style: italic; font-size: 17px; color: var(--moss); margin-bottom: 20px; }
        .intro-body { font-size: 15.5px; line-height: 1.7; color: var(--paper-soft); max-width: 560px; margin-bottom: 32px; }

        .comp-legend { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
        .comp-legend-item { display: flex; gap: 12px; align-items: flex-start; }
        .comp-legend-icon { font-size: 18px; margin-top: 1px; }
        .comp-legend-name { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
        .comp-legend-def { font-size: 13px; color: var(--muted); line-height: 1.5; }

        .intro-rule {
          font-size: 13.5px;
          color: var(--muted);
          border-left: 2px solid var(--moss);
          padding-left: 14px;
          margin-bottom: 32px;
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
        .option-letter {
          font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; color: var(--moss);
          border: 1px solid var(--line); border-radius: 50%; width: 24px; height: 24px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .option-text { font-size: 14.5px; line-height: 1.55; }

        .results-hero { display: flex; align-items: center; gap: 32px; margin: 14px 0 36px; flex-wrap: wrap; }
        .results-standing-label {
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--muted);
        }
        .results-standing { font-family: 'Fraunces', serif; font-size: 40px; font-weight: 600; margin: 6px 0 10px; }
        .results-tagline { color: var(--paper-soft); font-size: 14.5px; line-height: 1.6; max-width: 340px; }

        .level-card { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 20px 22px; margin-bottom: 28px; }
        .comp-row { display: grid; grid-template-columns: 190px 1fr 52px; align-items: center; gap: 12px; margin-bottom: 12px; }
        .comp-row:last-child { margin-bottom: 0; }
        .comp-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--paper-soft); }
        .comp-track { position: relative; height: 6px; background: var(--surface-2); border-radius: 3px; }
        .comp-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .comp-threshold { position: absolute; top: -2px; width: 2px; height: 10px; background: var(--muted); opacity: 0.6; }
        .comp-score { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted); text-align: right; }

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
          .dashboard-inner { grid-template-columns: 1fr; }
          .dashboard-right { justify-content: space-between; gap: 10px; }
          .gauge svg { width: 56px; height: 56px; }
          .intro-title { font-size: 34px; }
          .q-title { font-size: 24px; }
          .results-hero { flex-direction: column; align-items: flex-start; }
          .comp-row { grid-template-columns: 140px 1fr 40px; }
        }
      `}</style>

      {screen !== "intro" && (
        <Dashboard answers={answers} qIndex={screen === "results" ? QUESTIONS.length : qIndex} total={QUESTIONS.length} />
      )}

      {screen === "intro" && <IntroScreen onStart={() => setScreen("quiz")} />}

      {screen === "quiz" && (
        <QuestionScreen q={QUESTIONS[qIndex]} qIndex={qIndex} total={QUESTIONS.length} onAnswer={handleAnswer} animKey={animKey} />
      )}

      {screen === "results" && <ResultsScreen answers={answers} onRestart={restart} />}
    </div>
  );
}
