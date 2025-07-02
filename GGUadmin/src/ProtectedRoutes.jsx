import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AdminContext } from './context/AdminContext';

export const ProtectedAdminRoute = () => {
  const { aToken, isAuthenticated } = useContext(AdminContext);

  if (aToken && isAuthenticated) {
    return <Outlet />;
  }
  return <Navigate to="/admin-login" replace />;
};