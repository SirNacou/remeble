<script lang="ts">
  import "../app.css";

  let { text = $bindable<string>("") } = $props(); // Prop for the text to display
  let modalVisible = $state<boolean>(false); // State to control visibility
  let modalContentElement: HTMLDivElement | undefined = $state(); // Binding to the modal's root element

  // Function to hide the modal
  function closeModal() {
    modalVisible = false; // Simply hide it
    // *** CRITICAL CHANGE: REMOVE THE LINE BELOW ***
    // We do NOT remove the element from the DOM. It stays hidden.
    // modalContentElement.parentNode.removeChild(modalContentElement);
  }

  // Handle clicks on the *document* to detect outside clicks
  function handleOutsideClick(event: MouseEvent) {
    // Only close if the modal is visible AND the click was outside the actual modal content
    // Check if event.target is outside of the modal element
    if (
      modalVisible &&
      modalContentElement &&
      !modalContentElement.contains(event.target as Node)
    ) {
      closeModal();
    }
  }

  // Listener for messages from the background script
  function handleMessage(
    message: any,
    sender: Browser.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    if (message.type === "updateModalText" && message.text) {
      text = message.text; // Update the content
      modalVisible = true; // Make the modal visible
      console.log("CornerModal: Received updateModalText message. Text:", text);
    }
    // Acknowledge receipt of the message if background script expects a response.
    // sendResponse({ status: 'modal_updated_and_shown' });
  }

  // Lifecycle hook: When the Svelte component is first mounted in the DOM
  onMount(() => {
    console.log("CornerModal: onMount fired! (Modal component is now in DOM)");
    // Attach event listeners to the document
    document.addEventListener("mousedown", handleOutsideClick);
    // Attach listener for messages from the background script
    browser.runtime.onMessage.addListener(handleMessage);
    // Modal starts hidden, it will become visible only when `updateModalText` message is received.
  });

  // Lifecycle hook: When the Svelte component is about to be removed from the DOM (e.g., page navigation)
  onDestroy(() => {
    console.log(
      "CornerModal: onDestroy fired! (Modal component being removed from DOM)"
    );
    // Clean up event listeners to prevent memory leaks
    document.removeEventListener("mousedown", handleOutsideClick);
    browser.runtime.onMessage.removeListener(handleMessage);
  });
</script>

{#if modalVisible}
  <div
    id="corner-modal-content"
    class="modal-container"
    bind:this={modalContentElement}
  >
    <div class="modal-header">
      <h3>Selected Text</h3>
      <button class="close-btn" onclick={closeModal}>&times;</button>
    </div>
    <div class="modal-content-area">
      <input type="text" bind:value={text} class="input" />

      <div class="modal-actions">
        <button onclick={() => console.log("Translate:", text)}
          >Translate</button
        >
        <button onclick={() => console.log("Summarize:", text)}
          >Summarize</button
        >
        <button onclick={() => console.log("Search Web:", text)}
          >Search Web</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  /* All your custom CSS for styling the modal remains exactly the same */
  .modal-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 300px;
    max-height: calc(100vh - 40px);
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 100000;
    display: flex; /* Svelte's {#if} will handle the actual display: none/block */
    flex-direction: column;
    overflow: hidden;
    opacity: 1; /* These are for transitions, the element is truly hidden/shown by {#if} */
    transform: translateY(0);
    transition:
      transform 0.3s ease-out,
      opacity 0.3s ease-out;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #f5f5f5;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #888;
    line-height: 1;
    padding: 0;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #333;
  }

  .modal-content-area {
    padding: 15px;
    flex-grow: 1;
    overflow-y: auto;
    font-size: 14px;
    color: #555;
  }

  .modal-content-area p {
    margin-top: 0;
    margin-bottom: 15px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .modal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
    flex-shrink: 0;
  }

  .modal-actions button {
    flex: 1 1 auto;
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s ease;
  }

  .modal-actions button:hover {
    background-color: #0056b3;
  }
</style>
