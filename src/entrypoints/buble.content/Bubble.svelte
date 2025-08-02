<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "../app.css"; // Assuming this handles your Tailwind/CSS
  import { translateText } from "@/api/translation"; // Keep existing imports
  import { getWordDefinition, type WordDefinition } from "@/api/dictionary"; // Keep existing imports
  import { toast, Toaster } from "svelte-sonner"; // Keep existing imports
  import {
    postAnkiConnectRequest,
    type AnkiResponse,
  } from "@/api/anki_connect"; // This will be used now
  import { userConfigState } from "@/states/user_config_state.svelte";

  // Reactive state variables
  let selectedText = $state<string>("");
  let translatedText = $state<string>("");
  let dictionaryJson = $state<string>(""); // Used for display in textarea
  let definitions: WordDefinition[] = $state([]); // The actual parsed data

  let loading = $state<boolean>(false); // For initial dictionary/translation lookup
  let ankiLoading = $state<boolean>(false); // For Anki submission process

  let bubbleX = $state<number>(0);
  let bubbleY = $state<number>(0);
  let bubbleVisible = $state<boolean>(false);

  let bubbleElement: HTMLButtonElement | undefined = $state(undefined);
  let dialogElement: HTMLDialogElement | undefined = $state(undefined);
  let wordInputRef: HTMLInputElement | undefined = $state(undefined); // Added for initial focus

  // Keyboard shortcut state
  let lastAltAPressTime: number | null = null;
  const SHORTCUT_GRACE_PERIOD = 500; // milliseconds

  // --- Internal Anki Card Data Structure for easy manipulation ---
  interface AnkiCardData {
    word: string;
    translation: string;
    phonetic: string;
    audio_url: string;
    audio_filename: string;
    partOfSpeech: string;
    definition: string;
    example: string;
    origin: string;
    id: string; // Internal unique ID
  }

  // --- Helper function to parse WordDefinition into Anki card format ---
  function parseDictionaryJson(
    word_input: string,
    translation_input: string,
    raw_definitions: WordDefinition[] // Now directly using your WordDefinition type
  ): AnkiCardData[] {
    const ankiCards: AnkiCardData[] = [];

    for (const entry of raw_definitions) {
      console.log(entry);
      const word = entry.word?.trim() || word_input;
      const phonetic = entry.phonetic?.trim() || "";

      let audio_url = "";
      let audio_filename = "";
      if (entry.phonetics && entry.phonetics.length > 0) {
        const audioPhonetic = entry.phonetics.find((p) => p.audio);
        if (audioPhonetic && audioPhonetic.audio) {
          audio_url =
            audioPhonetic.audio.startsWith("//") ?
              `https:${audioPhonetic.audio}`
            : audioPhonetic.audio;
          audio_filename = audio_url.split("/").pop() || "";
        }
      }

      const origin = entry.origin?.trim() || "";

      if (entry.meanings && entry.meanings.length > 0) {
        for (const meaning of entry.meanings) {
          const partOfSpeech = meaning.partOfSpeech?.trim() || "";
          if (meaning.definitions && meaning.definitions.length > 0) {
            for (const definition_obj of meaning.definitions) {
              const definition_text = definition_obj.definition?.trim() || "";
              // Your `example` type is non-optional, but API might return empty string
              const example = definition_obj.example?.trim() || "";

              ankiCards.push({
                word: word,
                translation: translation_input,
                phonetic: phonetic,
                audio_url: audio_url,
                audio_filename: audio_filename,
                partOfSpeech: partOfSpeech,
                definition: definition_text,
                example: example,
                origin: origin,
                id: `${word}-${partOfSpeech}-${definition_text.substring(0, 20)}-${Date.now()}`,
              });
            }
          }
        }
      }
    }
    return ankiCards;
  }

  // --- Event Handlers ---
  function handleMouseUp(event: MouseEvent) {
    const selection = window.getSelection();
    const currentSelectedText = selection ? selection.toString().trim() : "";

    if (
      bubbleVisible &&
      bubbleElement &&
      bubbleElement.contains(event.target as Node)
    ) {
      return;
    }

    if (currentSelectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();

        if (!bubbleElement) {
          bubbleVisible = false;
          return;
        }

        selectedText = currentSelectedText;

        bubbleX = rect.left + rect.width / 2;
        const verticalOffset = 10;
        bubbleY = rect.top - verticalOffset;

        bubbleVisible = true;
      } else {
        bubbleVisible = false;
      }
    } else {
      bubbleVisible = false;
    }
  }

  async function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      bubbleVisible = false;
      dialogElement?.close();
      lastAltAPressTime = null;
      return;
    }

    if (event.altKey && event.key.toLowerCase() === "a") {
      const currentTime = Date.now();

      if (
        lastAltAPressTime &&
        currentTime - lastAltAPressTime <= SHORTCUT_GRACE_PERIOD
      ) {
        if (selectedText.length > 0) {
          event.preventDefault();
          await handleIconClick();
          bubbleVisible = false;
        }
        lastAltAPressTime = null;
      } else {
        lastAltAPressTime = currentTime;
      }
    } else {
      lastAltAPressTime = null;
    }
  }

  async function handleIconClick() {
    loading = true;

    try {
      // Directly set the definitions state from the API call result
      definitions = await getWordDefinition(selectedText);
      if (definitions.length === 0) {
        toast.info("No dictionary definitions found for the selected text.");
        translatedText = "";
        dictionaryJson = ""; // Clear displayed JSON
        return;
      }

      browser;

      translatedText = await translateText(selectedText);
      if (!translatedText) {
        toast.error("Failed to translate the selected text.");
      }

      // Set dictionaryJson for display in the textarea (stringifying the first definition)
      dictionaryJson = JSON.stringify(definitions[0], null, 2);

      dialogElement?.showModal();
      bubbleVisible = false;
    } catch (error: any) {
      console.error("Error fetching definition or translation:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      loading = false;
    }
  }

  // --- addToAnki Function (now uses 'definitions' state directly) ---
  async function addToAnki() {
    ankiLoading = true;
    toast.info("Adding card to Anki...", { duration: 3000 });

    try {
      if (definitions.length === 0) {
        toast.error(
          "No definitions available to add to Anki. Please fetch them first."
        );
        return;
      }

      // We will now build a single note from all definitions
      let backContent = `<h2>${translatedText || selectedText}</h2>`;
      let audio_url = "";
      let audio_filename = "";

      // Loop through all entries and meanings to build the card content
      for (const entry of definitions) {
        // Find the first audio available
        if (!audio_url && entry.phonetics && entry.phonetics.length > 0) {
          const audioPhonetic = entry.phonetics.find((p) => p.audio);
          if (audioPhonetic && audioPhonetic.audio) {
            audio_url =
              audioPhonetic.audio.startsWith("//") ?
                `https:${audioPhonetic.audio}`
              : audioPhonetic.audio;
            audio_filename = audio_url.split("/").pop() || "";
          }
        }

        // Add phonetic and origin information if available
        if (entry.phonetic?.trim()) {
          backContent += `<p><i>${entry.phonetic.trim()}</i></p>`;
        }
        if (entry.origin?.trim()) {
          backContent += `<p><small>Origin: ${entry.origin.trim()}</small></p>`;
        }

        // Loop through meanings and their definitions
        if (entry.meanings && entry.meanings.length > 0) {
          for (const meaning of entry.meanings) {
            const partOfSpeech = meaning.partOfSpeech?.trim() || "";
            backContent += `<p><strong>${partOfSpeech}:</strong></p><ul>`;
            if (meaning.definitions && meaning.definitions.length > 0) {
              for (const definition_obj of meaning.definitions) {
                const definition_text = definition_obj.definition?.trim() || "";
                const example = definition_obj.example?.trim() || "";

                backContent += `<li>${definition_text}`;
                if (example) {
                  backContent += `<br><em>e.g. ${example}</em>`;
                }
                backContent += `</li>`;
              }
            }
            backContent += `</ul>`;
          }
        }
      }

      const payload = {
        action: "addNote",
        version: 6,
        params: {
          note: {
            deckName: userConfigState.value.deckName,
            modelName: "Basic",
            fields: {
              Front: selectedText,
              Back: backContent,
            },
            options: {
              allowDuplicate: false,
              duplicateScope: "deck",
              duplicateSearchFields: ["Front"],
            },
            tags: ["custom-dictionary", selectedText.toLowerCase()],
            audio:
              audio_filename ?
                [
                  {
                    filename: audio_filename,
                    url: audio_url,
                    fields: ["Front"],
                  },
                ]
              : [],
          },
        },
      };

      const response: AnkiResponse<any> = await browser.runtime.sendMessage({
        action: "postAnkiConnect",
        payload: payload,
      });

      if (response.error) {
        throw new Error(
          response.error || "Unknown error from background script."
        );
      }

      toast.success(`Successfully added a new card to Anki!`);
      closeDialogElement();
    } catch (error: any) {
      console.error("Error adding to Anki:", error);
      toast.error(`Failed to add to Anki: ${error.message}`);
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Connection refused") ||
        error.message.includes("AnkiConnect communication error")
      ) {
        toast.error(
          "Make sure Anki is running and AnkiConnect add-on is installed and enabled!"
        );
      }
    } finally {
      ankiLoading = false;
    }
  }

  async function closeDialogElement() {
    selectedText = "";
    translatedText = "";
    dictionaryJson = "";
    definitions = []; // Clear the definitions array
    dialogElement?.close();
    bubbleVisible = false; // Hide the bubble if it was visible
    if (wordInputRef) {
      wordInputRef.focus(); // Focus back on the input field
    }
  }

  // --- Lifecycle Hooks ---
  onMount(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
    if (wordInputRef) {
      // Ensure ref is available before trying to focus
      wordInputRef.focus();
    }
  });

  onDestroy(() => {
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("keydown", handleKeyDown);
  });
