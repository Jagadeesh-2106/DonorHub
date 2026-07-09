import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import Button from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NotificationsPage: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (user?.role === 'donor') navigate('/donor/dashboard');
    else if (user?.role === 'hospital') navigate('/hospital/dashboard');
    else if (user?.role === 'admin') navigate('/admin/dashboard');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-backgroundLight font-sans">
      <header className="bg-white border-b border-border shadow-subtle px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button onClick={handleBack} className="text-textSecondary hover:text-primary transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <span className="font-bold text-lg text-textPrimary tracking-tight">Notifications Log</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6 animate-fade-in-up">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-textPrimary">Your Alerts</h1>
            <p className="text-textSecondary text-sm mt-0.5">Real-time status updates of compatible requests and response updates.</p>
          </div>
          <Button variant="secondary" onClick={handleBack} className="text-xs py-1.5 px-3">
            Back to Dashboard
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white border border-border p-12 rounded-xl text-center text-textSecondary shadow-subtle">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-textSecondary">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-semibold text-textPrimary">All Caught Up!</p>
            <p className="text-xs mt-1">You have no active or unread alerts in your tray.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-5 rounded-xl border flex justify-between items-center transition-all duration-200 shadow-subtle ${
                  notification.read_status
                    ? 'bg-white border-border'
                    : 'bg-primary/5 border-primary/20 border-l-4 border-l-primary'
                }`}
              >
                <div className="space-y-1 pr-4">
                  <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider block">
                    {notification.type}
                  </span>
                  <p className={`text-sm ${notification.read_status ? 'text-textSecondary' : 'text-textPrimary font-semibold'}`}>
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-textSecondary block">
                    {new Date(notification.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                {!notification.read_status && (
                  <Button onClick={() => markAsRead(notification.id)} variant="secondary" className="text-xs py-1.5 px-3 whitespace-nowrap">
                    Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default NotificationsPage;
