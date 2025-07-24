import { mount, unmount } from "svelte";
import Modal from "./Modal.svelte";

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "remeble-modal",
      position: "inline",
      anchor: "body",
      onMount: (uiContainer, shadow, shadowHost) => {
        return mount(Modal, { target: uiContainer });
      },
      onRemove: (mounted) => {
        mounted && unmount(mounted);
      },
    });

    ui.mount();
  },
});
