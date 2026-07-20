export type Lang = 'en' | 'uk'

// Lightweight dictionary — keys default to English; Ukrainian mirrors the
// surfaces a user navigates most (nav, settings, dashboard chrome).
export const DICT = {
  'nav.overview': { en: 'Overview', uk: 'Огляд' },
  'nav.wallet': { en: 'Wallet', uk: 'Гаманець' },
  'nav.activity': { en: 'Activity', uk: 'Активність' },
  'nav.alliances': { en: 'Alliances', uk: 'Альянси' },
  'nav.console': { en: 'Merchant console', uk: 'Консоль мерчанта' },
  'nav.admin': { en: 'Admin', uk: 'Адмін' },
  'nav.settings': { en: 'Settings', uk: 'Налаштування' },

  'settings.title': { en: 'Settings', uk: 'Налаштування' },
  'settings.sub': {
    en: 'Preferences, appearance, and your devnet account.',
    uk: 'Уподобання, вигляд і твій devnet-рахунок.',
  },
  'settings.appearance': { en: 'Appearance', uk: 'Вигляд' },
  'settings.theme': { en: 'Theme', uk: 'Тема' },
  'settings.language': { en: 'Language', uk: 'Мова' },
  'settings.account': { en: 'Devnet account', uk: 'Devnet-рахунок' },
  'settings.balance': { en: 'SOL balance', uk: 'Баланс SOL' },
  'theme.light': { en: 'Light', uk: 'Світла' },
  'theme.dark': { en: 'Dark', uk: 'Темна' },
  'theme.system': { en: 'System', uk: 'Системна' },

  'balance.airdrop': { en: 'Request 1 SOL', uk: 'Запросити 1 SOL' },
  'balance.airdropping': { en: 'Requesting…', uk: 'Запит…' },
  'common.connectPrompt': {
    en: 'Connect a devnet wallet to continue.',
    uk: 'Підключи devnet-гаманець, щоб продовжити.',
  },
} as const

export type TranslationKey = keyof typeof DICT

export function translate(key: TranslationKey, lang: Lang): string {
  const entry = DICT[key]
  return entry[lang] ?? entry.en
}
