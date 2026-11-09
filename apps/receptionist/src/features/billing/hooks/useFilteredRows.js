import { useMemo, useState } from "react";

export function useFilteredRows(rows) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query),
    );
  }, [rows, search]);
  return { search, setSearch, filtered };
}
