import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-backgroundLight">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-textSecondary font-semibold">Loading profile details...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (user.role === 'donor') navigate('/donor/dashboard');
    else if (user.role === 'hospital') navigate('/hospital/dashboard');
    else if (user.role === 'admin') navigate('/admin/dashboard');
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
          <span className="font-bold text-lg text-textPrimary tracking-tight">User Profile</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 animate-fade-in-up">
        <div className="bg-white border border-border rounded-xl shadow-card overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-border flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary text-primary font-bold text-2xl flex items-center justify-center">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-textPrimary">{user.name || 'Unnamed User'}</h2>
              <span className="inline-block bg-primary/15 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full mt-1">
                {user.role?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Email Address</span>
                <p className="text-sm font-semibold text-textPrimary">{user.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-textSecondary uppercase tracking-wider">Account Role</span>
                <p className="text-sm font-semibold text-textPrimary capitalize">{user.role}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <Link to="/profile/edit">
                <Button variant="primary">Edit Profile Details</Button>
              </Link>
              <Button variant="secondary" onClick={handleBack}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
