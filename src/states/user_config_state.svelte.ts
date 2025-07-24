import { UserConfig } from "@/types/user_config";
import { LocalStorageState } from "./local_storage_state.svelte";

export const userConfigState = new LocalStorageState<UserConfig>("userConfig", {
  theme: "system",
  ankiConnectURL: "http://localhost:8765",
  deckId: 0,
  nativeLanguage: "VI",
  targetLanguage: "EN",
});
