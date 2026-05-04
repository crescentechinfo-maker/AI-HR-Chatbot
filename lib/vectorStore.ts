import { v4 as uuidv4 } from 'uuid';
import type { DocumentChunk, VectorStoreData, SearchResult } from '@/types';
import { storageGet, storageSet } from './storage';

const KV_KEY = 'vectors';

// ── Tokenisation ────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

// ── BM25 scoring ─────────────────────────────────────────────────────────────
// k1=1.5, b=0.75 are standard Okapi BM25 parameters

function computeIDF(chunks: DocumentChunk[]): Record<string, number> {
  const N = chunks.length;
  const df: Record<string, number> = {};
  for (const chunk of chunks) {
    new Set(chunk.tokens).forEach((t) => {
      df[t] = (df[t] || 0) + 1;
    });
  }
  const idf: Record<string, number> = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((N - freq + 0.5) / (freq + 0.5) + 1);
  }
  return idf;
}

function bm25(
  queryTokens: string[],
  chunk: DocumentChunk,
  idf: Record<string, number>,
  avgLen: number,
  k1 = 1.5,
  b = 0.75
): number {
  const len = chunk.tokens.length;
  let score = 0;
  for (const term of queryTokens) {
    if (!idf[term]) continue;
    const tf = chunk.tokens.filter((t) => t === term).length;
    const num = tf * (k1 + 1);
    const den = tf + k1 * (1 - b + b * (len / avgLen));
    score += idf[term] * (num / den);
  }
  return score;
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function load(): Promise<VectorStoreData> {
  const data = await storageGet<VectorStoreData>(KV_KEY);
  return data ?? { chunks: [], avgChunkLength: 0 };
}

async function save(store: VectorStoreData): Promise<void> {
  await storageSet(KV_KEY, store);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function addDocumentChunks(texts: string[], source: string): Promise<void> {
  const store = await load();
  const newChunks: DocumentChunk[] = texts.map((text, idx) => ({
    id: uuidv4(),
    text,
    source,
    chunkIndex: idx,
    tokens: tokenize(text),
  }));
  store.chunks = [...store.chunks, ...newChunks];
  const total = store.chunks.reduce((s, c) => s + c.tokens.length, 0);
  store.avgChunkLength = store.chunks.length ? total / store.chunks.length : 0;
  await save(store);
}

export async function searchSimilar(query: string, topK = 5): Promise<SearchResult[]> {
  const store = await load();
  if (!store.chunks.length) return [];
  const qTokens = tokenize(query);
  const idf = computeIDF(store.chunks);
  return store.chunks
    .map((chunk) => ({
      chunk,
      score: bm25(qTokens, chunk, idf, store.avgChunkLength),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function clearVectorStore(): Promise<void> {
  await save({ chunks: [], avgChunkLength: 0 });
}

export async function getChunkCount(): Promise<number> {
  return (await load()).chunks.length;
}

export async function getDocumentSources(): Promise<string[]> {
  return Array.from(new Set((await load()).chunks.map((c) => c.source)));
}

export async function removeDocumentBySource(source: string): Promise<void> {
  const store = await load();
  store.chunks = store.chunks.filter((c) => c.source !== source);
  const total = store.chunks.reduce((s, c) => s + c.tokens.length, 0);
  store.avgChunkLength = store.chunks.length ? total / store.chunks.length : 0;
  await save(store);
}
