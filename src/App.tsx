import React from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AppRoutes from './routes';
import NotificationToast from './components/NotificationToast';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
          <NotificationToast />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
