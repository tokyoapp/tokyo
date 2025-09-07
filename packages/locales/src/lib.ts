import i18next from "i18next";

import de from "../locales/de.json";
import en from "../locales/en.json";
import kr from "../locales/kr.json";

export const AVAILABLE_LANGS = ["en"];
export const DEFAULT_LANGUAGE = "en";

const log = console;

// https://www.i18next.com/overview/api

i18next.init(
  {
    // partialBundledLanguages: true, /* partialy from backend */
    fallbackLng: "en",
    defaultNS: "global",
    resources: {},
  },
  (err) => {
    if (err) return log.error("something went wrong loading", err);
    log.info("i18next loaded");
  }
);

i18next.addResourceBundle("de", "global", de);
i18next.addResourceBundle("en", "global", en);
i18next.addResourceBundle("kr", "global", kr);

export type LocaleKey = keyof typeof de;

export function t(
  id: LocaleKey | LocaleKey[],
  args: Array<number | string | undefined> = [],
  lang?: string
): string | undefined {
  return i18next.t(id, { lng: lang ?? DEFAULT_LANGUAGE, ...args });
}
