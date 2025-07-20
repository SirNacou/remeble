<script lang="ts" module>
  import ConfigTab from "@/components/config-tab/ConfigTab.svelte";
  import "./app.css";
  import Icon from "@iconify/svelte";

  type Page = "home" | "deck" | "settings";

  let page: Page = $state("home");
</script>

<main class="w-120 h-120 flex flex-col items-center justify-center">
  {#if page === "home"}
    <h1>Welcome to Remeble!</h1>
  {:else if page === "deck"}
    <p>Deck.</p>
  {:else}
    <ConfigTab />
  {/if}

  <div class="dock">
    <button
      class={page === "home" ? "dock-active" : ""}
      onclick={() => {
        page = "home";
      }}
    >
      <Icon icon="ph:house-bold" font-size="24" />
      <span class="dock-label">Home</span>
    </button>

    <button
      class={page === "deck" ? "dock-active" : ""}
      onclick={() => {
        page = "deck";
      }}
    >
      <Icon icon="ph:book-bold" font-size="24" />
      <span class="dock-label">Deck</span>
    </button>

    <button
      class={page === "settings" ? "dock-active" : ""}
      onclick={() => {
        page = "settings";
      }}
    >
      <Icon icon="ph:gear-bold" font-size="24" />
      <span class="dock-label">Settings</span>
    </button>
  </div>
</main>
