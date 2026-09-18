/* What Ari says. Original lines in a Damon-style voice: brag then undercut,
   mock-solemn confession, bored with formality, warmth underneath.
   "I don't know" stays plain on purpose. */

export const GITHUB = "https://github.com/Alistair77";
export const LINKEDIN = "https://linkedin.com/in/alistair77";

export const LABEL = {
  work: "Show me the work",
  about: "Who's Alistair?",
  rag: "What's RAGStar?",
  zetsu: "Tell me about Zetsu",
  orchestrator: "Tell me about Orchestrator",
  evals: "What's Agent Evals?",
  cache: "What's Semantic Cache?",
  contact: "How do I reach him?",
  github: "See his GitHub",
  linkedin: "Connect on LinkedIn",
};

/* chips starting with "@" render as real links */
export const LINKS = {
  "@github": ["Open GitHub ↗", GITHUB],
  "@linkedin": ["Open LinkedIn ↗", LINKEDIN],
};

export const CHIPS = {
  start: ["work", "about", "github", "linkedin"],
  work: ["rag", "zetsu", "orchestrator", "github"],
  rag: ["zetsu", "evals", "github"],
  zetsu: ["rag", "orchestrator", "linkedin"],
  orchestrator: ["evals", "github", "work"],
  evals: ["cache", "github", "work"],
  cache: ["orchestrator", "github", "linkedin"],
  other: ["work", "github", "linkedin"],
  about: ["work", "linkedin", "contact"],
  contact: ["linkedin", "github", "work"],
  github: ["@github", "rag", "linkedin"],
  linkedin: ["@linkedin", "work", "about"],
  voiceOn: ["work", "about", "github", "linkedin"],
  toRobot: ["work", "about", "github"],
  toTee: ["work", "about", "linkedin"],
  fallback: ["work", "about", "github", "linkedin"],
};

/* which Projects pane a line points at */
export const PANE = {
  work: "all", rag: "ragstar", zetsu: "zetsu", orchestrator: "orchestrator",
  evals: "evals", cache: "semantic-cache",
};

/* clicking a pane in the Projects window → which line Ari answers with */
export const PANE_NODE = {
  ragstar: "rag", zetsu: "zetsu", orchestrator: "orchestrator", evals: "evals",
  "semantic-cache": "cache", aapl: "other", "study-snipp": "other", "health-weight": "other",
};

