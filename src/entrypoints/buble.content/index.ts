import { mount, unmount } from "svelte";
import Bubble from "./Bubble.svelte";

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: "remeble-buble",
      position: "inline",
      anchor: "body",
      onMount: (uiContainer, shadow, shadowHost) => {
        return mount(Bubble, { target: uiContainer });
      },
      onRemove: (mounted) => {
        mounted && unmount(mounted);
      },
    });

    ui.mount();
  },
});
