<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "../app.css";

  // Reactive state using $state()
  let selectedText = $state<string>("");
  let bubbleX = $state<number>(0);
  let bubbleY = $state<number>(0);
  let bubbleVisible = $state<boolean>(false);

  // No change for binding to DOM elements
  let bubbleElement: HTMLButtonElement | undefined = $state(undefined);
  let dialogElement: HTMLDialogElement | undefined = $state(undefined);

  // For keyboard shortcut: Alt + A, A
  let lastAltAPressTime: number | null = null;
  const SHORTCUT_GRACE_PERIOD = 500; // milliseconds

  function handleMouseUp(event: MouseEvent) {
    const selection = window.getSelection();
    const currentSelectedText = selection ? selection.toString().trim() : "";

    // If a click happened inside the bubble itself, don't hide it immediately after showing
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

        // Ensure bubbleElement is available to get its dimensions
        if (!bubbleElement) {
          bubbleVisible = false;
          return;
        }
        const bubbleRect = bubbleElement.getBoundingClientRect();

        selectedText = currentSelectedText;

        // Position calculations for transform: translate(-50%, -100%)
        bubbleX = rect.left + rect.width / 2; // Horizontal center of selection
        const verticalOffset = 10; // Pixels above the selected text
        bubbleY = rect.top - verticalOffset; // This is where the BOTTOM of the bubble will be

        bubbleVisible = true;
      } else {
        bubbleVisible = false;
      }
    } else {
      bubbleVisible = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      bubbleVisible = false;
      dialogElement?.close(); // Also close the dialog on escape
      lastAltAPressTime = null; // Reset shortcut state
      return;
    }

    // Check for Alt + A
    if (event.altKey && event.key.toLowerCase() === "a") {
      const currentTime = Date.now();

      // If this is the second 'A' press after a recent 'Alt + A'
      if (
        lastAltAPressTime &&
        currentTime - lastAltAPressTime <= SHORTCUT_GRACE_PERIOD
      ) {
        // Only trigger if there's actual selected text
        if (selectedText.length > 0) {
          event.preventDefault(); // Prevent default browser behavior for Alt+A if any
          handleIconClick(); // Trigger the action
          bubbleVisible = false; // Hide bubble after action
        }
        lastAltAPressTime = null; // Reset for next sequence
      } else {
        // This is the first 'Alt + A' or too much time has passed
        lastAltAPressTime = currentTime;
      }
    } else {
      // Any other key press, reset the shortcut state
      lastAltAPressTime = null;
    }
  }

  function handleIconClick() {
    dialogElement?.showModal(); // Show the dialog

    // Ensure `browser` API is available (for WebExtensions)
    if (typeof browser !== "undefined" && browser.runtime) {
      browser.runtime.sendMessage(
        {
          type: "openCornerModal",
          text: selectedText,
        },
        (response) => {
          if (browser.runtime.lastError) {
            console.error(
              "Error sending message:",
              browser.runtime.lastError.message
            );
          }
        }
      );
    } else {
      console.warn(
        "`browser.runtime` API not available. Not running in a WebExtension context?"
      );
    }

    bubbleVisible = false; // Hide bubble after click/shortcut
  }

  onMount(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    document.removeEventListener("mouseup", handleMouseUp);
    document.removeEventListener("keydown", handleKeyDown);
  });
</script>

<button
  bind:this={bubbleElement}
  class={`btn btn-soft btn-primary absolute ${bubbleVisible ? "block" : "hidden"}`}
  style="left: {bubbleX}px; top: {bubbleY}px; transform: translate(-50%, -100%);"
  onclick={handleIconClick}
>
  Add to Anki
</button>

<dialog id="remeble-modal" bind:this={dialogElement} class="modal">
  <div class="modal-box flex flex-col items-stretch">
    <h3 class="text-lg font-bold">Add to Anki</h3>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Selected text</legend>
      <div class="join">
        <input type="text" class="input join-item" bind:value={selectedText} />
        <button class="btn join-item">Update</button>
      </div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Translation</legend>
      <div class="join">
        <input type="text" class="input join-item" bind:value={selectedText} />
        <button class="btn join-item">Update</button>
      </div>
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">Selected text</legend>
      <div class="join">
        <input type="text" class="input join-item" bind:value={selectedText} />
        <button class="btn join-item">Update</button>
      </div>
    </fieldset>

    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
</dialog>

<style>
  .btn.absolute {
    z-index: 99999; /* High z-index to be on top */
    white-space: nowrap; /* Prevent text wrap if "Add to Anki" is long */
    padding: 0.5rem 0.75rem; /* Adjust padding for better look */
  }
</style>