</script>

<button
  bind:this={bubbleElement}
  class={`btn btn-soft btn-primary absolute ${bubbleVisible ? "block" : "hidden"}`}
  disabled={loading}
  style="left: {bubbleX}px; top: {bubbleY}px; transform: translate(-50%, -100%);"
  onclick={handleIconClick}
>
  {#if loading}
    <span class="loading loading-spinner"></span>
  {:else}
    Add to Anki
  {/if}
</button>

<dialog id="remeble-modal" bind:this={dialogElement} class="modal">
  <Toaster />
  <div class="modal-box flex flex-col items-stretch">
    <h3 class="text-lg font-bold">Add to Anki</h3>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Selected text</legend>
      <div class="join">
        <input
          type="text"
          class="input join-item"
          bind:value={selectedText}
          bind:this={wordInputRef}
        />
        <button class="btn join-item">Update</button>
      </div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Translation</legend>
      <div class="join">
        <input
          type="text"
          class="input join-item"
          bind:value={translatedText}
        />
      </div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Dictionary</legend>
      <div class="join">
        <textarea
          class="textarea join-item"
          bind:value={dictionaryJson}
          rows="4"
        ></textarea>
      </div>
    </fieldset>

    <div class="modal-action flex items-center gap-2">
      <button
        class="btn btn-primary"
        onclick={addToAnki}
        disabled={ankiLoading}
      >
        {#if ankiLoading}
          Adding...
        {:else}
          Add to Anki
        {/if}
      </button>
      <button class="btn" onclick={closeDialogElement}>Close</button>
    </div>
  </div>
</dialog>
