import { useCallback, useEffect, useState } from "react";
import { getMenuItems } from "../services/menu.js";

export default function useMenuItems() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setItems(await getMenuItems());
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);
  return { items, setItems, reload, error };
}
