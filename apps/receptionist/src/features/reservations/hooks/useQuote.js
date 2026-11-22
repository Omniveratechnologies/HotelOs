import { useMutation } from "@hotelos/query";
import { reservationsApi } from "@hotelos/api";

/**
 * Live pricing quote for the booking summary. Debounce the trigger in the
 * caller (e.g. via useEffect on form values).
 *
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useQuote() {
  return useMutation({
    mutationFn: (payload) => reservationsApi.getQuote(payload),
  });
}
