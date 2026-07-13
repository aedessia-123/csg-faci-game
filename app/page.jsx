'use client';
import React, { useState, useMemo } from "react";

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
  tagline: "You're in the room. No script, no training — just you.",
  intro:
    "No formal training or coaching is provided at this level. You're dropped straight into small-group moments with no prep and no script — readiness is judged by how you handle the room, not by how you prepared for it. This game puts you through eight live in-session scenarios that mirror what actually happens (or falls apart) while facilitating a small group.",
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
    title: "The Runaway Talker",
    text: "Ten minutes into a small-group discussion, one participant has been talking for a while, circling the same point. A couple of others have gone quiet and started checking their phones. You still have three items left on the agenda.",
    comps: ["execution_discipline", "task_integrity"],
    options: [
      {
        text: "Interrupt at the next breath, name that you need to move on, and open the floor to the rest of the group.",
        scores: [4, 2],
        why: ["Keeps the agenda moving without losing more time.", "Cuts them off before their point is fully out."],
      },
      {
        text: "Let them finish their thought completely, even if it means dropping one of the later agenda items.",
        scores: [2, 4],
        why: ["Costs you a later agenda item to get here.", "Lets their full point land before you move on."],
      },
      {
        text: "Wait for a natural pause, reflect back the core of what they said, then redirect to the group.",
        scores: [3, 3],
        why: ["A brief wait costs a little time but stays in control.", "Reflecting their point back shows it was heard before moving on."],
      },
      {
        text: "Let the conversation continue as it is, trusting the group to redirect itself if it needs to.",
        scores: [2, 1],
        redFlag: 4,
        why: ["Leaves the agenda drifting with no active management.", "The tangent keeps running instead of resolving into something usable."],
      },
    ],
  },
  {
    title: "The Silence After the Question",
    text: "You ask the group an open question meant to deepen the discussion. Nobody answers. The silence stretches past ten seconds.",
    comps: ["cognitive_ownership", "stability"],
    options: [
      {
        text: "Call on a specific participant by name, so the group has a starting point.",
        scores: [4, 2],
        why: ["Takes ownership of unblocking the silence immediately.", "Puts one person on the spot, which can rattle the room."],
      },
      {
        text: "Hold the silence and stay visibly calm, waiting without rushing to fix it, even past the point of discomfort.",
        scores: [2, 4],
        why: ["Doesn't actively work the problem, just outlasts it.", "Keeps your composure and the room's trust intact."],
      },
      {
        text: "After a brief pause, rephrase the question and offer a short example of your own to open the door.",
        scores: [3, 2],
        why: ["Actively re-frames the question instead of waiting it out.", "Rephrasing this quickly cuts the pause a little short for the room."],
      },
      {
        text: "Assume the question was unclear, move past it, and go straight to the next agenda item.",
        scores: [1, 1],
        redFlag: 4,
        why: ["Abandons the question instead of working through it.", "Drops the thread entirely rather than holding the moment."],
      },
    ],
  },
  {
    title: "The Two Who Clash",
    text: "Two participants start disagreeing sharply, their tone rising. The rest of the small group goes quiet and starts watching you.",
    comps: ["execution_discipline", "cognitive_ownership"],
    options: [
      {
        text: "End the discussion and move to the next agenda item without addressing what happened.",
        scores: [4, 2],
        why: ["Keeps the session on schedule right away.", "Skips the judgment call of actually addressing the conflict."],
      },
      {
        text: "Set the agenda aside and work through the disagreement with them for as long as it takes to reach some resolution.",
        scores: [2, 4],
        why: ["The agenda is set aside indefinitely to do this.", "Shows real judgment working through the actual disagreement."],
      },
      {
        text: "Name what you're noticing, invite each of them to share briefly, then steer back toward the group's shared goal.",
        scores: [2, 3],
        why: ["Still costs a real chunk of the agenda to talk it through.", "Engages with the conflict directly instead of skipping past it."],
      },
      {
        text: "Pause the session and go find the program lead to weigh in on what to do.",
        scores: [1, 1],
        redFlag: 3,
        why: ["Stalls the whole session waiting on someone else.", "Hands off the judgment call instead of making it yourself."],
      },
    ],
  },
  {
    title: "The Off-Script Disclosure",
    text: "Mid-activity, a participant unexpectedly shares something personal and emotionally heavy that has nothing to do with the session's topic. The room goes still.",
    comps: ["task_integrity", "stability"],
    options: [
      {
        text: "Acknowledge it briefly, note it for a private follow-up after, and continue the planned activity without further pause.",
        scores: [4, 2],
        why: ["The planned activity stays complete and on track.", "Moves on quickly without letting the room actually settle."],
      },
      {
        text: "Pause the planned activity entirely and let the conversation go wherever it needs to for as long as it takes.",
        scores: [2, 4],
        why: ["The planned activity is dropped, so nothing gets finished.", "Fully honors the moment and keeps the room steady."],
      },
      {
        text: "Pause briefly to acknowledge what was shared and check on the person, then bring the group back to the activity.",
        scores: [3, 3],
        why: ["The activity picks back up, just a little later.", "A brief check-in settles the room before moving on."],
      },
      {
        text: "Move straight on to the next planned item without pausing on what was shared.",
        scores: [2, 1],
        redFlag: 5,
        why: ["Technically keeps the plan intact, but leaves it unresolved.", "The room doesn't get a moment to settle before moving on."],
      },
    ],
  },
  {
    title: "The Slipping Clock",
    text: "You're 20 minutes from the end of a 90-minute session and still have two activities left. The group is engaged, but there's no way to finish both as planned.",
    comps: ["execution_discipline", "stability"],
    options: [
      {
        text: "Cut the remaining activity and move straight to closing, regardless of where the group is in the moment.",
        scores: [4, 2],
        why: ["Hits the schedule exactly as planned.", "The abrupt cut disrupts the group's sense of momentum."],
      },
      {
        text: "Let the current activity run its natural course, even if the session ends up running past its scheduled end time.",
        scores: [2, 4],
        why: ["The session runs over its scheduled time.", "The group's flow stays smooth and uninterrupted."],
      },
      {
        text: "Decide which activity matters most, shorten or cut the other, and say so transparently to the group.",
        scores: [3, 2],
        why: ["A deliberate cut keeps things close to on-time.", "The cut still unsettles the room a little, even when explained."],
      },
      {
        text: "Try to move through both activities as briefly as possible so everything is technically covered.",
        scores: [2, 1],
        redFlag: 1,
        why: ["Doesn't actually protect the clock, just rushes it.", "The rushed pace unsettles the group's experience."],
      },
    ],
  },
  {
    title: "The Instruction That Didn't Land",
    text: "You give the small group instructions for a paired activity. Partway through, you notice two participants are clearly doing something different from what you intended, but they haven't asked for help.",
    comps: ["cognitive_ownership", "task_integrity"],
    options: [
      {
        text: "Go over and re-explain it to just those two, without interrupting the rest of the room.",
        scores: [4, 2],
        why: ["A quick, independent read of exactly what's needed.", "Leaves it unclear if their output now matches everyone else's."],
      },
      {
        text: "Stop the whole group and re-explain the instructions from scratch to everyone.",
        scores: [2, 4],
        why: ["Overrides your own read with a blanket fix.", "Everyone ends up working from the same clear instructions."],
      },
      {
        text: "Go over, check what they understood, and adjust the activity to fit what's already happened.",
        scores: [2, 3],
        why: ["Takes a moment away from the rest of the room to work this out.", "Tailors the fix so their output still lines up."],
      },
      {
        text: "Note it, but wait to see if they realize and self-correct before the activity ends.",
        scores: [1, 1],
        redFlag: 0,
        why: ["No independent read of what's actually happening.", "Risks their output staying unusable if they never notice."],
      },
    ],
  },
  {
    title: "The Dead Projector",
    text: "Halfway through a session, the projector cuts out and your slides are gone. The small group is looking at you, waiting.",
    comps: ["execution_discipline", "task_integrity"],
    options: [
      {
        text: "Skip the slide-dependent parts entirely and move to whatever doesn't need visuals.",
        scores: [4, 2],
        why: ["Keeps the session moving with no dead time.", "Some planned content never actually gets delivered."],
      },
      {
        text: "Pause the session and take as long as it takes to get the projector working again.",
        scores: [2, 4],
        why: ["Pace stalls out for an unclear stretch of time.", "Once fixed, all the planned content still gets delivered."],
      },
      {
        text: "Keep the session moving from memory using the whiteboard and a verbal recap, then fix the tech in a natural break.",
        scores: [3, 3],
        why: ["Momentum holds with only a minor workaround.", "Covers the same ground, just through a different medium."],
      },
      {
        text: "Wait for the co-facilitator, who's running another room, to come sort it out.",
        scores: [1, 1],
        redFlag: 2,
        why: ["The session stalls waiting on someone else entirely.", "Nothing progresses toward the content in the meantime."],
      },
    ],
  },
  {
    title: "The Fading Room",
    text: "About an hour in, the small group's energy has visibly dropped — shorter answers, less eye contact, a couple of side conversations. Your plan doesn't call for a break yet.",
    comps: ["cognitive_ownership", "stability"],
    options: [
      {
        text: "Stop the current activity and insert an energizer or break right away, adjusting the plan on the spot.",
        scores: [4, 2],
        why: ["Reads the room and acts on it immediately.", "Breaks the plan's structure to make the adjustment."],
      },
      {
        text: "Continue exactly as planned, trusting the structure of the session to carry the group through the dip.",
        scores: [2, 4],
        why: ["Doesn't actually respond to what the room is signaling.", "Keeps the plan's momentum fully intact."],
      },
      {
        text: "Name the dip lightly, insert a short energizer, then return to the plan.",
        scores: [3, 2],
        why: ["A small, deliberate read-and-adjust on the room's energy.", "The short detour still breaks the plan's rhythm a little."],
      },
      {
        text: "Speed up delivery to get through the remaining content faster.",
        scores: [2, 1],
        redFlag: 1,
        why: ["Ignores the actual signal instead of addressing it.", "Rushing past it unsettles the room even further."],
      },
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

function fmtScore(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function getCompetencyBreakdown(answers) {
  const instances = {};
  COMP_ORDER.forEach((c) => {
    instances[c] = [];
  });
  answers.forEach((optIdx, qIdx) => {
    if (optIdx == null) return;
    const q = QUESTIONS[qIdx];
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

function CompBar({ id, avg }) {
  const c = COMPETENCIES[id];
  const filled = avg !== null;
  const pct = filled ? Math.max((avg / 4) * 100, 6) : 0;
  const pass = filled && avg >= 3;
  const color = filled ? (pass ? "var(--moss)" : "var(--ember)") : "var(--dash-line)";
  return (
    <div className="comp-bar">
      <span className="comp-bar-icon">{c.icon}</span>
      <span className="comp-bar-name">{c.name}</span>
      <div className="comp-bar-track">
        <div className="comp-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="comp-bar-threshold" />
      </div>
      <span className="comp-bar-value">{filled ? fmtScore(avg) : "–"}</span>
    </div>
  );
}

function Dashboard({ answers, qIndex, total }) {
  const results = useMemo(() => computeResults(answers), [answers]);
  const segments = Array.from({ length: total });
  const scoreColor = results.cleared ? "var(--moss)" : "var(--dash-text)";
  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <div className="brand">
          <span className="brand-mark">◐</span>
          <span className="brand-name">
            The Facilitator Matrix · Game {LEVEL.gameNumber} of {LEVEL.totalGames} · L{LEVEL.id}
          </span>
        </div>

        <div className="dashboard-main">
          <div className="dashboard-score-block">
            <span className="dashboard-score-label">Your score</span>
            <span className="dashboard-score-value" style={{ color: scoreColor }}>
              {fmtScore(results.total)}
              <span className="dashboard-score-sep"> / </span>
              {LEVEL.threshold}
            </span>
          </div>
          <div className="comp-bars">
            {COMP_ORDER.map((c) => (
              <CompBar key={c} id={c} avg={results.avg[c]} />
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
        There's no single right answer here — every option trades a strength for a weakness,
        so pick the one you'd actually defend, not the one that sounds best. Pass gate: all four
        competencies at 3/4 or above. Clear it and the door to L{LEVEL.id + 1} — {LEVEL.nextLevelName} — opens.
        The real value is in comparing notes with the group afterward — argue it out.
      </p>

      <button className="btn-primary" onClick={onStart}>
        Begin Game {LEVEL.gameNumber} →
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

function QuestionScreen({ q, qIndex, total, onAnswer, animKey, selectedOption }) {
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

function ScorePopup({ feedback, onContinue, isLast }) {
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
          {COMP_ORDER.map((c) => {
            const data = dataByComp[c];
            const tested = data !== undefined;
            const positive = tested && data.score >= 3;
            return (
              <div className="popup-row" key={c}>
                <div className="popup-row-top">
                  <div className="popup-row-label">
                    <span>{COMPETENCIES[c].icon}</span>
                    <span>{COMPETENCIES[c].name}</span>
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

function ResultsScreen({ answers, onRestart }) {
  const results = useMemo(() => computeResults(answers), [answers]);
  const breakdown = useMemo(() => getCompetencyBreakdown(answers), [answers]);
  const [copied, setCopied] = useState(false);

  const strengths = COMP_ORDER.filter((c) => results.avg[c] !== null && results.avg[c] >= 3);
  const gaps = COMP_ORDER.filter((c) => results.avg[c] !== null && results.avg[c] < 3);

  const bestInstance = (c) => breakdown[c].reduce((a, b) => (b.score > a.score ? b : a), breakdown[c][0]);
  const worstInstance = (c) => breakdown[c].reduce((a, b) => (b.score < a.score ? b : a), breakdown[c][0]);

  const copySummary = () => {
    const lines = [
      `The Facilitator Matrix — Game ${LEVEL.gameNumber} (L${LEVEL.id} ${LEVEL.name})`,
      results.cleared
        ? `Result: GATE CLEARED — ready for L${LEVEL.id + 1} readiness track`
        : `Result: Not yet cleared`,
      `Total: ${fmtScore(results.total)} / ${LEVEL.threshold} needed`,
      "",
      ...COMP_ORDER.map((c) => `${COMPETENCIES[c].name}: ${results.avg[c] !== null ? fmtScore(results.avg[c]) : "—"} / 4`),
      "",
      strengths.length
        ? `Strong on: ${strengths.map((c) => COMPETENCIES[c].name).join(", ")}`
        : "No competency cleared the pass line this run.",
      gaps.length
        ? `Gaps remaining: ${gaps.map((c) => COMPETENCIES[c].name).join(", ")}`
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
      <span className="eyebrow">your gate reading · L{LEVEL.id}</span>
      <h1 className="results-verdict" style={{ color: results.cleared ? "var(--moss)" : "var(--paper)" }}>
        {results.cleared ? "Gate Cleared" : "Gate Not Yet Cleared"}
      </h1>
      <p className="results-tagline">
        {results.cleared
          ? results.strongSignal
            ? `Strong signal — well clear of the L${LEVEL.id} bar. Ready to start Game 2 (L1).`
            : `Cleared the L${LEVEL.id} bar. Ready to start Game 2 (L1) when it's built.`
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
                    <strong>{COMPETENCIES[c].name}</strong> ({fmtScore(results.avg[c])}/4)
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
                    <strong>{COMPETENCIES[c].name}</strong> ({fmtScore(results.avg[c])}/4)
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
   APP
   ============================================================ */

export default function FacilitatorMatrixGameL0() {
  const [screen, setScreen] = useState("intro");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
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
    if (qIndex + 1 < QUESTIONS.length) {
      setQIndex(qIndex + 1);
      setAnimKey((k) => k + 1);
    } else {
      setScreen("results");
    }
  };

  const restart = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
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
        <Dashboard answers={answers} qIndex={screen === "results" ? QUESTIONS.length : qIndex} total={QUESTIONS.length} />
      )}

      {screen === "intro" && <IntroScreen onStart={() => setScreen("quiz")} />}

      {screen === "quiz" && (
        <QuestionScreen
          q={QUESTIONS[qIndex]}
          qIndex={qIndex}
          total={QUESTIONS.length}
          onAnswer={handleAnswer}
          animKey={animKey}
          selectedOption={selectedOption}
        />
      )}

      {screen === "quiz" && selectedOption !== null && (
        <ScorePopup
          feedback={{
            comps: QUESTIONS[qIndex].comps,
            scores: QUESTIONS[qIndex].options[selectedOption].scores,
            why: QUESTIONS[qIndex].options[selectedOption].why,
          }}
          onContinue={handleContinue}
          isLast={qIndex + 1 >= QUESTIONS.length}
        />
      )}

      {screen === "results" && <ResultsScreen answers={answers} onRestart={restart} />}
    </div>
  );
}
