import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, fr, type Messages } from "./messages";

export type Locale = "en" | "fr";

type I18nValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE = "cm_locale";

function initialLocale(): Locale {
  if (typeof localStorage === "undefined") return "en";
  const saved = localStorage.getItem(STORAGE);
  if (saved === "en" || saved === "fr") return saved;
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = (next: Locale) => {
    localStorage.setItem(STORAGE, next);
    setLocaleState(next);
    document.documentElement.lang = next;
  };
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo(
    () => ({ locale, messages: locale === "fr" ? fr : en, setLocale }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n");
  return value;
}
