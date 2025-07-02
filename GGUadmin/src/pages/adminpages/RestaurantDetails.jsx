import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import RestaurantLayout from './RestaurantLayout';
import Overview from './Overview';
import RestaurantMenu from './RestaurantMenu';
import RestaurantOrders from './RestaurantOrders';
import RestaurantHistory from './RestaurantHistory';

function RestaurantDetails() {
  const { restaurantId } = useParams();

  return (
    <RestaurantLayout restaurantId={restaurantId}>
      <Routes>
        <Route path="/" element={<Overview restaurantId={restaurantId} />} />
        <Route path="overview" element={<Overview restaurantId={restaurantId} />} />
        <Route path="menu" element={<RestaurantMenu restaurantId={restaurantId} />} />
        <Route path="orders" element={<RestaurantOrders restaurantId={restaurantId} />} />
        <Route path="history" element={<RestaurantHistory restaurantId={restaurantId} />} />
      </Routes>
    </RestaurantLayout>
  );
}

export default RestaurantDetails;