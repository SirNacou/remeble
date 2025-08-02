import { userConfigState } from "@/states/user_config_state.svelte";

export type Language = {
  code: string;
  name: string;
};

export const translateText = (text: string): Promise<string> => {
  return fetch("https://deep-translate1.p.rapidapi.com/language/translate/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "deep-translate1.p.rapidapi.com",
      "x-rapidapi-key": userConfigState.value.rapidApiKey,
    },
    body: JSON.stringify({
      q: text,
      source: userConfigState.value.currentLanguage,
      target: userConfigState.value.targetLanguage || "en",
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to translate text");
      }
      return response.json();
    })
    .then((data) => {
      return data.data.translations.translatedText.at(0) || "";
    })
    .catch((error) => {
      console.error("Error translating text:", error);
      return "";
    });
};
