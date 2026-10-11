import { QueryProvider, useQueryClient } from "@hotelos/query";
import { useRealtimeSync } from "@hotelos/socket";

function RealtimeSubscriber({ children }) {
  const queryClient = useQueryClient();
  useRealtimeSync(queryClient);
  return children;
}

export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <RealtimeSubscriber>{children}</RealtimeSubscriber>
    </QueryProvider>
  );
}
