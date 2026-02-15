'use client';

import { useState, useEffect } from 'react';
import { Bell, Trash2, RefreshCw } from 'lucide-react';
import { notificationAPI } from '@/lib/api';

interface Notification {
  notification_id: string;
  message: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(page, 20);
      setNotifications(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    
    try {
      await notificationAPI.clearAll();
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">All your activity notifications</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p>No notifications</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between group"
              >
                <div className="flex-1">
                  <p className="text-gray-900">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTime(notification.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(notification.notification_id)}
                  className="ml-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}