export type Phonetic = {
  text: string;
  audio?: string;
};

export type Meaning = {
  partOfSpeech: string;
  definitions: {
    definition: string;
    example: string;
    synonyms: string[];
    antonyms: string[];
  }[];
};

export type WordDefinition = {
  word: string;
  phonetic?: string;
  phonetics: Phonetic[];
  origin: string;
  meanings: Meaning[];
};

export const getWordDefinition = (word: string): Promise<WordDefinition[]> => {
  return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch word definition");
      }
      return response.json();
    })
    .then((data) => {
      return data as WordDefinition[];
    })
    .catch((error) => {
      console.error("Error fetching word definition:", error);
      return [];
    });
};