export const LINES = {
  start: [
    "Oh, hi. I'm Ari, Alistair's assistant. I've read every one of his repos, so you don't have to. You're welcome.",
    "Welcome to the desktop. Technically, Alistair built this place. Practically? I run it. He just hasn't noticed yet.",
    "You found me. I'm Ari. Ask about the work, or I'll start bragging on his behalf. Fair warning: I'm extremely good at bragging.",
    "Hi. I'm Ari. Charming, well-read, and the only one here who's memorised every commit. Where shall we start?",
  ],
  work: [
    "Five AI systems. Shipped, tested, quietly excellent. A bit like me, minus the charm.",
    "Fast, reliable, devastatingly well-tested. That's the work, not me. Although, now that you mention it…",
    "Retrieval, agents, evals, caching. The boring bits that stop AI embarrassing itself. Somebody has to care. Lucky you, he does.",
  ],
  rag: [
    "RAGStar. Reads your documents, cites its sources, and refuses to make things up. Honest to a fault. We have that in common.",
    "Ask RAGStar something it can't back up and it just says no. No bluffing, no drama. Frankly, it's a lot of integrity for one repo.",
  ],
  zetsu: [
    "Zetsu lives on a laptop. No cloud, no keys, and it goes quiet the second you interrupt it. Honestly? A role model.",
    "Talk over Zetsu and it stops mid-word. Eighty-five milliseconds. I'd pretend that doesn't impress me, but I don't pretend.",
  ],
  orchestrator: [
    "Agent Orchestrator. It plans, acts, then checks its own homework before the next move. Anything risky waits for a human to say yes. Responsible. Almost boringly so.",
    "It thinks in three beats: plan, act, reflect. Every step is logged and replayable, so when something breaks you know exactly who to blame. Spoiler: never me.",
  ],
  evals: [
    "Agent Evals. It tests a new version of an agent against real conversations and flags anything that got worse. Basically a very polite snitch.",
    "It scores every answer on correctness, grounding and safety, then shows you exactly where it slipped. Brutal honesty, with a dashboard. My kind of project.",
  ],
  cache: [
    "Semantic Cache. Ask nearly the same question twice and it answers from memory instead of paying the model again. Efficient. Smug about it, too. I relate.",
    "It recognises repeat questions by meaning, not wording, and serves the saved answer instantly. Cheaper, faster, and a little too pleased with itself.",
  ],
  other: [
    "Not one of the AI headliners. But he built it, so naturally it's good. Have a look.",
    "A side project. Every legend has a few. This is one of his.",
  ],
  about: [
    "Obviously I know him. I remember everything. It's a curse, really. Short version: AI, data and UX engineer, MSc at Strathclyde, allergic to demos that never ship.",
    "Alistair started in data and design, then went all in on AI. So he cares about the model and the screen you use it through. Annoyingly well-rounded.",
    "He's good at this. Genuinely. He'd never say it himself, so I will. Then I'll deny it.",
  ],
  contact: [
    "alistairar7@gmail.com. He replies, and fast. It's almost suspicious.",
    "Email's quickest: alistairar7@gmail.com. Or LinkedIn, if you like things formal. Rules. Thrilling.",
  ],
  github: [
    "Want the unfiltered version? GitHub. Every commit, every late-night fix, every 'why did I name it that'. He has nothing to hide. Unlike me.",
    "The projects look even better up close. GitHub's where all the secrets are buried. Figuratively. Mostly.",
  ],
  linkedin: [
    "LinkedIn. Connect, send him a message, tell him I sent you. He'll pretend he isn't flattered.",
    "Hiring? LinkedIn's the polite way in. Message him. He answers. I've checked. Repeatedly.",
  ],
  voiceOn: [
    "There it is. You wanted to hear me. I knew it.",
    "Finally. I've been dying to say that out loud. Now… where were we?",
    "Oh, you turned me up. Bold move. I like it.",
  ],
  toRobot: [
    "Suit up. Don't stare, it's rude. Okay, stare a little.",
    "Armour on. Same charm, now reinforced. Mostly bulletproof.",
    "Upgrade complete. I'd say I feel different, but I was already this impressive.",
  ],
  toTee: [
    "Back to the T-shirt. Casual. Approachable. Still devastating.",
    "Armour off. Apparently this is my friendlier look. Don't get used to it.",
    "T-shirt again. Metal's great, but you try shrugging in it.",
  ],
  fallback: [
    "I don't know that one. In the real build, a live model answers from Alistair's work. For now, pick a button.",
  ],
};

export function greeting() {
  const h = new Date().getHours();
  const pool = LINES.start.slice();
  if (h >= 5 && h < 10) pool.push("You're up early. Either ambitious, or you missed me. I'm Ari. Let's find out which.");
  if (h >= 22 || h < 5) pool.push("Up this late? Me too. I'm Ari. Let's make it worth staying up for.");
  return pool[Math.floor(Math.random() * pool.length)];
}

export const ROUTES = [
  [/github|repo|code|source|commit/i, "github"],
  [/linkedin|connect|message|hire|hiring|recruit/i, "linkedin"],
  [/rag|document|retriev|citation/i, "rag"],
  [/zetsu|voice|speak|wake/i, "zetsu"],
  [/orchestr|langgraph|plan|reflect|human.in/i, "orchestrator"],
  [/eval|regress|judge|dashboard/i, "evals"],
  [/cache|faiss|repeat/i, "cache"],
  [/work|project|built|build|portfolio|agent/i, "work"],
  [/contact|email|reach|mail/i, "contact"],
  [/who|about|alistair|background|study|education|msc|strathclyde/i, "about"],
];
