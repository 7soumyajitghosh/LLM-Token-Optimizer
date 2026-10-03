// brain/review/bundling/index.ts — deterministic review planning.
// Inspired by alibaba/open-code-review (deterministic pipeline x agent hybrid):
// precise file selection, smart bundling into review units, per-file rule matching.
// Original implementation: pure functions, no LLM calls.
export interface FileBundle {
  id: string;
  paths: string[];
  kind: "source" | "test" | "i18n" | "config" | "docs" | "skip";
  rules: string[];
  reason: string;
}

const SKIP = /(^|\/)(node_modules|dist|build|coverage|\.git|\.next|vendor)(\/|$)|(\.min\.js|\.min\.css|\.lock|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;
const TEST = /(\.test\.|\.spec\.|__tests__)/;
const I18N = /(messages?_|locale|i18n).*(_en|_zh|\.en|\.zh)?\.(properties|json)$/i;
const CONFIG = /(\.json|\.ya?ml|\.toml|\.ini|\.config\.[jt]s|Dockerfile|Makefile)$/;
const DOCS = /(\.md|\.mdx|\.txt)$/;

function kindOf(path: string): FileBundle["kind"] {
  if (SKIP.test(path)) return "skip";
  if (TEST.test(path)) return "test";
  if (I18N.test(path)) return "i18n";
  if (CONFIG.test(path)) return "config";
  if (DOCS.test(path)) return "docs";
  return "source";
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function stem(path: string): string {
  return basename(path).replace(/\.(test|spec)\.[^.]+$/, "").replace(/\.[^.]+$/, "");
}

function dirOf(path: string): string {
  const i = path.lastIndexOf("/");
  return i < 0 ? "." : path.slice(0, i);
}

/** Rule ids matched to a file's characteristics (stable, template-like matching). */
export function matchReviewRules(path: string): string[] {
  if (SKIP.test(path)) return [];
  const rules = ["general-quality"];
  if (/\.(ts|tsx|js|jsx|vue)$/.test(path)) rules.push("xss", "error-handling");
  if (/auth|login|session|password|token/i.test(path)) rules.push("access-control", "auth-failures");
  if (/\.(sql|prisma)$/.test(path) || /migrat/i.test(path)) rules.push("sql-injection", "data-integrity");
  if (/api|route|controller|handler/i.test(path)) rules.push("input-validation", "rate-limit", "ssrf");
  if (/\.(py|rb|php)$/.test(path)) rules.push("injection", "deserialization");
  if (/(upload|file)/i.test(path)) rules.push("path-traversal", "file-validation");
  if (/crypt|secret|key/i.test(path)) rules.push("crypto-failures", "secret-management");
  if (TEST.test(path)) rules.push("test-quality");
  if (/(Dockerfile|docker-compose|\.tf$)/.test(path)) rules.push("misconfiguration");
  return [...new Set(rules)];
}

/**
 * Group changed files into review units (divide-and-conquer):
 * i18n pairs bundle together, tests bundle with their source, same-dir sources bundle.
 */
export function bundleFiles(paths: string[]): FileBundle[] {
  const unique = [...new Set(paths)];
  const bundles: FileBundle[] = [];
  let n = 0;
  // First pass: attach test files to their source so sources are not double-bundled.
  const attachedSources = new Set<string>();
  for (const t of unique) {
    if (kindOf(t) !== "test") continue;
    const src = unique.find((p) => p !== t && kindOf(p) === "source" && stem(p) === stem(t));
    if (src) {
      attachedSources.add(src);
      bundles.push({ id: `bundle_${n++}`, paths: [src, t], kind: "source", rules: ["general-quality", "test-quality", "test-coverage"], reason: "Tests bundled with their source files" });
    }
  }
  const attachedTests = new Set(bundles.flatMap((b) => b.paths));
  const byDir = new Map<string, string[]>();
  for (const p of unique) {
    if (attachedTests.has(p)) continue;
    const k = `${dirOf(p)}::${kindOf(p)}`;
    const arr = byDir.get(k) ?? [];
    arr.push(p);
    byDir.set(k, arr);
  }
  for (const [key, group] of byDir) {
    const [dir, kind] = key.split("::") as [string, FileBundle["kind"]];
    if (kind === "skip") {
      bundles.push({ id: `bundle_${n++}`, paths: group, kind, rules: [], reason: `Skipped generated/vendor paths in ${dir}` });
      continue;
    }
    if (kind === "test") {
      // Standalone tests whose source did not change.
      bundles.push({ id: `bundle_${n++}`, paths: group, kind: "test", rules: ["test-quality"], reason: `Standalone tests in ${dir}` });
      continue;
    }
    const rules = [...new Set(group.flatMap(matchReviewRules))];
    const reason =
      kind === "i18n" ? `i18n pair/set reviewed as one unit in ${dir}`
      : `${kind} files in ${dir} reviewed as one unit`;
    bundles.push({ id: `bundle_${n++}`, paths: group, kind, rules, reason });
  }
  return bundles.sort((a, b) => a.id.localeCompare(b.id));
}
