import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

const LOCALE_STORAGE_KEY = "paperclip:locale";

function detectLocale(): string {
  // 1. Check localStorage for saved preference
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && supportedLocales.includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage may not be available
  }

  // 2. Check browser language
  if (typeof navigator !== "undefined" && navigator.language) {
    const browserLang = navigator.language;
    // Try exact match first
    if (supportedLocales.includes(browserLang)) {
      return browserLang;
    }
    // Try language-only match (e.g., "zh-CN" from "zh-CN-Windows")
    const langOnly = browserLang.split("-")[0];
    for (const locale of supportedLocales) {
      if (locale.startsWith(langOnly)) {
        return locale;
      }
    }
  }

  // 3. Fallback to default
  return DEFAULT_LOCALE;
}

const initialLocale = detectLocale();

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;

export function setLocale(locale: string) {
  if (!supportedLocales.includes(locale)) {
    console.warn(`Locale ${locale} is not supported`);
    return;
  }
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage may not be available
  }
  void i18n.changeLanguage(locale).catch((error: unknown) => {
    console.error("Failed to change language", error);
  });
}

export function getLocale(): string {
  return i18n.language || DEFAULT_LOCALE;
}

export { i18n };
