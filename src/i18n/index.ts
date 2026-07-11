import { createI18n } from 'vue-i18n'
import de from './locales/de'
import en from './locales/en'
import fr from './locales/fr'
import it from './locales/it'

export const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'it'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]
export const LANGUAGE_AUTO = 'auto'
export type LanguageSetting = SupportedLocale | typeof LANGUAGE_AUTO

const DEFAULT_LOCALE: SupportedLocale = 'de'

export function detectBrowserLocale(): SupportedLocale {
  const langs = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language]
  for (const lang of langs) {
    const short = lang.slice(0, 2).toLowerCase()
    if ((SUPPORTED_LOCALES as readonly string[]).includes(short)) {
      return short as SupportedLocale
    }
  }
  return DEFAULT_LOCALE
}

export function resolveLocale(setting: LanguageSetting): SupportedLocale {
  return setting === LANGUAGE_AUTO ? detectBrowserLocale() : setting
}

export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'de',
  messages: { de, en, fr, it },
})

export function setLocale(setting: LanguageSetting) {
  ;(i18n.global.locale as unknown as { value: SupportedLocale }).value = resolveLocale(setting)
}
