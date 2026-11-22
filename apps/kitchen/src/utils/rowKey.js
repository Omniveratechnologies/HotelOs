let keyCounter = 0;

export function createRowKey(prefix = "row") {
  keyCounter += 1;
  return `${prefix}-${Date.now()}-${keyCounter}`;
}

export function addRowKeys(items = [], prefix = "row") {
  return items.map((item) => ({
    ...item,
    clientKey: item.clientKey || createRowKey(prefix),
  }));
}

export function stripRowKeys(items = []) {
  return items.map((item) => {
    const { clientKey: _, ...rest } = item;
    return rest;
  });
}

export function keyById(items = [], idField = "_id") {
  return items.map((item) => ({
    ...item,
    clientKey: item[idField] || createRowKey("item"),
  }));
}