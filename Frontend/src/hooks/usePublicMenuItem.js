import { useState, useEffect, useCallback, useRef } from "react";
import { getPublicMenuItem } from "../services/menu.service.js";
import { extractErrorMessage } from "../services/api.js";
import useLiveEvents from "./useLiveEvents.js";

const MENU_EVENTS = [
  "menu_item_created",
  "menu_item_updated",
  "menu_item_deleted",
];

// One public menu item for /menu/:id. Refetches when the admin changes the
// menu (so edits/deletes show up live) and ignores out-of-order responses.
const usePublicMenuItem = (id) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const reqId = useRef(0);

  const fetchItem = useCallback(
    async ({ silent = false } = {}) => {
      const current = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getPublicMenuItem(id);
        if (current !== reqId.current) return;
        setItem(result.data.menuItem);
        setNotFound(false);
        setError("");
      } catch (err) {
        if (current !== reqId.current) return;
        if (err.response?.status === 404) {
          setItem(null);
          setNotFound(true);
          setError("");
        } else {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (current === reqId.current) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  useLiveEvents(MENU_EVENTS, () => fetchItem({ silent: true }));

  return { item, loading, error, notFound };
};

export default usePublicMenuItem;
