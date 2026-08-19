// ==============================================================================
// AL IMRAN TENSES LEARNER — SECURE SERVER-SIDE GEMINI API KEY POOL MANAGER
// Dynamic Key Pool, Atomic Failover, Quota/Rate-limit Cooldown, and Masked Logs
// Keys are NEVER exposed to client-side bundles, network responses, or public logs.
// ==============================================================================

export interface KeyPoolItem {
  id: string; // e.g. "KEY_01", "KEY_02" (masked identifier)
  key: string; // Secret key value (server-only)
  status: 'available' | 'cooldown' | 'exhausted' | 'invalid';
  lastUsed: number;
  cooldownUntil: number;
  successCount: number;
  errorCount: number;
  lastError: string | null;
  lastErrorStatus?: number;
}

export interface KeyPoolStatusSummary {
  totalKeys: number;
  availableKeys: number;
  cooldownKeys: number;
  exhaustedKeys: number;
  invalidKeys: number;
  keys: Array<{
    id: string;
    status: 'available' | 'cooldown' | 'exhausted' | 'invalid';
    lastUsed: string | null;
    cooldownRemainingSeconds: number;
    successCount: number;
    errorCount: number;
    lastError: string | null;
  }>;
}

export interface GeminiApiRequestPayload {
  contents: any[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
  systemInstruction?: any;
}

class GeminiKeyPoolManager {
  private pool: KeyPoolItem[] = [];
  private initialized: boolean = false;
  private defaultModel: string = 'gemini-2.5-flash';
  private fallbackModel: string = 'gemini-1.5-flash';

  // Cooldown durations in milliseconds
  private readonly DEFAULT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes for quota/rate limit
  private readonly EXHAUSTED_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour for daily quota exhaustion

  constructor() {
    this.refreshPool();
  }

  /**
   * Initializes and dynamically populates the key pool from environment variables.
   * Scans:
   * 1. GEMINI_KEY_1, GEMINI_KEY_2, ... GEMINI_KEY_N
   * 2. GEMINI_API_KEYS (comma or newline separated list)
   * 3. GEMINI_API_KEY (single fallback)
   */
  public refreshPool(): void {
    const discoveredKeys: string[] = [];

    // 1. Scan numbered keys: GEMINI_KEY_1 ... GEMINI_KEY_100
    for (let i = 1; i <= 100; i++) {
      const k = process.env[`GEMINI_KEY_${i}`];
      if (k && k.trim() && !discoveredKeys.includes(k.trim())) {
        discoveredKeys.push(k.trim());
      }
    }

    // 2. Scan GEMINI_API_KEYS list
    const listEnv = process.env.GEMINI_API_KEYS;
    if (listEnv && listEnv.trim()) {
      const parts = listEnv.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
      for (const k of parts) {
        if (!discoveredKeys.includes(k)) {
          discoveredKeys.push(k);
        }
      }
    }

    // 3. Scan single GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY (server-side only)
    const singleEnv = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY;
    if (singleEnv && singleEnv.trim() && !discoveredKeys.includes(singleEnv.trim())) {
      discoveredKeys.push(singleEnv.trim());
    }

    // Retain existing state for existing keys, add new ones
    const newPool: KeyPoolItem[] = [];
    discoveredKeys.forEach((keyVal, idx) => {
      const id = `KEY_${String(idx + 1).padStart(2, '0')}`;
      const existing = this.pool.find((p) => p.key === keyVal);

      if (existing) {
        newPool.push({
          ...existing,
          id, // update ID index
        });
      } else {
        newPool.push({
          id,
          key: keyVal,
          status: 'available',
          lastUsed: 0,
          cooldownUntil: 0,
          successCount: 0,
          errorCount: 0,
          lastError: null,
        });
      }
    });

    this.pool = newPool;
    this.initialized = true;

    console.log(`[GeminiKeyPool] Initialized pool with ${this.pool.length} managed key(s).`);
  }

  /**
   * Evaluates key pool status and auto-recovers keys whose cooldown period has elapsed.
   */
  private updateCooldowns(): void {
    const now = Date.now();
    for (const item of this.pool) {
      if ((item.status === 'cooldown' || item.status === 'exhausted') && item.cooldownUntil <= now) {
        item.status = 'available';
        item.cooldownUntil = 0;
        console.log(`[GeminiKeyPool] ${item.id} cooldown expired. Key returned to available pool.`);
      }
    }
  }

