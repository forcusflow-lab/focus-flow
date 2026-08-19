import { describe, expect, it } from "vitest";

import { appLanguageFromLocale } from "../lib/focus-flow/locale";

describe("Focus Flowの端末言語判定", () => {
  it("日本語の言語タグを日本語表示として扱う", () => {
    expect(appLanguageFromLocale("ja-JP")).toBe("ja");
    expect(appLanguageFromLocale("ja_JP")).toBe("ja");
  });

  it("日本語以外の言語タグは英語表示として扱う", () => {
    expect(appLanguageFromLocale("en-US")).toBe("en");
    expect(appLanguageFromLocale(undefined)).toBe("en");
  });
});
