import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationToastContainer from './components/notifications/NotificationToastContainer';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TeamProvider>
          <NotificationProvider>
            <AppRoutes />
            <NotificationToastContainer />
          </NotificationProvider>
        </TeamProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
