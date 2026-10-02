import { createContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getNotifications as getNotificationsService,
  markNotificationRead as markNotificationReadService,
  markAllNotificationsRead as markAllNotificationsReadService,
  deleteNotification as deleteNotificationService,
} from "../services/notification.service.js";
import { getSocket } from "../utils/socket.js";
import { playNotificationSound } from "../utils/notificationSound.js";

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ role = "admin", children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotificationsService();
      setNotifications(result.data.notifications);
      setUnreadCount(result.data.unreadCount);
    } catch (error) {
      console.error("Fetch notifications failed:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      socket.emit("join", { role });
    };

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    };

    socket.on("connect", handleConnect);
    socket.on("notification", handleNotification);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification", handleNotification);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const markAsRead = async (id) => {
    try {
      await markNotificationReadService(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Mark as read failed:", error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsReadService();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read failed:", error.message);
    }
  };

  const removeNotification = async (id) => {
    try {
      await deleteNotificationService(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (error) {
      console.error("Delete notification failed:", error.message);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
