/**
 * Inserts or updates an item in a cached query list by ID.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient - QueryClient instance
 * @param {Array<string|object>} queryKey - Target query key
 * @param {object} newItem - Item to insert or update
 * @param {string} [idField='id'] - Key field used for identification
 */
export function upsertItemInList(
  queryClient,
  queryKey,
  newItem,
  idField = "id",
) {
  queryClient.setQueryData(queryKey, (oldData) => {
    if (!oldData) return [newItem];
    if (!Array.isArray(oldData)) return oldData;

    const index = oldData.findIndex(
      (item) =>
        item[idField] === newItem[idField] ||
        (item._id && newItem._id && item._id === newItem._id),
    );

    if (index === -1) {
      return [newItem, ...oldData];
    }

    const copy = [...oldData];
    copy[index] = { ...copy[index], ...newItem };
    return copy;
  });
}

/**
 * Removes an item from a cached query list by ID.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient - QueryClient instance
 * @param {Array<string|object>} queryKey - Target query key
 * @param {string|number} itemId - ID of the item to remove
 * @param {string} [idField='id'] - Key field used for identification
 */
export function removeItemFromList(
  queryClient,
  queryKey,
  itemId,
  idField = "id",
) {
  queryClient.setQueryData(queryKey, (oldData) => {
    if (!oldData || !Array.isArray(oldData)) return oldData;
    return oldData.filter(
      (item) => item[idField] !== itemId && item._id !== itemId,
    );
  });
}

/**
 * Applies partial updates to an item in a cached query list by ID.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient - QueryClient instance
 * @param {Array<string|object>} queryKey - Target query key
 * @param {string|number} itemId - ID of the item to update
 * @param {object} updates - Fields to merge into the matched item
 * @param {string} [idField='id'] - Key field used for identification
 */
export function updateItemInList(
  queryClient,
  queryKey,
  itemId,
  updates,
  idField = "id",
) {
  queryClient.setQueryData(queryKey, (oldData) => {
    if (!oldData || !Array.isArray(oldData)) return oldData;
    return oldData.map((item) =>
      item[idField] === itemId || item._id === itemId
        ? { ...item, ...updates }
        : item,
    );
  });
}
