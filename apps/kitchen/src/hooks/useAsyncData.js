import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncData(load, deps = [], opts = {}) {
  const { enabled = true, keepPreviousData = false } = opts;

  const [state, setState] = useState({ key: null, data: null, error: "" });
  const [version, setVersion] = useState(0);
  const key = `${version}:${JSON.stringify(deps)}`;

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const controllerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    let active = true;

    loadRef
      .current(controller.signal)
      .then((data) => {
        if (active) setState({ key, data, error: "" });
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") {
          setState({ key, data: null, error: err.message });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [key, enabled]);

  const refresh = useCallback((refreshOpts = {}) => {
    if (refreshOpts.silent) {
      setVersion((v) => v + 1);
    } else {
      setState((prev) => ({ ...prev, data: null, error: "" }));
      setVersion((v) => v + 1);
    }
  }, []);

  const setData = useCallback((next) => {
    setState((prev) => ({
      ...prev,
      data: typeof next === "function" ? next(prev.data) : next,
    }));
  }, []);

  const setError = useCallback((message) => {
    setState((prev) => ({ ...prev, error: message }));
  }, []);

  const isLoading = keepPreviousData ? state.key !== key && state.data === null : state.key !== key;

  return {
    data: state.data,
    error: state.error,
    loading: isLoading,
    refresh,
    setData,
    setError,
  };
}