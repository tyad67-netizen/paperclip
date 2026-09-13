function readEnv(env: NodeJS.ProcessEnv, key: string): string | null {
  const value = env[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function inferOpenAiCompatibleBiller(
  env: NodeJS.ProcessEnv,
  fallback: string | null = "openai",
): string | null {
  const explicitOpenRouterKey = readEnv(env, "OPENROUTER_API_KEY");
  if (explicitOpenRouterKey) return "openrouter";

  const baseUrl =
    readEnv(env, "OPENAI_BASE_URL") ??
    readEnv(env, "OPENAI_API_BASE") ??
    readEnv(env, "OPENAI_API_BASE_URL");
  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname.toLowerCase() === "openrouter.ai") {
        return "openrouter";
      }
    } catch {
      // Malformed URLs use the configured fallback.
    }
  }

  return fallback;
}
