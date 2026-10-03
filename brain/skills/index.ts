// brain/skills/index.ts — skills-first workflow registry.
// Inspired by affaan-m/ECC (293 skills) and obra/superpowers (composable skills):
// named, trigger-matched workflows composed from brain modules, loaded on demand.
// Original implementation: tiny registry with built-in skills over the new modules.
export interface SkillContext {
  goal: string;
  filesChanged?: string[];
  code?: string;
  language?: string;
}

export interface SkillStep {
  title: string;
  detail: string;
}

export interface Skill {
  name: string;
  description: string;
  /** Matched against the goal (case-insensitive substring or /regex/). */
  triggers: string[];
  steps: (ctx: SkillContext) => SkillStep[];
}

function matches(goal: string, triggers: string[]): boolean {
  const g = goal.toLowerCase();
  return triggers.some((t) => {
    if (t.startsWith("/") && t.endsWith("/")) {
      try {
        return new RegExp(t.slice(1, -1), "i").test(goal);
      } catch {
        return false;
      }
    }
    return g.includes(t.toLowerCase());
  });
}

const BUILT_INS: Skill[] = [
  {
    name: "tdd-cycle",
    description: "RED-GREEN-REFACTOR: failing test first, minimal code, then refactor.",
    triggers: ["tdd", "test-driven", "implement", "feature", "add tests"],
    steps: (ctx) => [
      { title: "RED", detail: `Write one failing test for: ${ctx.goal}. No production code yet.` },
      { title: "GREEN", detail: "Write the minimal code to pass. Nothing more." },
      { title: "REFACTOR", detail: "Simplify; tests must stay green after each step." },
    ],
  },
  {
    name: "systematic-debug",
    description: "4-phase debugging: reproduce → isolate → fix → verify with evidence gates.",
    triggers: ["debug", "bug", "fix", "broken", "error", "failing"],
    steps: (ctx) => [
      { title: "REPRODUCE", detail: `Reproduce deterministically: ${ctx.goal}. Record steps + failing output.` },
      { title: "ISOLATE", detail: "Bisect to the single responsible unit. Do not fix yet." },
      { title: "FIX", detail: "Smallest fix for the isolated cause." },
      { title: "VERIFY", detail: "Re-run the repro + regression checks before declaring fixed." },
    ],
  },
  {
    name: "simplicity-review",
    description: "YAGNI ladder review: stop at the first rung that holds; emit a delete-list.",
    triggers: ["review", "simplif", "over-engineer", "yagni", "ponytail", "minimal"],
    steps: (ctx) => [
      { title: "LADDER", detail: `Walk skip → reuse → stdlib → native → installed dep → one-liner → minimum for: ${ctx.goal}.` },
      { title: "NEVER-CUT", detail: "Keep validation, security, accessibility, error handling regardless of rung." },
      { title: "DELETE-LIST", detail: ctx.filesChanged?.length ? `Audit ${ctx.filesChanged.length} changed files for removals.` : "Audit the diff for removals." },
    ],
  },
  {
    name: "owasp-review",
    description: "OWASP Top 10 security review with CVSS-like severity ranking.",
    triggers: ["secur", "owasp", "pentest", "vulnerab", "audit", "auth"],
    steps: (ctx) => [
      { title: "PATTERN-SCAN", detail: "Run the dangerous-pattern scan for instant findings." },
      { title: "CLASSIFY", detail: "Map each finding to an OWASP category." },
      { title: "RANK", detail: "Score by exploitability × impact × exposure; fix critical/high first." },
    ],
  },
  {
    name: "session-learning",
    description: "Distill the session into lessons + summary for future sessions.",
    triggers: ["learn", "remember", "summar", "session", "retrospect"],
    steps: () => [
      { title: "EXTRACT", detail: "Promote fallbacks, revisions, and tool failures into lessons." },
      { title: "SUMMARIZE", detail: "Write the session summary for future context." },
      { title: "STORE", detail: "Persist lessons to memory with kind tags (decision/bugfix/security_alert)." },
    ],
  },
  {
    name: "spec-first",
    description: "Socratic spec refinement before any code (brainstorming gate).",
    triggers: ["brainstorm", "spec", "design", "plan", "before coding"],
    steps: (ctx) => [
      { title: "CLARIFY", detail: `Ask what ${ctx.goal} really needs; explore alternatives.` },
      { title: "DESIGN-DOC", detail: "Present the design in short sections for validation." },
      { title: "GATE", detail: "No implementation until the design is signed off." },
    ],
  },
];

export class SkillRegistry {
  private skills = new Map<string, Skill>();

  constructor(extra: Skill[] = []) {
    for (const s of [...BUILT_INS, ...extra]) this.skills.set(s.name, s);
  }

  register(skill: Skill): void {
    this.skills.set(skill.name, skill);
  }

  list(): Skill[] {
    return [...this.skills.values()];
  }

  names(): string[] {
    return [...this.skills.keys()];
  }

  /** Suggest skills whose triggers match the goal (ordered by match strength). */
  suggest(goal: string): Skill[] {
    return this.list().filter((s) => matches(goal, s.triggers));
  }

  run(name: string, ctx: SkillContext): SkillStep[] {
    const skill = this.skills.get(name);
    if (!skill) throw new Error(`Unknown skill: ${name}`);
    return skill.steps(ctx);
  }
}
