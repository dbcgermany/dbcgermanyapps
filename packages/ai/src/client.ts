import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
let _cachedKey: string | null = null;

/**
 * Resolve the Anthropic API key. Priority:
 *   1. `process.env.ANTHROPIC_API_KEY` (traditional Vercel/env config)
 *   2. A resolver function provided by the host app — typically one that
 *      reads `app_secrets.ANTHROPIC_API_KEY` from Supabase, so super admins
 *      can rotate the key from the admin dashboard without a redeploy.
 * If both fail, throws.
 */
export type KeyResolver = () => Promise<string | null>;

let _resolver: KeyResolver | null = null;

export function setKeyResolver(resolver: KeyResolver) {
  _resolver = resolver;
  // Reset cache so the next call picks up any new resolver.
  _client = null;
  _cachedKey = null;
}

export async function getClient(): Promise<Anthropic> {
  const envKey = process.env.ANTHROPIC_API_KEY;
  let apiKey = envKey;

  if (!apiKey && _resolver) {
    apiKey = (await _resolver()) ?? undefined;
  }

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set (not in env and no DB secret found). " +
        "Set it in the admin Settings page or the Vercel env."
    );
  }

  if (_client && _cachedKey === apiKey) return _client;

  _cachedKey = apiKey;
  _client = new Anthropic({ apiKey });
  return _client;
}

export interface CompleteOptions {
  model?: "claude-opus-4-6" | "claude-sonnet-4-6" | "claude-haiku-4-5-20251001";
  system: string;
  userPrompt: string;
  maxTokens?: number;
  // System text that rarely changes — will be prompt-cached for 5 min
  cachedSystem?: string;
}

/**
 * Thin wrapper around Messages API with prompt caching enabled by default.
 * Cached-system blocks are marked `cache_control: ephemeral` so rarely-changing
 * prompt material (rubrics, product docs, style guides) gets cached and
 * subsequent calls skip re-tokenizing them.
 */
export async function complete(opts: CompleteOptions): Promise<string> {
  const client = await getClient();
  const model = opts.model ?? "claude-sonnet-4-6";

  const systemBlocks: Array<{
    type: "text";
    text: string;
    cache_control?: { type: "ephemeral" };
  }> = [];

  if (opts.cachedSystem) {
    systemBlocks.push({
      type: "text",
      text: opts.cachedSystem,
      cache_control: { type: "ephemeral" },
    });
  }
  systemBlocks.push({ type: "text", text: opts.system });

  const resp = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system: systemBlocks,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return text;
}
