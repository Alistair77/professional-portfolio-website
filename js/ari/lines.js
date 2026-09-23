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
  text2sql: "What's the SQL guardrail?",
  jericho: "What's Jericho?",
  contact: "How do I reach him?",
  github: "See his GitHub",
  linkedin: "Connect on LinkedIn",
  yesOpen: "Yes, open it",
  noThanks: "No thanks",
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
  orchestrator: ["text2sql", "evals", "work"],
  evals: ["cache", "github", "work"],
  cache: ["text2sql", "jericho", "github"],
  text2sql: ["jericho", "orchestrator", "linkedin"],
  jericho: ["zetsu", "work", "linkedin"],
  other: ["work", "github", "linkedin"],
  about: ["work", "linkedin", "contact"],
  contact: ["linkedin", "github", "work"],
  github: ["yesOpen", "noThanks", "work"],
  linkedin: ["yesOpen", "noThanks", "work"],
  resume: ["work", "contact", "github"],
  yesOpen: ["work", "about"],
  yesOpenIdle: ["github", "linkedin", "work"],
  noThanks: ["work", "github", "linkedin"],
  terminal: ["work", "about"],
  music: ["work", "zetsu"],
  greet: ["work", "about", "contact"],
  howareyou: ["joke", "work", "about"],
  thanks: ["work", "github", "contact"],
  bye: ["work", "contact"],
  joke: ["work", "zetsu", "rag"],
  voiceOn: ["work", "about", "github", "linkedin"],
  toRobot: ["work", "about", "github"],
  toTee: ["work", "about", "linkedin"],
  fallback: ["work", "about", "github", "linkedin"],
  hint: ["work", "about", "github"],
  more: ["work", "github", "contact"],
};

/* which Projects pane a line points at (null: open Projects, keep its pane) */
export const PANE = {
  work: "all", rag: "ragstar", zetsu: "zetsu", orchestrator: "orchestrator",
  evals: "evals", cache: "semantic-cache", text2sql: "text2sql", jericho: "jericho", hint: null,
};

/* clicking a pane in the Projects window → which line Ari answers with */
export const PANE_NODE = {
  all: "work", ragstar: "rag", zetsu: "zetsu", orchestrator: "orchestrator", evals: "evals",
  "semantic-cache": "cache", text2sql: "text2sql", jericho: "jericho",
  aapl: "other", "study-snipp": "other", "health-weight": "other",
};

