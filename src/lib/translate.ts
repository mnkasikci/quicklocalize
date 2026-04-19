import { generateText, Output } from 'ai';
import * as Sentry from '@sentry/cloudflare';

// llama-3.3-70b-instruct-fp8-fast: 24k context window, no fixed output cap.
// We claim 8192 tokens for output, leaving ~16k for input prompt.
export const MAX_OUTPUT_TOKENS = 4096;
const BUFFER_FACTOR = 0.8;   // 20% buffer
const CHARS_PER_TOKEN = 2;   // conservative estimate for multilingual content
export const MAX_BATCH_CHARS = Math.floor(MAX_OUTPUT_TOKENS * BUFFER_FACTOR * CHARS_PER_TOKEN); // ~13100

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface Leaf {
  path: string[];
  value: string;
}

function flattenLeaves(obj: Record<string, any>, path: string[] = []): Leaf[] {
  const leaves: Leaf[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      leaves.push({ path: [...path, key], value });
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      leaves.push(...flattenLeaves(value, [...path, key]));
    }
  }
  return leaves;
}

function setAtPath(obj: Record<string, any>, path: string[], value: string): void {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i] as string;
    if (!cur[k]) cur[k] = {};
    cur = cur[k];
  }
  cur[path[path.length - 1] as string] = value;
}

function fromLeaves(leaves: Leaf[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const leaf of leaves) setAtPath(result, leaf.path, leaf.value);
  return result;
}

// Rough char cost of one leaf entry as it will appear in JSON
function leafCost(leaf: Leaf): number {
  const key = leaf.path[leaf.path.length - 1]!;
  return key.length + leaf.value.length + 10; // quotes + colon + comma + newline overhead
}

function deepMerge(a: Record<string, any>, b: Record<string, any>): Record<string, any> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Step A — Breakdown
// ---------------------------------------------------------------------------

export function breakdown(obj: Record<string, any>): Array<Record<string, any>> {
  const leaves = flattenLeaves(obj);
  if (leaves.length === 0) return [obj];

  const batches: Array<Record<string, any>> = [];
  let bucket: Leaf[] = [];
  let chars = 0;

  for (const leaf of leaves) {
    const cost = leafCost(leaf);
    if (chars + cost > MAX_BATCH_CHARS && bucket.length > 0) {
      batches.push(fromLeaves(bucket));
      bucket = [];
      chars = 0;
    }
    bucket.push(leaf);
    chars += cost;
  }
  if (bucket.length > 0) batches.push(fromLeaves(bucket));

  return batches;
}

// ---------------------------------------------------------------------------
// Step B — Run (parallel, inside the CF edge worker)
// ---------------------------------------------------------------------------

export async function runBatches(
  batches: Array<Record<string, any>>,
  model: Parameters<typeof generateText>[0]['model'],
  systemPrompt: string,
  targetLanguage: string
): Promise<Array<Record<string, any>>> {
  try {
    const results = Array<Record<string, any>>();
    for (const batch of batches) {
      const { text } = await generateText({
        model,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        system: systemPrompt,
        prompt: `Translate this JSON to ${targetLanguage}:\n${JSON.stringify(batch, null, 2)}`,
        output: Output.json(),
      });
      results.push(JSON.parse(text));
    }
    return results;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Step C — Combine
// ---------------------------------------------------------------------------

export function combine(results: Array<Record<string, any>>): Record<string, any> {
  return results.reduce<Record<string, any>>((acc, cur) => deepMerge(acc, cur), {});
}
