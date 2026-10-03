import { QueryProvider, useQueryClient } from "@hotelos/query";
import { useRealtimeSync } from "@hotelos/socket";

function RealtimeSubscriber({ children }) {
  const queryClient = useQueryClient();
  useRealtimeSync(queryClient);
  return children;
}

/**
 * Global application providers wrapper for super-admin dashboard.
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @returns {JSX.Element}
 */
export function AppProviders({ children }) {
  return (
    <QueryProvider>
      <RealtimeSubscriber>{children}</RealtimeSubscriber>
    </QueryProvider>
  );
}

export default AppProviders;
