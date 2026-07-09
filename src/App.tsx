import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes';
import NotificationToast from './components/NotificationToast';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          <NotificationToast />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
