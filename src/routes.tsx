import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateBloodRequest from './pages/CreateBloodRequest';
import RequestDetails from './pages/RequestDetails';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import DonorListPage from './pages/DonorListPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
  if (user.role === 'hospital') return <Navigate to="/hospital/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Common Redirect Route */}
      <Route path="/dashboard" element={<DashboardRedirect />} />

      {/* Protected Dashboards */}
      <Route
        path="/donor/dashboard"
        element={
          <ProtectedRoute requiredRoles={['donor']}>
            <DonorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hospital/dashboard"
        element={
          <ProtectedRoute requiredRoles={['hospital']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Hospital Blood Request Creation */}
      <Route
        path="/hospital/create-request"
        element={
          <ProtectedRoute requiredRoles={['hospital']}>
            <CreateBloodRequest />
          </ProtectedRoute>
        }
      />

      {/* Hospital Blood Request View Details */}
      <Route
        path="/hospital/request/:id"
        element={
          <ProtectedRoute requiredRoles={['hospital', 'admin']}>
            <RequestDetails />
          </ProtectedRoute>
        }
      />

      {/* Profile Pages */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRoles={['donor', 'hospital', 'admin']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute requiredRoles={['donor', 'hospital', 'admin']}>
            <EditProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Notifications */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute requiredRoles={['donor', 'hospital', 'admin']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Donors List Search */}
      <Route
        path="/donor/list"
        element={
          <ProtectedRoute requiredRoles={['hospital', 'admin']}>
            <DonorListPage />
          </ProtectedRoute>
        }
      />

      {/* Default catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
