import { useState, useEffect, useCallback, useRef } from "react";
import { searchPublicMenu } from "../services/menu.service.js";
import useDebounce from "./useDebounce.js";
import useLiveEvents from "./useLiveEvents.js";

const MENU_EVENTS = [
  "menu_item_created",
  "menu_item_updated",
  "menu_item_deleted",
];

const DEBOUNCE_MS = 350;

const isCancelled = (err) =>
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.name === "AbortError";

// Debounced menu search against /menu/public/search.
//  - no request for an empty query
//  - previous in-flight request is aborted when a new one starts / on unmount
//  - refreshes silently when the admin changes the menu while results are showing
// status: "idle" | "loading" | "success" | "error"
const useMenuSearch = (query) => {
  const trimmed = query.trim();
  const term = useDebounce(trimmed, DEBOUNCE_MS);

  const [state, setState] = useState({ results: [], status: "idle" });
  const controllerRef = useRef(null);
  const termRef = useRef(term);

  useEffect(() => {
    termRef.current = term;
  }, [term]);

  const run = useCallback(async (searchTerm, { silent = false } = {}) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (!silent) setState((prev) => ({ ...prev, status: "loading" }));

    try {
      const result = await searchPublicMenu(searchTerm, {
        signal: controller.signal,
      });
      if (controllerRef.current !== controller) return;
      setState({ results: result.data.menuItems || [], status: "success" });
    } catch (err) {
      if (isCancelled(err) || controllerRef.current !== controller) return;
      // A failed background refresh keeps the results already on screen.
      if (silent) return;
      setState((prev) => ({ ...prev, status: "error" }));
    }
  }, []);

  useEffect(() => {
    if (!term) {
      controllerRef.current?.abort();
      setState((prev) =>
        prev.status === "idle" && prev.results.length === 0
          ? prev
          : { results: [], status: "idle" },
      );
      return;
    }
    run(term);
  }, [term, run]);

  // Abort whatever is in flight when the panel closes.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const refresh = useCallback(() => {
    if (termRef.current) run(termRef.current, { silent: true });
  }, [run]);

  useLiveEvents(MENU_EVENTS, refresh);

  const retry = useCallback(() => {
    if (termRef.current) run(termRef.current);
  }, [run]);

  // While the user is typing (debounce pending) or a request is running, show
  // loading; never flash "idle" or stale results for a non-empty query.
  let status = state.status;
  if (!trimmed) status = "idle";
  else if (trimmed !== term || state.status === "idle") status = "loading";

  return {
    results: status === "success" ? state.results : [],
    status,
    retry,
  };
};

export default useMenuSearch;
