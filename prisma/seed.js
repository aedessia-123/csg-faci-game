// Migrates the original hardcoded Game 1 (L0 Pre-Facilitator) content into the DB.
// Run with: node prisma/seed.js
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const COMPETENCIES = [
  {
    key: "execution_discipline",
    name: "Execution Discipline",
    icon: "🎯",
    definition: "Completes tasks without supervision. Delivers on time. Sustains focus.",
  },
  {
    key: "cognitive_ownership",
    name: "Cognitive Ownership",
    icon: "🧠",
    definition: "Thinks through problems before asking. Fills gaps independently. Does not stall.",
  },
  {
    key: "task_integrity",
    name: "Task Integrity",
    icon: "📋",
    definition: "Produces usable output. Does not create rework for others.",
  },
  {
    key: "stability",
    name: "Stability",
    icon: "⚓",
    definition: "Continues despite ambiguity. Maintains momentum when disrupted.",
  },
];

const LEVEL = {
  key: "L0",
  name: "Pre-Facilitator",
  tagline: "You're in the room. No script, no training — just you.",
  intro:
    "No formal training or coaching is provided at this level. You're dropped straight into small-group moments with no prep and no script — readiness is judged by how you handle the room, not by how you prepared for it. This game puts you through eight live in-session scenarios that mirror what actually happens (or falls apart) while facilitating a small group.",
  threshold: 12,
  nextLevelName: "Small Group Facilitator",
};

const RED_FLAG_LIBRARY = [
  "Fails to complete tasks without follow-up",
  "Misses deadlines or produces inconsistent output",
  "Requires repeated instructions / supervision",
  "Escalates problems without attempting solutions",
  "Stalls when faced with ambiguity or missing information",
  "Produces work that creates rework for others",
];

const SCENARIOS = [
  {
    title: "The Runaway Talker",
    prompt:
      "Ten minutes into a small-group discussion, one participant has been talking for a while, circling the same point. A couple of others have gone quiet and started checking their phones. You still have three items left on the agenda.",
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
    prompt: "You ask the group an open question meant to deepen the discussion. Nobody answers. The silence stretches past ten seconds.",
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
    prompt: "Two participants start disagreeing sharply, their tone rising. The rest of the small group goes quiet and starts watching you.",
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
    prompt:
      "Mid-activity, a participant unexpectedly shares something personal and emotionally heavy that has nothing to do with the session's topic. The room goes still.",
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
    prompt:
      "You're 20 minutes from the end of a 90-minute session and still have two activities left. The group is engaged, but there's no way to finish both as planned.",
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
    prompt:
      "You give the small group instructions for a paired activity. Partway through, you notice two participants are clearly doing something different from what you intended, but they haven't asked for help.",
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
    prompt: "Halfway through a session, the projector cuts out and your slides are gone. The small group is looking at you, waiting.",
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
    prompt:
      "About an hour in, the small group's energy has visibly dropped — shorter answers, less eye contact, a couple of side conversations. Your plan doesn't call for a break yet.",
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

async function main() {
  console.log("Seeding competencies...");
  const competencyByKey = {};
  for (const c of COMPETENCIES) {
    const row = await prisma.competency.upsert({
      where: { key: c.key },
      update: { name: c.name, icon: c.icon, definition: c.definition },
      create: c,
    });
    competencyByKey[c.key] = row;
  }

  console.log("Seeding level L0...");
  const level = await prisma.level.upsert({
    where: { key: LEVEL.key },
    update: LEVEL,
    create: LEVEL,
  });

  console.log("Seeding scenarios...");
  const scenarioIds = [];
  for (const s of SCENARIOS) {
    const [compAKey, compBKey] = s.comps;
    const scenario = await prisma.scenario.create({
      data: {
        title: s.title,
        prompt: s.prompt,
        status: "PUBLISHED",
        occasion: "general",
        difficulty: "medium",
        competencyAId: competencyByKey[compAKey].id,
        competencyBId: competencyByKey[compBKey].id,
        options: {
          create: s.options.map((opt, i) => ({
            text: opt.text,
            order: i,
            scoreA: opt.scores[0],
            whyA: opt.why[0],
            scoreB: opt.scores[1],
            whyB: opt.why[1],
            isRedFlag: opt.redFlag !== undefined,
            redFlagNote: opt.redFlag !== undefined ? RED_FLAG_LIBRARY[opt.redFlag] : null,
          })),
        },
      },
    });
    scenarioIds.push(scenario.id);
  }

  console.log("Seeding game-1-l0...");
  const existingGame = await prisma.game.findUnique({ where: { slug: "game-1-l0" } });
  if (existingGame) {
    await prisma.gameScenario.deleteMany({ where: { gameId: existingGame.id } });
    await prisma.game.delete({ where: { id: existingGame.id } });
  }
  await prisma.game.create({
    data: {
      slug: "game-1-l0",
      name: "Game 1 — Pre-Facilitator",
      levelId: level.id,
      occasion: "general",
      status: "PUBLISHED",
      scenarios: {
        create: scenarioIds.map((scenarioId, i) => ({ scenarioId, order: i })),
      },
    },
  });

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
