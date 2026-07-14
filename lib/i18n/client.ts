"use client"

import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import enTranslation from "@/public/locales/en/translation.json"
import koTranslation from "@/public/locales/ko/translation.json"
import { defaultNS, fallbackLng, languages } from "./settings"

const resources = {
  ko: { [defaultNS]: koTranslation },
  en: { [defaultNS]: enTranslation },
}

if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .init({
      lng: fallbackLng,
      fallbackLng,
      supportedLngs: [...languages],
      ns: [defaultNS],
      defaultNS,
      resources,
      returnEmptyString: false,
      initAsync: false,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    })
}

export default i18next
