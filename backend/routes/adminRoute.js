// adminRoutes.js
import express from 'express';
import {
  adminLogin,
  addRestaurant,
  getRestaurants,
  updateRestaurantAvailability,
  updateRestaurant,
  verifyAdminPassword,
  deleteRestaurant,
  getDashboardStats,
  getDailyOrderTrends,
  getRevenuePerRestaurant,
  getMostSoldItems,
  getRestaurantStats,
  getRestaurantOrders,
  getRestaurantMenu,
  getRestaurantHistory
} from '../controllers/adminController.js';
import authAdmin from '../middlewares/authAdmin.js';

const router = express.Router();

router.post('/admin-login', adminLogin);
router.post('/add-restaurant', authAdmin, addRestaurant);
router.get('/restaurants', authAdmin, getRestaurants);
router.put('/restaurants/:id/availability', authAdmin, updateRestaurantAvailability);
router.put('/restaurants/:id', authAdmin, updateRestaurant);
router.post('/verify-password', authAdmin, verifyAdminPassword);
router.delete('/restaurants/:id', authAdmin, deleteRestaurant);
router.get('/dashboard-stats', authAdmin, getDashboardStats);
router.get('/daily-order-trends', authAdmin, getDailyOrderTrends);
router.get('/revenue-per-restaurant', authAdmin, getRevenuePerRestaurant);
router.get('/most-sold-items', authAdmin, getMostSoldItems);
router.get('/restaurant/:id/stats', authAdmin, getRestaurantStats);
router.get('/restaurant/:id/menu', authAdmin, getRestaurantMenu);
router.get('/restaurant/:id/orders', authAdmin, getRestaurantOrders);
router.get('/restaurant/:id/history', authAdmin, getRestaurantHistory);

export default router;