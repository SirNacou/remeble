<script lang="ts">
  import { postAnkiConnectRequest } from "@/api/anki_connect";
  import data from "@/data/languages.json";
  import { userConfigState } from "@/states/user_config_state.svelte";
  import { createQuery } from "@tanstack/svelte-query";

  type Deck = {
    [key: string]: number;
  };

  const decks = createQuery<Deck, Error>({
    queryKey: ["decks"],
    queryFn: async () => {
      const res = await postAnkiConnectRequest<Deck>({
        action: "deckNamesAndIds",
        version: 6,
        params: null,
      });

      if (res.error) {
        console.error("Failed to fetch decks:", res.error);
        throw new Error("Failed to fetch decks");
      }

      return res.result || {};
    },
  });

  let sortedLanguages =
    data.languages ?
      data.languages.sort((a, b) => a.name.localeCompare(b.name))
    : [];
</script>

<div class="flex flex-col items-stretch">
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
        bind:value={userConfigState.value.deckName}
        onchange={() => {
          userConfigState.value = {
            ...userConfigState.value,
            deckName: userConfigState.value.deckName,
          };
        }}
      >
        <option disabled selected>Pick a deck</option>
        {#each Object.entries($decks.data) as [name]}
          <option
            value={name}
            selected={userConfigState.value.deckName === name}>{name}</option
          >
        {/each}
      </select>
    </fieldset>
  {/if}

  <fieldset class="fieldset">
    <legend class="fieldset-legend">Translate from</legend>
    <select
      class="select"
      bind:value={userConfigState.value.currentLanguage}
      onchange={() => {
        userConfigState.value = {
          ...userConfigState.value,
          currentLanguage: userConfigState.value.currentLanguage,
        };
      }}
    >
      {#each sortedLanguages as language (language.language)}
        <option
          value={language.language}
          selected={userConfigState.value.currentLanguage === language.language}
        >
          {language.name}
        </option>
      {/each}
    </select>
  </fieldset>

  <fieldset class="fieldset">
    <legend class="fieldset-legend">Translate to</legend>
    <select
      class="select"
      bind:value={userConfigState.value.targetLanguage}
      onchange={() => {
        userConfigState.value = {
          ...userConfigState.value,
          targetLanguage: userConfigState.value.targetLanguage,
        };
      }}
    >
      {#each sortedLanguages as language (language.language)}
        <option
          value={language.language}
          selected={userConfigState.value.targetLanguage === language.language}
        >
          {language.name}
        </option>
      {/each}
    </select>
  </fieldset>
</div>
