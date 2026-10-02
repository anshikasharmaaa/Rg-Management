import { useEffect } from "react";
import { getSocket } from "../utils/socket.js";
import useThrottledCallback from "./useThrottledCallback.js";

// Subscribes to socket events and runs `onEvent` (throttled).
// Pass a module-level constant array for `events`.
const useLiveEvents = (
  events,
  onEvent,
  { employeeId = null, delay = 1500 } = {},
) => {
  const throttled = useThrottledCallback(onEvent, delay);
  const key = events.join("|");

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const join = () => {
      if (employeeId) socket.emit("join", { role: "employee", id: employeeId });
    };
    socket.on("connect", join);
    if (socket.connected) join();

    const list = key.split("|");
    list.forEach((name) => socket.on(name, throttled));

    return () => {
      socket.off("connect", join);
      list.forEach((name) => socket.off(name, throttled));
    };
  }, [key, throttled, employeeId]);
};

export default useLiveEvents;
