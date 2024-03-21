import { createSignal } from "solid-js";
import de from "../locales/de.json";
import en from "../locales/en.json";
import kr from "../locales/kr.json";

export const langs = {
  en: en as Record<string, string>,
  de: de as Record<string, string>,
  kr: kr as Record<string, string>,
} as const;

export type LocaleKey = keyof typeof en;
export type LocaleLang = keyof typeof langs;

export const [language, setLanguage] = createSignal<LocaleLang>("en");

export function t(id: LocaleKey, args: Array<string | number> = []) {
  const lang = language();
  const str = langs[lang][id] || langs.en[id];

  if (str) {
    const parts = str.split("{}");
    if (parts.length > 0) {
      const merged: Array<string | number> = [];

      parts.forEach((part, i) => {
        merged.push(part);
        const arg = args[i];
        if (arg) {
          merged.push(arg);
        }
      });

      return merged.join("") || id;
    }
  }

  return str;
}
