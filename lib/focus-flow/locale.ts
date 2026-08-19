export type AppLanguage = "ja" | "en";

export function appLanguageFromLocale(locale?: string | null): AppLanguage {
  return typeof locale === "string" && locale.toLowerCase().startsWith("ja") ? "ja" : "en";
}