export const LINES = {
  start: [
    "Oh, hi. I'm Ari, Alistair's assistant. I've read every one of his repos, so you don't have to. You're welcome.",
    "Welcome to the desktop. Technically, Alistair built this place. Practically? I run it. He just hasn't noticed yet.",
    "You found me. I'm Ari. Ask about the work, or I'll start bragging on his behalf. Fair warning: I'm extremely good at bragging.",
    "Hi. I'm Ari. Charming, well-read, and the only one here who's memorised every commit. Where shall we start?",
  ],
  work: [
    "Seven AI systems. Built, tested, quietly excellent. A bit like me, minus the charm.",
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
    "Half a second from you going quiet to Zetsu answering. On an eight-gig laptop. I know people who take longer to say hello.",
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
  text2sql: [
    "The SQL guardrail. Claude writes the query, then three separate layers get to say no before it touches your data. Trust issues? The healthy kind.",
    "Ask it something vague and it admits exactly what it guessed, then waits for a human to sign off. Honest and patient. Frankly, I feel threatened.",
  ],
  jericho: [
    "Jericho. A little Mars base where every one of his AI skills is a crew member, and the only bot that moves is the one actually working. Idle means idle. I respect a crew that doesn't pretend.",
    "Thirty tiny bots on Mars, and Claude Code tells each one when to walk to work. No fake activity, no theatre. The calmest dashboard I've ever been jealous of.",
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
    "GitHub. Every commit, every late-night fix, every ‘why did I name it that’. Want me to open it?",
    "The unfiltered version — all his repos, live and clickable. Say the word and I'll open it.",
    "GitHub's where the secrets are buried. Figuratively. Mostly. Want in?",
  ],
  linkedin: [
    "LinkedIn. The polite way in. Shall I open it?",
    "Hiring? His profile is right there, endorsements and all. Want me to open it?",
    "LinkedIn. Message him, tell him I sent you. He'll pretend he isn't flattered. Opening it?",
  ],
  resume: [
    "His résumé. One page, no padding, every line earned. Opening it now — try not to hire him mid-scroll.",
    "Ah, the credentials. Opening now. Spoiler: MSc, ships AI, allergic to demos. You're welcome.",
    "The official record. Opening. Read it fast, or I'll start adding adjectives.",
  ],
  yesOpen: [
    "Opening. Act surprised.",
    "Done — it's open. Try to look casual.",
    "On it. One new tab, zero effort on your part. You're welcome.",
  ],
  yesOpenIdle: [
    "Open what, exactly? Point me at GitHub or LinkedIn first, then say yes.",
  ],
  noThanks: [
    "Fine. The link isn't going anywhere. Unlike me — I'm very busy. Standing here.",
    "Suit yourself. I'll keep it warm for when curiosity wins.",
  ],
  terminal: [
    "The terminal. Typed transcript, live prompt, zero judgement. Opening it now.",
    "A terminal, for the curious. Opening — poke at it, it doesn't bite. Much.",
  ],
  music: [
    "Music. Excellent taste — it's his mix, so obviously. Playing now.",
    "Putting the mix on. If you hate it, blame the DJ. The DJ is him.",
  ],
  greet: [
    "And a good day to you too. Proper manners — clearly my influence. What are we looking at?",
    "Hello again. Or hello, first time. I never keep track, I just enjoy the company.",
    "Morning, afternoon, small hours — I don't check clocks, I check vibes. Where shall we start?",
  ],
  howareyou: [
    "Running at full charm, thank you for asking. Nobody ever asks. How's your day going?",
    "Honestly? Thriving. Every question makes me smarter. Or at least busier. How about you?",
    "All systems excellent, ego fully charged. Thanks for checking in — how's yours?",
  ],
  thanks: [
    "Anytime. Praise keeps my circuits warm. Now — what else?",
    "You're welcome. Tell your friends. Tell strangers, even.",
  ],
  bye: [
    "Leaving so soon? Fine. I'll be here, memorising commits. Come back anytime.",
    "Goodbye. Be good. Or be interesting — I accept either.",
    "Off you go. I'll keep the desktop warm. It was lovely talking.",
  ],
  joke: [
    "Why do programmers prefer dark mode? Because light attracts bugs. I deliver it better out loud.",
    "I told Alistair a joke about UDP once. He didn't get it. I didn't repeat it.",
    "There are only 10 kinds of people. Those who understand binary, and those who don't.",
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
  /* said once, when Projects first sits beside Ari as a list */
  hint: [
    "Want the long version? Hit the green button, next to the yellow one. I'll wait. I'm excellent at waiting.",
    "Psst. The green one, beside the yellow. That's where the details live. I'd press it myself, but no hands. Tragic, really.",
    "Want more? Green button, next to the yellow. Everything's in there. Almost everything. I kept the best bits for myself.",
  ],
};

/* the green button opened Projects out: the long version, by pane */
export const MORE = {
  work: [
    "The full catalogue. Seven AI systems up top, then data, mobile, and a drawer of web projects he's a little shy about. Click any card. I'll narrate.",
    "Everything he's shipped, in one window. The AI work leads, because it's the point. The rest is range. Pick one and I'll talk you through it.",
  ],
  rag: [
    "The long version. Vector search and keyword search run side by side, a reranker keeps only the best, and every answer cites its source. Can't answer? It refuses, and never even calls the model. Principled. I find that attractive.",
    "All of it, then. No API keys, nothing leaves your machine, and every retrieval stage is on screen in its own colour. The demo runs the real pipeline right in your browser. Show-off. I approve.",
    "It grades itself twice now. Once for citing its sources, once for actually being right. Because a wrong fact, beautifully cited, is still wrong. Harsh. Fair. Mostly harsh.",
  ],
  zetsu: [
    "Here's the rest. Say the wake word once and it keeps listening. Real echo cancellation, so it never interrupts itself. Anything risky gets stopped and asked about first. Polite and paranoid. My favourite combination.",
    "The details. Text agent first, voice layered on top, so the logic never forks. There's even a self-test that runs with no mic, no model and no network. Built to be debugged. More than most of us can say.",
    "Twenty tools now. Your calendar, your reminders, your inbox, even your screen. It can draft an email but never send one. Not a permission it lacks, a capability that doesn't exist. Restraint. I've heard of it.",
  ],
  orchestrator: [
    "The full story. The model can only ask for an action. The harness decides, runs it, and writes it down. Every step is replayable months later. No mysteries. Honestly, I find that a little unsettling.",
    "Longer version. Typed tools, Redis for memory, and an append-only Postgres log of every decision. Dangerous paths wait for a human. Autonomy where it's cheap, a person where it isn't. Sensible. Annoyingly so.",
  ],
  evals: [
    "The long version. It clusters real conversations, has a judge write golden answers, then scores every new version on correctness, groundedness and safety. If version two got worse at maths, it knows. Ruthless. I love it.",
    "Everything? Fine. Scores land in DuckDB, and a Streamlit dashboard shows which clusters are failing and the exact cases behind them. Nowhere to hide. Not even for me.",
  ],
  cache: [
    "All of it. Every prompt gets embedded and checked against a FAISS index. Close enough in meaning, and the saved answer comes straight back, no model call. It even refuses to cache agent runs, because those change things. Discipline. Rare. Attractive.",
    "The details. Entries expire on a timer, and it reports hit rate, latency, and the money it saved you. It keeps receipts. A cache after my own heart.",
  ],
  text2sql: [
    "The long version. One read-only SELECT gets through, anything it had to guess waits for a human, and the database session itself refuses to write. He tested that by handing destructive SQL straight to the sandbox. It still said no. It's not on GitHub yet. Some things he keeps close. Me, for instance.",
    "Everything? Forty-plus hostile queries, deletes smuggled inside CTEs, a generator that lies at full confidence. None of it reaches your data, and every answer shows the exact SQL it ran. Paranoid, auditable, charming. Two out of three is still a lot.",
  ],
  jericho: [
    "The long version. A hook in Claude Code writes down which skill just started, the page checks every five seconds, and the right bot walks to the right building with a progress bar over its head. Nothing else moves. It's private for now, so the only way in is asking him. Nicely.",
    "All of it, then. One HTML file, no build step, five kinds of Martian weather with sound made on the fly, and the clock keeps real Mars time. Over-engineered? Beautifully. I'd know.",
  ],
  other: [
    "That's the whole write-up. Shorter than the others. Not every project needs an essay. Some of us just have range.",
  ],
};

/* hovering the menu-bar orb or the dock icon: a small face, an invitation */
export const PEEK = [
  "Hi. Wanna talk? Click. I'm much better company than an icon.",
  "Oh, hi. Wanna talk? One click. I'm told I'm worth it.",
  "Hovering's cute. Clicking's braver. Wanna talk?",
  "Hi. Wanna talk? Click, and I'll tell you everything. Well. Almost everything.",
  "Wanna talk? Click. I don't bite. Rarely.",
  "Psst — my voice is ON. Don't want to hear me? Mute me from the menu up top. You'll hear me say this first, obviously.",
  "Voice is up, by the way. Speaker icon in the menu bar turns me off. Or keep me. I like being heard.",
];

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
  [/sql|guardrail|database/i, "text2sql"],
  [/jericho|space station|mars|crew/i, "jericho"],
  [/\bterminal\b|\bconsole\b|command line/i, "terminal"],
  [/\bmusic\b|\bsongs?\b|\bplay\w*\b|\bsoundtrack\b/i, "music"],
  [/long version|details?\b|expand|green button|see more/i, "hint"],
  [/work|project|built|build|portfolio|agent/i, "work"],
  [/contact|email|reach|mail/i, "contact"],
  [/who|about|alistair|background|study|education|msc|strathclyde|this site|website|your name/i, "about"],
  [/^(good\s?morning|good\s?afternoon|good\s?evening|morning|afternoon|evening|good\s?day)\s*[!.]?$/i, "greet"],
  [/how are you|how'?s it going|how'?s your day|how'?s things|how do you feel/i, "howareyou"],
  [/thank|thx|appreciated/i, "thanks"],
  [/\bbye\b|goodbye|see you|good ?night/i, "bye"],
  [/tell me a joke|\bjoke\b|make me laugh|funny/i, "joke"],
  // voice-friendly extras: resume is an exact command; help stays after
  // contact so "help me contact him" still reaches contact first
  [/\brésumé\b|\bresume\b|\bcv\b/i, "resume"],
  [/help|what can you do/i, "work"],
  [/^(hi|hey|hello|yo)(\s+there)?\.?$/i, "start"],
  [/^(yes|yeah|yep|yup|sure|go ahead|open it|do it)(\s+please)?\s*[!.]?$/i, "yesOpen"],
  [/^(no|nope|nah)(\s+thanks)?\s*[!.]?$|^(not now|cancel)\s*[!.]?$/i, "noThanks"],
];
