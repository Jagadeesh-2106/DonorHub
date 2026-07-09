import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationToast: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();

  const unread = notifications.filter((n) => !n.read_status);

  if (unread.length === 0) return null;

  // Display only most recent unread notification
  const latest = unread[0];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 bg-white/95 backdrop-blur-md border border-border border-l-4 border-l-primary rounded shadow-card p-4 max-w-sm cursor-pointer animate-fade-in-up transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
      onClick={() => markAsRead(latest.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="bg-primary/10 p-1.5 rounded-full text-primary mt-0.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-grow">
          <p className="font-bold text-sm text-textPrimary">{latest.type}</p>
          <p className="text-xs text-textSecondary mt-0.5">{latest.message}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-textSecondary">
              {new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-primary font-medium hover:underline">Click to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
