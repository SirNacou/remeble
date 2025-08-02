<script lang="ts">
  import { postAnkiConnectRequest } from "@/api/anki_connect";
  import { userConfigState } from "@/states/user_config_state.svelte";
  import { toast } from "svelte-sonner";

  let loading = $state(false);

  async function changeAnkiConnectURL() {
    userConfigState.value = {
      ...userConfigState.value,
      ankiConnectURL: userConfigState.value.ankiConnectURL,
    };

    const res = await postAnkiConnectRequest({
      action: "requestPermission",
      version: 6,
      params: null,
    });

    if (res.error) {
      toast.error(
        "Failed to change Anki Connect URL. Please check you Anki Connect URL."
      );
      console.error("Failed to change Anki Connect URL:", res.error);
      return;
    }

    if (res.result) {
      toast.success("Anki Connect URL changed successfully.");
      console.log("Anki Connect URL changed successfully:", res.result);
    } else {
      console.warn("No result returned from Anki Connect request.");
    }
    console.log(
      "Anki Connect URL changed to:",
      userConfigState.value.ankiConnectURL
    );
  }

  async function changeOpenLApiKey() {
    userConfigState.value = {
      ...userConfigState.value,
      rapidApiKey: userConfigState.value.rapidApiKey,
    };
  }

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();

    if (loading) {
      return;
    }

    try {
      loading = true;
      await changeAnkiConnectURL();
      changeOpenLApiKey();
    } finally {
      loading = false;
    }
  }
</script>

<form {onsubmit} class="w-80">
  <fieldset class="fieldset">
    <label class="fieldset-label" for="url">Anki Connect URL</label>
    <input
      type="url"
      class="input"
      id="url"
      placeholder="URL"
      bind:value={userConfigState.value.ankiConnectURL}
    />
  </fieldset>

  <fieldset class="fieldset">
    <label class="fieldset-label" for="apiKey">Rapid Api Key</label>
    <input
      type="text"
      class="input"
      id="apiKey"
      placeholder="API Key"
      bind:value={userConfigState.value.rapidApiKey}
    />
  </fieldset>

  <button
    class={`btn btn-soft mt-4 w-full ${loading ? "btn-disabled" : ""}`}
    type="submit"
  >
    {#if loading}
      <span class="loading loading-spinner"></span>
    {/if}
    Save
  </button>
</form>
