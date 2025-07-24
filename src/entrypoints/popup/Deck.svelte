<script lang="ts">
  import { postAnkiConnectRequest } from "@/api/anki_connect";
  import { userConfigState } from "@/states/user_config_state.svelte";
  import { createQuery } from "@tanstack/svelte-query";

  type Deck = {
    [key: string]: number;
  };

  const decks = createQuery<Deck, Error>({
    queryKey: ["decks"],
    queryFn: async () => {
      const res = await postAnkiConnectRequest<Deck>("deckNamesAndIds");

      if (res.error) {
        console.error("Failed to fetch decks:", res.error);
        throw new Error("Failed to fetch decks");
      }

      return res.result || {};
    },
  });
</script>

{#if $decks.isLoading}
  <p class="p-4 text-gray-500">Loading decks...</p>
{:else if $decks.isError}
  <p class="p-4 text-red-500">
    Failed to load decks: {$decks.error.message}
  </p>
{:else if !$decks.data || ($decks.data && Object.keys($decks.data).length === 0)}
  <p class="p-4 text-gray-500">No decks available.</p>
{:else}
  <fieldset class="fieldset">
    <legend class="fieldset-legend">Deck</legend>
    <select
      class="select"
      bind:value={userConfigState.value.deckId}
      onchange={() => {
        userConfigState.value = {
          ...userConfigState.value,
          deckId: userConfigState.value.deckId,
        };
      }}
    >
      <option disabled selected>Pick a deck</option>
      {#each Object.entries($decks.data) as [name, id]}
        <option value={id} selected={userConfigState.value.deckId === id}
          >{name}</option
        >
      {/each}
    </select>
  </fieldset>
{/if}
