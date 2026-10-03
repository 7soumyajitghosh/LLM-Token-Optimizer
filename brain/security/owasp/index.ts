// brain/security/owasp/index.ts — OWASP classification + CVSS-like severity scoring.
// Inspired by usestrix/strix (OWASP Top 10 coverage, CVSS scoring, validated findings).
// Original implementation: category catalog, keyword classifier, 0-10 scorer.
export interface OwaspCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export const OWASP_TOP_10: OwaspCategory[] = [
  { id: "A01", name: "Broken Access Control", description: "Missing or bypassable authorization checks.", examples: ["IDOR", "privilege escalation", "auth bypass", "missing authorization"] },
  { id: "A02", name: "Cryptographic Failures", description: "Weak or missing crypto protecting sensitive data.", examples: ["plaintext secret", "weak hash", "missing TLS", "hardcoded key"] },
  { id: "A03", name: "Injection", description: "Untrusted input interpreted as code or query.", examples: ["SQL injection", "command injection", "XSS", "SSTI", "LDAP injection"] },
  { id: "A04", name: "Insecure Design", description: "Missing security controls by design.", examples: ["no rate limit", "business logic flaw", "unenforced workflow"] },
  { id: "A05", name: "Security Misconfiguration", description: "Unsafe defaults, verbose errors, open CORS.", examples: ["wildcard CORS", "debug enabled", "default credentials"] },
  { id: "A06", name: "Vulnerable Components", description: "Known-CVE dependencies.", examples: ["outdated dependency", "CVE", "unpatched library"] },
  { id: "A07", name: "Auth Failures", description: "Broken authentication or session management.", examples: ["JWT none", "session fixation", "credential stuffing", "weak password policy"] },
  { id: "A08", name: "Data/Software Integrity Failures", description: "Unverified updates, unsafe deserialization.", examples: ["pickle", "unsigned update", "insecure pipeline"] },
  { id: "A09", name: "Logging/Monitoring Failures", description: "Breaches undetected for lack of telemetry.", examples: ["no audit log", "unmonitored admin action"] },
  { id: "A10", name: "SSRF", description: "Server fetches attacker-chosen URLs.", examples: ["user-controlled URL", "metadata endpoint", "allowlist missing"] },
];

export type SeverityRating = "none" | "low" | "medium" | "high" | "critical";

export interface ScoredFinding {
  title: string;
  categoryId: string;
  score: number;
  rating: SeverityRating;
  detail: string;
}

function ratingFor(score: number): SeverityRating {
  if (score <= 0) return "none";
  if (score < 4) return "low";
  if (score < 7) return "medium";
  if (score < 9) return "high";
  return "critical";
}

/**
 * Simplified CVSS-like score from 0..1 factors.
 * exploitability: how easily triggered; impact: confidentiality/integrity/availability loss;
 * exposure: how reachable (internet-facing = 1, local-only = 0.2).
 */
export function scoreSeverity(exploitability: number, impact: number, exposure = 0.7): { score: number; rating: SeverityRating } {
  const clamp = (n: number): number => Math.min(1, Math.max(0, n));
  const score = Math.round((0.5 * clamp(exploitability) + 0.35 * clamp(impact) + 0.15 * clamp(exposure)) * 100) / 10;
  return { score, rating: ratingFor(score) };
}

/** Keyword classifier mapping free-text findings to OWASP categories. */
export function classifyOwasp(text: string): OwaspCategory[] {
  const t = text.toLowerCase();
  return OWASP_TOP_10.filter((c) =>
    c.name.toLowerCase().split(/[^a-z]+/).some((w) => w.length > 3 && t.includes(w)) ||
    c.examples.some((e) => t.includes(e.toLowerCase())),
  );
}

/** Attach OWASP category + score to raw finding titles; sorted worst-first. */
export function rankFindings(
  titles: string[],
  rate: (title: string) => { exploitability: number; impact: number; exposure?: number } = () => ({ exploitability: 0.5, impact: 0.5 }),
): ScoredFinding[] {
  return titles
    .map((title) => {
      const cats = classifyOwasp(title);
      const { score, rating } = scoreSeverity(rate(title).exploitability, rate(title).impact, rate(title).exposure);
      return {
        title,
        categoryId: cats[0]?.id ?? "A04",
        score,
        rating,
        detail: cats[0] ? `${cats[0].id} ${cats[0].name}` : "Unclassified — triage as insecure design until proven otherwise",
      };
    })
    .sort((a, b) => b.score - a.score);
}
