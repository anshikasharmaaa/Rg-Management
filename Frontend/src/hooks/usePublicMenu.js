import { useState, useEffect, useCallback, useRef } from "react";
import { getPublicMenu } from "../services/menu.service.js";
import { extractErrorMessage } from "../services/api.js";
import useLiveEvents from "./useLiveEvents.js";

const MENU_EVENTS = [
  "menu_item_created",
  "menu_item_updated",
  "menu_item_deleted",
];

// Public menu straight from MongoDB (/menu/public). Refetches when the admin
// changes the menu (socket, throttled) and ignores out-of-order responses.
const usePublicMenu = ({ search = "", category = "" } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  const fetchMenu = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++reqId.current;
      if (!silent) setLoading(true);
      try {
        const result = await getPublicMenu({
          search: search.trim() || undefined,
          category: category || undefined,
        });
        if (id !== reqId.current) return;
        setItems(result.data.menuItems || []);
        setError("");
      } catch (err) {
        if (id === reqId.current) setError(extractErrorMessage(err));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [search, category],
  );

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useLiveEvents(MENU_EVENTS, () => fetchMenu({ silent: true }));

  return { items, loading, error, refetch: fetchMenu };
};

export default usePublicMenu;
