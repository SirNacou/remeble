// src/background.ts

export default defineBackground({
  main() {
    // src/background.ts

    console.log("Background Script: Initializing listener.");

    const injectedTabs = new Map<number, boolean>(); // Tracks if modal content script is injected per tab

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Background Script: Message received!", message);

      const isAsync = true;

      (async () => {
        if (message.type === "openCornerModal" && message.text) {
          const selectedText = message.text;
          const tabId = sender.tab?.id;

          if (tabId === undefined) {
            console.error("Background: No tab ID found for message sender.");
            sendResponse({ status: "error", message: "No tab ID" });
            return;
          }

          console.log(
            "Background: Received request to open modal for text:",
            selectedText
          );

          try {
            // Check if modal scripts are already injected for this tab
            if (!injectedTabs.has(tabId) || !injectedTabs.get(tabId)) {
              console.log(
                `Background: Injecting modal scripts for tab ${tabId} for the first time.`
              );

              injectedTabs.set(tabId, true); // Mark as injected for this tab

              // Give the newly injected script a moment to fully load and set up its message listener
              // This timeout is crucial for the very first time the modal is opened on a page.
              await new Promise((resolve) => setTimeout(resolve, 300));
            } else {
              console.log(
                `Background: Modal scripts already injected for tab ${tabId}. Just sending update message.`
              );
            }

            // 3. Send a message to the (now existing and persistent) modal content script
            // This message tells the modal to update its content and become visible.
            browser.tabs.sendMessage(
              tabId,
              {
                type: "updateModalText",
                text: selectedText,
              },
              (response) => {
                if (browser.runtime.lastError) {
                  console.error(
                    "Background: Error sending message to content script:",
                    browser.runtime.lastError.message
                  );
                } else {
                  console.log(
                    "Background: Message to content script sent successfully. Response:",
                    response
                  );
                }
                sendResponse({ status: "modal_update_sent" }); // Response to App.svelte (the bubble)
              }
            );
          } catch (error) {
            console.error("Background: Error during modal management:", error);
            sendResponse({
              status: "error",
              message: `Background error: ${error}`,
            });
          }
        } else {
          console.log(
            "Background: Unhandled message type or missing text:",
            message
          );
          sendResponse({ status: "error", message: "Unhandled message" });
        }
      })();

      return isAsync; // Indicate that sendResponse will be called asynchronously
    });

    // Optional: Clean up injectedTabs map when a tab is closed/removed
    // This ensures that if a user closes a tab and re-opens it,
    // the modal script will be re-injected for that new tab session.
    browser.tabs.onRemoved.addListener((tabId) => {
      if (injectedTabs.has(tabId)) {
        injectedTabs.delete(tabId);
        console.log(
          `Background: Cleaned up injected status for closed tab ${tabId}.`
        );
      }
    });

    // Optional: You might want to also listen for tab updates (e.g., navigation)
    // and reset the injected status if the page reloads or navigates.
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (
        changeInfo.status === "complete" &&
        tabId &&
        injectedTabs.has(tabId)
      ) {
        // A simple heuristic: if a tab completes loading, assume the content script might need re-injection
        // if it was previously injected. This prevents stale states across navigations.
        console.log(
          `Background: Tab ${tabId} updated/reloaded. Resetting injected status.`
        );
        injectedTabs.delete(tabId);
      }
    });
  },
});
