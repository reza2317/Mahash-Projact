import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'maintenance-success';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms
  timestamp: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (type: NotificationType, title: string, message?: string, duration?: number) => string;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  maintenanceSuccess: (title: string, message?: string, duration?: number) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string, duration = 4500): string => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newItem: NotificationItem = {
        id,
        type,
        title,
        message,
        duration,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [newItem, ...prev.slice(0, 4)]); // max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) => showNotification('success', title, message, duration),
    [showNotification]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => showNotification('error', title, message, duration),
    [showNotification]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => showNotification('info', title, message, duration),
    [showNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => showNotification('warning', title, message, duration),
    [showNotification]
  );

  const maintenanceSuccess = useCallback(
    (title: string, message?: string, duration = 6000) => showNotification('maintenance-success', title, message, duration),
    [showNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        success,
        error,
        info,
        warning,
        maintenanceSuccess,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
