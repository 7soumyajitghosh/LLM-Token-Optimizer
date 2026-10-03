# LLM-Token-Optimizer

Practical techniques and small, dependency-free utilities for reducing LLM
token usage without hurting output quality: prompt trimming, smart chunking,
budgeting, and cost estimation.

Built around one root: `brain/` — token helpers plus a unified AI Brain
(coding, animation, reasoning, memory, agents, tools, model routing) that
shares token budgets, context handling, and config.

License: [Apache-2.0](LICENSE).

## Why bother optimizing tokens?

- **Cost:** most providers bill per input/output token, so shorter prompts
  and completions directly lower the bill.
- **Latency:** fewer tokens usually mean faster responses.
- **Context limits:** a leaner prompt leaves more room for conversation
  history, retrieved documents, and the model's answer.

## Quickstart: trim a prompt in 5 minutes

1. **State the task first.** Put the instruction before the background
   material so the model knows what matters.
2. **Delete restated context.** If the same fact appears twice, keep one copy.
3. **Prefer concise formatting.** Short sentences, bullet lists, and tables
   over long paragraphs.
4. **Set the output shape.** Ask for the exact format you need
   (e.g. "reply with a 5-item bullet list") to avoid over-long answers.
5. **Measure.** Compare token counts and result quality before/after using
   `estimateTokens` or your provider's usage dashboard.

### Mini example

Before (wordy):

> "I was wondering if you could possibly help me by writing a summary of
> the following article for me. The summary should ideally be quite short,
> maybe just a few bullet points, and it would be great if it captured the
> main ideas of the article..."

After (lean):

> "Summarize the article below in 5 bullets, capturing only the main ideas:"

Same intent, a fraction of the tokens.

## Install & verify

Prerequisites: Node 18+, `pnpm` (repo has `pnpm-lock.yaml`).

```bash
pnpm install
pnpm run typecheck   # tsc --noEmit
pnpm run lint        # eslint
pnpm test            # vitest run (tests live in brain/**/*.test.ts)
pnpm run build       # tsc emit to dist/
```

## Code helpers (dependency-free)

Token estimation is deliberately cheap and deterministic
(~1 token per 4 characters). No external tokenizer dependency.

```ts
import { estimateTokens, truncateToTokens } from "./brain/context/tokenizer";
import { chunkText, chunkTextBySentences } from "./brain/context/chunk-prompt";
import { TokenManager } from "./brain/token";

const n = estimateTokens("Summarize the article below in 5 bullets:");
const short = truncateToTokens(longDoc, 2000);

// Overlapping fixed-size windows for long inputs
for (const chunk of chunkText(longDoc, 2000, 100)) {
  // summarize or filter each chunk, then combine
}

// Sentence-aware chunking for more coherent windows
const chunks = chunkTextBySentences(longDoc, 2000, 50);

// Track token + cost budgets per task
const tm = new TokenManager(32000, 0.5);
const cost = tm.estimateCost(inputTokens, outputTokens, 0.0025, 0.01);
if (tm.canAfford(inputTokens, outputTokens, cost)) {
  tm.record(inputTokens, outputTokens, cost);
}
```

Related modules:

- `brain/context/tokenizer.ts` — `estimateTokens`, `truncateToTokens`
- `brain/context/chunk-prompt.ts` — `chunkText`, `chunkTextBySentences`
- `brain/context/trim-prompt.ts` — prompt-trimming variant of the same helpers
- `brain/token/` — `TokenManager` (token + USD budgets, `estimateCost`,
  `canAfford`, `record`, `remainingTokens`)
- `brain/config/defaults.ts` — `loadConfig()` (`BRAIN_TOKEN_BUDGET`,
  `BRAIN_COST_BUDGET_USD`, `BRAIN_MAX_TOKENS_PER_CALL`, ...)

## Token-saving techniques

| Technique | When it helps | Notes |
|---|---|---|
| Trim redundancy | Every prompt | Cheapest win; re-read before sending. |
| Specify output format/length | Chatty answers | Caps completion tokens directly. |
| Chunk long inputs | Large documents | Summarize or filter each chunk, then combine. |
| Cache reusable context | Repeated prefixes | Use provider prompt-caching where offered. |
| Retrieve, don't paste | Knowledge questions | Send only the top relevant passages (RAG). |
| Drop low-signal history | Long chats | Keep the task + latest turns, summarize the rest. |
| Enforce budgets | Every task | `TokenManager` + `BRAIN_TOKEN_BUDGET` / `BRAIN_COST_BUDGET_USD`. |

## The unified `brain/`

Token helpers are one part of a larger single-root Brain. See
[`brain/README.md`](brain/README.md) and
[`brain/ARCHITECTURE.md`](brain/ARCHITECTURE.md) for the full picture.

```ts
import { UnifiedBrain, getOrchestrator } from "./brain/index";

const brain = new UnifiedBrain();
await brain.run({ goal: "Explain model routing" });
brain.analyzeAnimation("<div>...</div>");
```

Layout (highlights):

- `core/` — `Brain`, `UnifiedBrain`, orchestrator, loops, task/cognitive state, ids
- `context/` — tokenizer, trim/chunk helpers
- `token/` — `TokenManager` budgets
- `coding/`, `codebase/`, `debugging/`, `testing/`, `review/` — human-like coding pipeline
- `animation/`, `perception/` — animation understanding / reconstruction
- `cognition/`, `planner/`, `reasoning/`, `rag/` — planning, TDD, systematic debug
- `memory/`, `models/`, `agents/`, `tools/` — shared services (no duplicates)
- `security/`, `performance/`, `observability/`, `schemas/`, `config/`, `loops/`

Config via env (see `loadConfig` in `brain/config/defaults.ts`):

- `BRAIN_TOKEN_BUDGET`, `BRAIN_COST_BUDGET_USD`, `BRAIN_MAX_TOKENS_PER_CALL`
- `BRAIN_DEFAULT_PROVIDER`, `BRAIN_MAX_STEPS`, `BRAIN_REQUEST_TIMEOUT_MS`
- `BRAIN_ENABLE_SECURITY`, `BRAIN_ENABLE_EVAL`, `BRAIN_LOG_LEVEL`

## Project structure

```text
brain/             # all intelligence: token helpers + unified Brain
brain/__tests__/   # vitest suites (brain, coding-brain, unified-brain, ...)
LICENSE            # Apache-2.0
package.json       # scripts: typecheck / lint / test / build
vitest.config.ts   # includes brain/**/*.test.ts
```

## Contributing

Issues and small, focused pull requests are welcome. Please:

- Keep changes small and explain the token/quality trade-off.
- Include a before/after example when changing guidance.
- Add/extend tests under `brain/__tests__/` for helper changes.
- Do not commit API keys or private data.

## License

Apache-2.0 — see [LICENSE](LICENSE).

Copyright 2026 Soumyajit Ghosh.
