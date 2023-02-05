const languages = {};

let language = { en: {} };

/*
 * Class for getting language strings from the i18n file
 */
export class Lang {
  static loadLanguageMapping(langMapping) {
    language = langMapping;
  }

  static get(key, alt) {
    return language[key] || alt;
  }
}

const lang = document.documentElement.lang;

Lang.loadLanguageMapping(languages[lang] || {});
