import express from 'express';
import authRestaurant from '../middlewares/authRestaurant.js';
import {
  restaurantLogin,
  getRestaurantProfile,
  updateRestaurantProfile,
  verifyRestaurantPassword,
  addFoodItem,
  getRestaurantMenu,
  updateFoodItem,
  deleteFoodItem,
  getAllRestaurantsPublic,
  getAllFoodItems,
  getRestaurantOrders,
  acceptOrder,
  cancelOrder,
  startPreparingOrder,
  markOrderPrepared,
  completeOrder,
  updateRestaurantAvailability,
  updatePreOrderEnabled,
  updateSlotCapacity,
  getDashboardData,
  rateFoodItem,
  updateCategoryAvailability,
  getFoodItemDetails,
  restaurantResetPassword,
} from '../controllers/restaurantController.js';
import { saveRestaurantFcmToken } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/restaurant-login', restaurantLogin);
router.get('/profile', authRestaurant, getRestaurantProfile);
router.put('/profile', authRestaurant, updateRestaurantProfile);
router.post('/restaurant-reset-password', restaurantResetPassword);
router.post('/verify-password', authRestaurant, verifyRestaurantPassword);
router.post('/menu', authRestaurant, addFoodItem);
router.get('/menu', authRestaurant, getRestaurantMenu);
router.put('/menu/:foodItemId', authRestaurant, updateFoodItem);
router.delete('/menu/:foodItemId', authRestaurant, deleteFoodItem);
router.get('/restaurants', getAllRestaurantsPublic);
router.get('/all-food-items', getAllFoodItems);
router.get('/orders', authRestaurant, getRestaurantOrders);
router.put('/orders/accept/:orderId', authRestaurant, acceptOrder);
router.put('/orders/cancel/:orderId', authRestaurant, cancelOrder);
router.put('/orders/prepare/:orderId', authRestaurant, startPreparingOrder);
router.put('/orders/prepared/:orderId', authRestaurant, markOrderPrepared);
router.put('/orders/complete/:orderId', authRestaurant, completeOrder);
router.put('/availability', authRestaurant, updateRestaurantAvailability);
router.put('/preorder-enabled', authRestaurant, updatePreOrderEnabled);
router.put('/slot-capacity', authRestaurant, updateSlotCapacity);
router.get('/dashboard', authRestaurant, getDashboardData);
router.post('/rate-food-item', authRestaurant, rateFoodItem);
router.put('/menu/category/:category', authRestaurant, updateCategoryAvailability);
router.post('/save-fcm-token', authRestaurant, saveRestaurantFcmToken);
router.get('/food-item/:foodItemId/details', authRestaurant, getFoodItemDetails);

export default router;