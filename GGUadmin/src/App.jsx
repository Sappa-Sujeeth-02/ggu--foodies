import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedAdminRoute } from './ProtectedRoutes';

// Admin Panel Components
import Layout from './components/admincomponents/Layout/Layout';
import Dashboard from './pages/adminpages/Dashboard';
import AllRestaurants from './pages/adminpages/AllRestaurants';
import AddRestaurant from './pages/adminpages/AddRestaurant';
import RestaurantDetails from './pages/adminpages/RestaurantDetails';
import AdminLogin from './pages/LogIn/AdminLogin';

function App() {
  const userId = localStorage.getItem('userId');

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/admin-login" replace />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/restaurants" element={<Layout><AllRestaurants /></Layout>} />
          <Route path="/add-restaurant" element={<Layout><AddRestaurant /></Layout>} />
          <Route path="/restaurants/:restaurantId/*" element={<RestaurantDetails />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;