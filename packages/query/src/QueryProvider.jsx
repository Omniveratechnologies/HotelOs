import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./queryClient.js";

/**
 * Top-level React component that wraps its children with a TanStack QueryClientProvider.
 *
 * @param {object} props - Component props
 * @param {import("react").ReactNode} props.children - Child components
 * @param {import("@tanstack/react-query").QueryClient} [props.client] - Optional pre-existing QueryClient instance
 * @returns {import("react").JSX.Element}
 */
export function QueryProvider({ children, client }) {
  const [queryClient] = useState(() => client || createQueryClient());

  return (
    <QueryClientProvider client={client || queryClient}>
      {children}
    </QueryClientProvider>
  );
}
