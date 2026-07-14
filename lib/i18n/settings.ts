export const fallbackLng = "ko"
export const languages = ["ko", "en"] as const
export const defaultNS = "translation"

export type AppLanguage = (typeof languages)[number]
