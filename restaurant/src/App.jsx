import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRestaurantRoute } from './ProtectedRoutes';
import PushNotificationSetup from './components/PushNotificationSetUp';
import NotificationHandler from './components/NotificationHandler';
import { useRestaurantContext } from './context/RestaurantContext';
import AdminPanel from './pages/LogIn/AdminPanel';
import RestaurantLogin from './pages/LogIn/RestaurantLogin';
import RestaurantForgotPassword from './pages/LogIn/RestaurantForgotPassword'; // New import

// Restaurant Panel Components
import RestoDashboard from './components/restaurantscomponents/Dashboard';
import Menu from './components/restaurantscomponents/Menu';
import AddFoodItem from './components/restaurantscomponents/AddFoodItem';
import Orders from './components/restaurantscomponents/Orders';
import Preorders from './components/restaurantscomponents/PreOrders';
import History from './components/restaurantscomponents/History';
import Sidebar from './components/restaurantscomponents/Layout/Sidebar';
import Header from './components/restaurantscomponents/Layout/Header';
import ProfilePage from './components/restaurantscomponents/ProfileModal';
import Analysis from './components/restaurantscomponents/Analysis';
import FoodItemDetails from './components/restaurantscomponents/FoodItemDetails';

function RestaurantAppContent() {
  const { restaurant } = useRestaurantContext();

  return (
    <div className="min-h-screen bg-white flex text-black lg:pl-64">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<RestoDashboard />} />
            <Route path="menu" element={<Menu />} />
            <Route path="menu/:foodItemId" element={<FoodItemDetails />} />
            <Route path="add-item" element={<AddFoodItem />} />
            <Route path="orders" element={<Orders />} />
            <Route path="preorders" element={<Preorders />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="analysis" element={<Analysis />} />
          </Routes>
        </main>
      </div>
      {restaurant?._id && <PushNotificationSetup userId={restaurant._id} />}
      <NotificationHandler />
    </div>
  );
}

function App() {
  const userId = localStorage.getItem('userId');
  const isRestaurantUser = localStorage.getItem('rToken');

  return (
    <>
      <NotificationHandler />
      <Routes>
        <Route path="/" element={<AdminPanel />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/restaurant-login" element={<RestaurantLogin />} />
        <Route path="/restaurant-forgot-password" element={<RestaurantForgotPassword />} /> {/* New route */}
        <Route element={<ProtectedRestaurantRoute />}>
          <Route
            path="/restaurant-dashboard/*"
            element={<RestaurantAppContent />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;