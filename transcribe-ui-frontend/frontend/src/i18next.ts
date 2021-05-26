import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import localeJaCommon from './locales/ja/common.json'
import localeJaDictation from './locales/ja/dictation.json'
import localeJaVocabularies from './locales/ja/vocabularies.json'
import { initReactI18next } from 'react-i18next'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        common: localeJaCommon,
        dictation: localeJaDictation,
        vocabularies: localeJaVocabularies
      }
    },
    initImmediate: false,
    fallbackLng: 'ja',
    returnEmptyString: true,
    interpolation: {
      escapeValue: false
    }
  })