  /**
   * Retrieves all candidate keys eligible for making a request, sorted by least recently used.
   */
  private getAvailableKeys(): KeyPoolItem[] {
    this.updateCooldowns();
    return this.pool
      .filter((k) => k.status === 'available')
      .sort((a, b) => a.lastUsed - b.lastUsed);
  }

  /**
   * Helper to determine whether an error string or status indicates a quota or rate-limit issue.
   */
  private isQuotaOrRateLimitError(status: number, message: string): boolean {
    if (status === 429) return true;
    const lower = (message || '').toLowerCase();
    return (
      lower.includes('quota') ||
      lower.includes('rate limit') ||
      lower.includes('resource_exhausted') ||
      lower.includes('resource exhausted') ||
      lower.includes('too many requests') ||
      lower.includes('daily limit') ||
      lower.includes('tokens per minute') ||
      lower.includes('requests per minute') ||
      lower.includes('tpm') ||
      lower.includes('rpm')
    );
  }

  /**
   * Helper to determine whether an error indicates an invalid, deleted, or unauthorized key.
   */
  private isInvalidKeyError(status: number, message: string): boolean {
    if (status === 400 || status === 401 || status === 403) {
      const lower = (message || '').toLowerCase();
      return (
        lower.includes('api_key_invalid') ||
        lower.includes('api key not valid') ||
        lower.includes('invalid api key') ||
        lower.includes('permission_denied') ||
        lower.includes('key expired') ||
        lower.includes('unregistered')
      );
    }
    return false;
  }

  /**
   * Executes a Gemini API request with automatic failover across the managed key pool.
   * If all pool keys fail or are unavailable, tests the optional customApiKey passed by the user.
   */
  public async executeGeminiRequest(
    payload: GeminiApiRequestPayload,
    options?: {
      model?: string;
      customApiKey?: string | null;
      feature?: 'CHAT' | 'NOTES_DETECT' | 'NOTES_SOLVE';
      timeoutMs?: number;
    }
  ): Promise<{ text: string; rawResponse?: any }> {
    if (!this.initialized || this.pool.length === 0) {
      this.refreshPool();
    }

    const feature = options?.feature || 'CHAT';
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const modelToUse = options?.model || this.defaultModel;

    const availableKeys = this.getAvailableKeys();
    const triedKeyIds: string[] = [];

    // 1. Iterate through pool keys
    for (const keyItem of availableKeys) {
      if (triedKeyIds.includes(keyItem.id)) continue;
      triedKeyIds.push(keyItem.id);

      keyItem.lastUsed = Date.now();
      console.log(
        `[GeminiKeyPool] [${requestId}] [${feature}] Attempting with ${keyItem.id} (status: ${keyItem.status})...`
      );

      try {
        const result = await this.callGeminiEndpoint(keyItem.key, modelToUse, payload, options?.timeoutMs);

        // Success!
        keyItem.successCount += 1;
        keyItem.lastError = null;
        console.log(`[GeminiKeyPool] [${requestId}] [${feature}] Success using ${keyItem.id}`);
        return result;
      } catch (err: any) {
        const status = err.status || 500;
        const msg = err.message || 'Unknown Gemini API error';

        keyItem.errorCount += 1;
        keyItem.lastError = msg;
        keyItem.lastErrorStatus = status;

        if (this.isQuotaOrRateLimitError(status, msg)) {
          // Quota / Rate limit error -> Mark for cooldown
          const cooldownMs = msg.toLowerCase().includes('daily')
            ? this.EXHAUSTED_COOLDOWN_MS
            : this.DEFAULT_COOLDOWN_MS;

          keyItem.status = 'cooldown';
          keyItem.cooldownUntil = Date.now() + cooldownMs;
          console.warn(
            `[GeminiKeyPool] [${requestId}] [${feature}] ${keyItem.id} QUOTA/RATE-LIMIT (HTTP ${status}). Set cooldown for ${Math.round(cooldownMs / 1000)}s. Failing over to next key...`
          );
        } else if (this.isInvalidKeyError(status, msg)) {
          // Permanent invalid error -> Mark invalid
          keyItem.status = 'invalid';
          console.error(
            `[GeminiKeyPool] [${requestId}] [${feature}] ${keyItem.id} INVALID KEY (HTTP ${status}). Key disabled. Failing over to next key...`
          );
        } else {
          // Generic error / model error -> temporary 1 min cooldown
          keyItem.status = 'cooldown';
          keyItem.cooldownUntil = Date.now() + 60 * 1000;
          console.warn(
            `[GeminiKeyPool] [${requestId}] [${feature}] ${keyItem.id} ERROR (HTTP ${status}: ${msg}). Failing over to next key...`
          );
        }
      }
    }

    // 2. If pool keys are exhausted, try user's custom personal key if provided
    if (options?.customApiKey && options.customApiKey.trim().length > 10) {
      const cleanCustomKey = options.customApiKey.trim();
      console.log(`[GeminiKeyPool] [${requestId}] [${feature}] Pool unavailable, falling back to user's personal key.`);

      try {
        const result = await this.callGeminiEndpoint(cleanCustomKey, modelToUse, payload, options?.timeoutMs);
        return result;
      } catch (err: any) {
        console.error(`[GeminiKeyPool] [${requestId}] User personal key failed: ${err.message}`);
        throw new Error(`Personal Gemini API Key failed: ${err.message}`);
      }
    }

    // 3. Pool completely exhausted and no custom key provided
    console.warn(`[GeminiKeyPool] [${requestId}] [${feature}] ALL POOL KEYS UNAVAILABLE / EXHAUSTED.`);
    const exhaustionError: any = new Error(
      'AI service is temporarily busy. Please connect your own Gemini API key to continue.'
    );
    exhaustionError.code = 'AI_POOL_EXHAUSTED';
    exhaustionError.status = 503;
    throw exhaustionError;
  }

