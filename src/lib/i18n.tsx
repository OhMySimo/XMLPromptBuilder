// src/lib/i18n.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../locales/en.json';
import it from '../locales/it.json';

type LangKey = 'en' | 'it';
const messages: Record<LangKey, Record<string, string>> = { en, it };

const LocalCtx = createContext({
  lang: 'en' as LangKey,
  setLang: (l: LangKey) => {},
  t: (k: string, vars?: Record<string, any>) => k
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangKey>(() => {
    try {
      const s = localStorage.getItem('xmlpb_lang') as LangKey | null;
      if (s === 'en' || s === 'it') return s;
    } catch (e) {}
    // system detection
    const isIt = typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('it');
    return isIt ? 'it' : 'en';
  });

  useEffect(() => { localStorage.setItem('xmlpb_lang', lang); }, [lang]);

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, any>) => {
      const msg = messages[lang][key] ?? (messages['en'][key] ?? key);
      if (!vars) return msg;
      return msg.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? vars[k] === 0 ? String(vars[k]) : ''));
    };
  }, [lang]);

  return <LocalCtx.Provider value={{ lang, setLang, t }}>{children}</LocalCtx.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocalCtx);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return { t: ctx.t, lang: ctx.lang, setLang: ctx.setLang };
}
