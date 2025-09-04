import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Register from './Register';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, login } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (!isAuthenticated) {
    return showRegister ? (
      <Register
        onSuccess={login}
        onSwitchToLogin={() => setShowRegister(false)}
      />
    ) : (
      <Login
        onSuccess={login}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;