  /**
   * Internal direct HTTP fetch to Google Generative Language API with model fallback.
   */
  private async callGeminiEndpoint(
    apiKey: string,
    modelName: string,
    payload: GeminiApiRequestPayload,
    timeoutMs: number = 45000
  ): Promise<{ text: string; rawResponse?: any }> {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const primaryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

      let response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Try fallback model (e.g. 1.5-flash) if 2.5-flash is temporarily unavailable (503/404)
      if (!response.ok && (response.status === 404 || response.status === 503)) {
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.fallbackModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        response = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.error?.message ||
          `Gemini request failed with HTTP ${response.status} (${response.statusText})`;
        const apiError: any = new Error(errorMessage);
        apiError.status = response.status;
        apiError.details = errorData;
        throw apiError;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text && !data?.candidates?.[0]?.finishReason) {
        const emptyError: any = new Error('AI returned an empty response.');
        emptyError.status = 500;
        throw emptyError;
      }

      return {
        text: text || '',
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeoutTimer);
    }
  }

  /**
   * Returns a sanitized summary of the Key Pool for administrative inspection.
   * NEVER returns actual secret key strings.
   */
  public getStatusSummary(): KeyPoolStatusSummary {
    this.updateCooldowns();
    const now = Date.now();

    let availableCount = 0;
    let cooldownCount = 0;
    let exhaustedCount = 0;
    let invalidCount = 0;

    const keySummaries = this.pool.map((item) => {
      if (item.status === 'available') availableCount++;
      else if (item.status === 'cooldown') cooldownCount++;
      else if (item.status === 'exhausted') exhaustedCount++;
      else if (item.status === 'invalid') invalidCount++;

      const cooldownRemaining =
        item.cooldownUntil > now ? Math.round((item.cooldownUntil - now) / 1000) : 0;

      return {
        id: item.id,
        status: item.status,
        lastUsed: item.lastUsed ? new Date(item.lastUsed).toLocaleTimeString() : null,
        cooldownRemainingSeconds: cooldownRemaining,
        successCount: item.successCount,
        errorCount: item.errorCount,
        lastError: item.lastError,
      };
    });

    return {
      totalKeys: this.pool.length,
      availableKeys: availableCount,
      cooldownKeys: cooldownCount,
      exhaustedKeys: exhaustedCount,
      invalidKeys: invalidCount,
      keys: keySummaries,
    };
  }
}

// Global Singleton Instance (Preserves in-memory cooldown state across Next.js server invocations)
const globalForGemini = globalThis as unknown as {
  geminiKeyPoolInstance?: GeminiKeyPoolManager;
};

export const geminiKeyPool =
  globalForGemini.geminiKeyPoolInstance || new GeminiKeyPoolManager();

if (process.env.NODE_ENV !== 'production') {
  globalForGemini.geminiKeyPoolInstance = geminiKeyPool;
}
