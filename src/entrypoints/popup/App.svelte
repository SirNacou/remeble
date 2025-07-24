<script lang="ts" module>
  import "../app.css";
  import { QueryClientProvider, QueryClient } from "@tanstack/svelte-query";
  import Router from "./Router.svelte";
  import { Toaster } from "svelte-sonner";

  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <Router />
  <Toaster position="top-center" />
</QueryClientProvider>
