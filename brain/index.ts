// brain/index.ts — ONE unified AI Brain entry point.
// Animation Brain + Human-Like Coding Brain + Autonomous Loop + Memory +
// Reasoning + Agents + Tools + Model Router = ONE unified "brain/".
//
// Canonical deep paths (prefer these barrels over deep file imports):
//   core/    -> "./core"      (Brain, UnifiedBrain, orchestrator, loops, types, ids)
//   config/  -> "./config"    (loadConfig, defaultModels, tunables)
//   schemas/ -> "./schemas"   (domain type re-exports)
export * from "./core/types";
export { Brain, type BrainDeps } from "./core/brain/Brain";
export { UnifiedBrain, getUnifiedBrain, createUnifiedBrain } from "./core/brain";
export {
  BrainOrchestrator,
  getOrchestrator,
  routeCapability,
  type Capability,
  type OrchestratorResult,
} from "./core/orchestrator";
export { runBrainLoop, type LoopOptions } from "./core/brain-loop";
export * from "./core/task-state";
export * from "./core/cognitive-state";
export { uid } from "./core/ids";
export { CodingBrain } from "./coding/CodingBrain";
export { AnimationBrain } from "./animation/api/brain";
export { runAnimationLoop } from "./loops/animation-loop/loop";
export { runAutonomousLoop } from "./loops/autonomous-loop/loop";
export { runBuildLoop } from "./loops/build-loop/loop";
export { runTestLoop } from "./loops/test-loop/loop";
export { runDebugLoop } from "./loops/debug-loop/loop";
export { runImprovementLoop } from "./loops/improvement-loop/loop";
export { loadConfig, defaultModels, type BrainConfig } from "./config/defaults";
export {
  BRAIN_LIMITS,
  BRAIN_MODEL_DEFAULTS,
  BRAIN_MEMORY_TUNING,
  BRAIN_SECURITY_LIMITS,
  ANIMATION_TUNING,
} from "./config/constants";
export { getBrain, createBrain, runBrain } from "./api/index";
export { scanCodeForDangerousPatterns, isPatternClean, DANGEROUS_PATTERNS, type PatternFinding } from "./security/patterns/index";
export { OWASP_TOP_10, scoreSeverity, classifyOwasp, rankFindings, type ScoredFinding } from "./security/owasp/index";
export { bundleFiles, matchReviewRules, type FileBundle } from "./review/bundling/index";
export { SIMPLICITY_LADDER, NEVER_CUT, evaluateAgainstLadder, detectOverEngineering } from "./coding/simplicity/index";
export { TddCycle, type TddPhase } from "./cognition/tdd/index";
export { SystematicDebug, type DebugPhase } from "./debugging/systematic/index";
export { SkillRegistry, type Skill, type SkillStep } from "./skills/index";
