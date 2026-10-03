// brain/memory/index.ts — single barrel for memory.
export { MemoryManager, InMemoryVectorProvider, type MemoryProvider } from "./MemoryManager";
export * from "./embeddings";
export { extractLessons, summarizeSession, toPreview, type Lesson, type SessionOutcome, type CompactIndexEntry, type ObservationKind } from "./learning/index";
