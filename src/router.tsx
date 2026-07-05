import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Cache aggressively so tab switches (dashboard <-> reports) are instant.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload route code + data as soon as a link is hovered/focused so
    // navigation feels instant. Query owns freshness (defaultPreloadStaleTime: 0).
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
