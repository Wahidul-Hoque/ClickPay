'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { notificationAPI } from '@/lib/api';

interface Notification {
  notification_id: string;
  message: string;
  created_at: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getRecent();
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(n => n.notification_id !== notificationId)
      );
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.notification_id}
                      className="p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="text-sm text-gray-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(notification.notification_id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t p-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page
                    window.location.href = '/dashboard/notifications';
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}