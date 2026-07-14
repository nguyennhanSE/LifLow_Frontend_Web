export default {
  locales: ["ko", "en"],
  extract: {
    input: [
      "app/**/*.{js,jsx,ts,tsx}",
      "components/**/*.{js,jsx,ts,tsx}",
    ],
    ignore: [
      "**/*.d.ts",
      "**/node_modules/**",
      "**/.next/**",
      "**/.next-*/**",
    ],
    output: "public/locales/{{language}}/{{namespace}}.json",
    defaultNS: "translation",
    primaryLanguage: "ko",
    secondaryLanguages: ["en"],
  },
  locize: {
    projectId: 'f0b3cace-5ba7-4211-9968-d2bbdea8705d',
    apiKey: 'lz_api_eBBFqBjuzA2vz9wulq5VqHcp2ZgnrTwi',
    referenceLng: "ko",
    version: "latest",
  },
}
