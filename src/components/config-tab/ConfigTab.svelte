<script lang="ts">
  import { postAnkiConnectRequest } from "@/api/anki_connect";
  import { userConfigState } from "@/states/user_config_state.svelte";
  import { toast } from "svelte-sonner";

  let loading = $state(false);

  async function changeAnkiConnectURL(event: Event) {
    userConfigState.value = {
      ...userConfigState.value,
      ankiConnectURL: userConfigState.value.ankiConnectURL,
    };

    const res = await postAnkiConnectRequest("requestPermission", 6);

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

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();

    if (loading) {
      return;
    }

    try {
      loading = true;
      await changeAnkiConnectURL(event);
    } finally {
      loading = false;
    }
  }
</script>

<form {onsubmit} class="w-80">
  <label class="label" for="url">Anki Connect URL</label>
  <input
    type="url"
    class="input"
    id="url"
    placeholder="URL"
    bind:value={userConfigState.value.ankiConnectURL}
  />

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
