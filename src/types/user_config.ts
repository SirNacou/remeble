export type UserConfig = {
  theme: "light" | "dark" | "system";
  ankiConnectURL: string;
  deckId: number;
  nativeLanguage: string;
  targetLanguage?: string; // Optional field for target language
};
