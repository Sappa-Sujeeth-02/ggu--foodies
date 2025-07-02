import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { RestaurantContext } from './context/RestaurantContext';

export const ProtectedRestaurantRoute = () => {
  const { rToken, isAuthenticated } = useContext(RestaurantContext);

  if (rToken && isAuthenticated) {
    return <Outlet />;
  }
  return <Navigate to="/restaurant-login" replace />;
};