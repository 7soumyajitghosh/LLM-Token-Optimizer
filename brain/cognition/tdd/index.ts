// brain/cognition/tdd/index.ts — RED-GREEN-REFACTOR enforcement.
// Inspired by obra/superpowers test-driven-development: true red/green TDD,
// delete code written before tests. Original implementation: phase state machine.
export type TddPhase = "red" | "green" | "refactor" | "done";

export interface TddEvent {
  at: number;
  phase: TddPhase;
  detail: string;
  violation?: string;
}

export interface TddAction {
  phase: TddPhase;
  instruction: string;
  blocked: string[];
}

/**
 * Enforces RED (failing test first) → GREEN (minimal code) → REFACTOR → done.
 * Code written before a failing test is recorded as a violation.
 */
export class TddCycle {
  private phase: TddPhase = "red";
  private sawFailingTest = false;
  private sawPassingTest = false;
  private events: TddEvent[] = [];

  constructor(readonly task: string) {
    this.log("red", `TDD started for: ${task}. Write a failing test first — no production code yet.`);
  }

  current(): TddPhase {
    return this.phase;
  }

  history(): TddEvent[] {
    return [...this.events];
  }

  /** Record a test run outcome while in red/green. */
  recordTestResult(passed: boolean, note = ""): void {
    if (this.phase === "red") {
      if (!passed) {
        this.sawFailingTest = true;
        this.log("red", `Failing test observed (RED). ${note}`.trim());
      } else {
        this.log("red", `Test passed before any failing test. ${note}`.trim(), "no-red-first: test passed without a preceding failure — write a test that fails first");
      }
    } else if (this.phase === "green") {
      if (passed && this.sawFailingTest) {
        this.sawPassingTest = true;
        this.log("green", `Test now passes (GREEN). ${note}`.trim());
      } else if (passed) {
        this.log("green", "Test passes but no RED was observed.", "no-red-first: cannot go green without a failing test");
      } else {
        this.log("green", `Still failing — keep the change minimal. ${note}`.trim());
      }
    } else {
      this.log(this.phase, `Test run during ${this.phase}: ${passed ? "pass" : "fail"}. ${note}`.trim());
    }
  }

  /** Record production code written; violations flagged when it precedes RED. */
  recordProductionCode(note = ""): void {
    if (this.phase === "red" && !this.sawFailingTest) {
      this.log("red", `Production code written before a failing test. ${note}`.trim(), "code-before-test: delete it and write the failing test first");
    } else {
      this.log(this.phase, `Production code recorded. ${note}`.trim());
    }
  }

  /** Attempt to advance; returns false with a reason when the gate is not met. */
  advance(): { ok: boolean; reason?: string } {
    if (this.phase === "red") {
      if (!this.sawFailingTest) return { ok: false, reason: "RED not observed: record a failing test first." };
      this.phase = "green";
      this.log("green", "Advance to GREEN: write the minimal code to pass.");
      return { ok: true };
    }
    if (this.phase === "green") {
      if (!this.sawPassingTest) return { ok: false, reason: "GREEN not observed: record a passing test run first." };
      this.phase = "refactor";
      this.log("refactor", "Advance to REFACTOR: simplify without changing behavior; tests stay green.");
      return { ok: true };
    }
    if (this.phase === "refactor") {
      this.phase = "done";
      this.log("done", "TDD cycle complete.");
      return { ok: true };
    }
    return { ok: false, reason: "Cycle already done." };
  }

  nextAction(): TddAction {
    if (this.phase === "red") {
      return { phase: "red", instruction: "Write ONE failing test that captures the next behavior. Run it and confirm it fails.", blocked: ["production code"] };
    }
    if (this.phase === "green") {
      return { phase: "green", instruction: "Write the MINIMAL production code to make the failing test pass. Nothing more.", blocked: ["refactoring", "new features"] };
    }
    if (this.phase === "refactor") {
      return { phase: "refactor", instruction: "Refactor for clarity/duplication removal. Re-run tests after each step; they must stay green.", blocked: ["behavior changes"] };
    }
    return { phase: "done", instruction: "Cycle complete. Commit.", blocked: [] };
  }

  violations(): string[] {
    return this.events.filter((e) => e.violation).map((e) => e.violation as string);
  }

  private log(phase: TddPhase, detail: string, violation?: string): void {
    this.events.push({ at: Date.now(), phase, detail, violation });
  }
}
