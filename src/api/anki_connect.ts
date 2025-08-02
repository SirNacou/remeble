import { userConfigState } from "@/states/user_config_state.svelte";

export type AnkiResponse<T> = {
  error: string | null;
  result: T | null;
};

export async function postAnkiConnectRequest<T = any>({
  action,
  version = 6,
  params = null,
}: {
  action: string;
  version: number;
  params: object | null;
}): Promise<AnkiResponse<T>> {
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
