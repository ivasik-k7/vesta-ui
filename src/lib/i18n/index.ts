import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import pl from './locales/pl.json'
import ru from './locales/ru.json'
import uk from './locales/uk.json'
import zh from './locales/zh.json'

export interface LanguageMeta {
  code: string
  label: string // endonym — shown in its own language
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
]

// English resources are the source of truth for the key set; other locales
// fall back to English per-key for anything not yet translated.
export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  zh: { translation: zh },
  pl: { translation: pl },
  uk: { translation: uk },
  ru: { translation: ru },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true, // en-US → en
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'vesta.lang',
      caches: ['localStorage'],
    },
  })

export default i18n
