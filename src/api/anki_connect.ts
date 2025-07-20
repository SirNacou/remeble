import { userConfigState } from "@/states/user_config_state.svelte";

export type AnkiResponse<T> = {
  error: string | null;
  result: T | null;
};

export async function postAnkiConnectRequest<T = any>(
  action: string,
  version: number = 6,
  params: object | null = null
): Promise<AnkiResponse<T>> {
  try {
    const res = await fetch(userConfigState.value.ankiConnectURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        version,
        params: params || {},
      }),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Anki Connect request failed:", error);
    return Promise.resolve({
      error: error instanceof Error ? error.message : "Unknown error",
      result: null,
    });
  }
}
