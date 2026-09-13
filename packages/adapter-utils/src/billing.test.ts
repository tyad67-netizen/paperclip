import { describe, expect, it } from "vitest";
import { inferOpenAiCompatibleBiller } from "./billing.js";

describe("inferOpenAiCompatibleBiller", () => {
  it("returns openrouter when OPENROUTER_API_KEY is present", () => {
    expect(
      inferOpenAiCompatibleBiller({ OPENROUTER_API_KEY: "sk-or-123" } as NodeJS.ProcessEnv, "openai"),
    ).toBe("openrouter");
  });

  it("returns openrouter when OPENAI_BASE_URL points at OpenRouter", () => {
    expect(
      inferOpenAiCompatibleBiller(
        { OPENAI_BASE_URL: "https://openrouter.ai/api/v1" } as NodeJS.ProcessEnv,
        "openai",
      ),
    ).toBe("openrouter");
  });

  it("returns fallback when no OpenRouter markers are present", () => {
    expect(
      inferOpenAiCompatibleBiller(
        { OPENAI_BASE_URL: "https://api.openai.com/v1" } as NodeJS.ProcessEnv,
        "openai",
      ),
    ).toBe("openai");
  });

  it("does not attribute lookalike hosts, subdomains, or URL text to OpenRouter", () => {
    for (const baseUrl of [
      "https://openrouter.ai.example.com/v1",
      "https://api.openrouter.ai/v1",
      "https://example.com/openrouter.ai/v1",
      "https://example.com/?upstream=openrouter.ai",
    ]) {
      expect(
        inferOpenAiCompatibleBiller({ OPENAI_BASE_URL: baseUrl } as NodeJS.ProcessEnv, "custom"),
      ).toBe("custom");
    }
  });

  it("recognizes the exact OpenRouter hostname through each base URL alias", () => {
    for (const alias of ["OPENAI_BASE_URL", "OPENAI_API_BASE", "OPENAI_API_BASE_URL"]) {
      expect(
        inferOpenAiCompatibleBiller(
          { [alias]: "  HTTPS://OPENROUTER.AI/api/v1  " } as NodeJS.ProcessEnv,
          "openai",
        ),
      ).toBe("openrouter");
    }
  });

  it("preserves explicit key and base URL alias precedence", () => {
    expect(
      inferOpenAiCompatibleBiller(
        {
          OPENROUTER_API_KEY: "  key  ",
          OPENAI_BASE_URL: "https://example.com/v1",
        } as NodeJS.ProcessEnv,
        "custom",
      ),
    ).toBe("openrouter");

    expect(
      inferOpenAiCompatibleBiller(
        {
          OPENAI_BASE_URL: "https://example.com/v1",
          OPENAI_API_BASE: "https://openrouter.ai/api/v1",
        } as NodeJS.ProcessEnv,
        "custom",
      ),
    ).toBe("custom");
  });

  it("falls back without throwing for malformed, unrelated, or non-HTTP URLs", () => {
    for (const baseUrl of ["not a url", "ftp://openrouter.ai/v1", "https://example.com/v1"]) {
      expect(
        inferOpenAiCompatibleBiller({ OPENAI_BASE_URL: baseUrl } as NodeJS.ProcessEnv, null),
      ).toBeNull();
    }
  });
});
