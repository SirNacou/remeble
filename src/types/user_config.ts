export type UserConfig = {
  theme: "light" | "dark" | "system";
  ankiConnectURL: string;
  deckName: string;
  rapidApiKey: string;
  currentLanguage: string;
  targetLanguage?: string; // Optional field for target language
};
