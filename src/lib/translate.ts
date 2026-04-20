import { generateText, Output } from 'ai';
import * as Sentry from '@sentry/cloudflare';
import { AsyncCaller } from '@grapelaw/async-caller';

export const MAX_OUTPUT_TOKENS = 8192;
const DEFAULT_CONTEXT_WINDOW_TOKENS = 128_000; // gpt-4o-mini default via Cloudflare AI Gateway
const BUFFER_FACTOR = 0.8; // leave headroom for token estimation + model variance
const CHARS_PER_TOKEN = 2; // conservative estimate for multilingual content
const RESERVED_PROMPT_TOKENS = 2_000; // system prompt + "Translate this JSON..." wrapper + formatting

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function resolveMaxBatchChars(options?: BreakdownOptions): number {
  const contextWindow = clampInt(
    options?.contextWindowTokens ?? DEFAULT_CONTEXT_WINDOW_TOKENS,
    4096,
    2_000_000
  );
  const maxOutputTokens = clampInt(
    options?.maxOutputTokens ?? MAX_OUTPUT_TOKENS,
    256,
    contextWindow
  );
  const reservedPromptTokens = clampInt(
    options?.reservedPromptTokens ?? RESERVED_PROMPT_TOKENS,
    0,
    contextWindow
  );

  // Total context window must cover: system+prompt+input JSON + output JSON.
  // We treat input JSON as the primary variable and leave a buffer.
  const availableForInputTokens = Math.max(
    256,
    contextWindow - maxOutputTokens - reservedPromptTokens
  );
  const bufferedInputTokens = Math.floor(
    availableForInputTokens * (options?.bufferFactor ?? BUFFER_FACTOR)
  );
  const charsPerToken = options?.charsPerToken ?? CHARS_PER_TOKEN;

  return Math.max(1024, Math.floor(bufferedInputTokens * charsPerToken));
}

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

export interface BreakdownOptions {
  contextWindowTokens?: number;
  maxOutputTokens?: number;
  reservedPromptTokens?: number;
  bufferFactor?: number;
  charsPerToken?: number;
}

export function breakdown(
  obj: Record<string, any>,
  options?: BreakdownOptions
): Array<Record<string, any>> {
  const leaves = flattenLeaves(obj);
  if (leaves.length === 0) return [obj];

  const maxBatchChars = resolveMaxBatchChars(options);
  const batches: Array<Record<string, any>> = [];
  let bucket: Leaf[] = [];
  let chars = 0;

  for (const leaf of leaves) {
    const cost = leafCost(leaf);
    if (chars + cost > maxBatchChars && bucket.length > 0) {
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
  targetLanguage: string,
  onProgress?: (completed: number, total: number) => void
): Promise<Array<Record<string, any>>> {
  try {
    const caller = new AsyncCaller({
      concurrency: 10,
      retryOptions: {
        backoffFactor: 1.1,
        maxDelayInMs: 10000,
        maxRetries: 10,
        minDelayInMs: 1000,
      },
    });
    let completed = 0;
    const results = await Promise.all(
      batches.map(async (batch) => {
        const { text } = await caller.call(async () =>
          generateText({
            model,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            system: systemPrompt,
            prompt: `Translate this JSON to ${targetLanguage}:\n${JSON.stringify(batch, null, 2)}`,
            output: Output.json(),
          })
        );
        const result = JSON.parse(text);
        completed++;
        onProgress?.(completed, batches.length);
        return result;
      })
    );
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
