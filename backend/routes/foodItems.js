import express from 'express';
import FoodItem from '../models/foodItemModel.js';
import Order from '../models/Order.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/ratings', async (req, res) => {
    console.log('Received POST request to /api/food-items/ratings:', req.body);
    const { orderId, ratings } = req.body;
    const userId = req.user.userId;
    console.log('Authenticated userId:', userId, 'Order ID:', orderId, 'orderId type:', typeof orderId);

    try {
        const order = await Order.findOne({ orderId: Number(orderId), userId }).catch(err => {
            console.error('Order query error:', err);
            throw err;
        });
        console.log('Found order:', order);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'completed') {
            return res.status(400).json({ message: 'Order must be completed to submit ratings' });
        }

        if (order.hasRated) {
            return res.status(400).json({ message: 'You have already rated this order' });
        }

        const foodItemIds = order.items.map((item) => item.foodItemId);
        console.log('Querying FoodItem with _ids:', foodItemIds);
        const foodItems = await FoodItem.find({ _id: { $in: foodItemIds } }).catch(err => {
            console.error('FoodItem query error:', err);
            throw err;
        });
        console.log('Found food items:', foodItems.map(item => ({ _id: item._id.toString(), foodItemId: item.foodItemId })));

        for (const { foodItemId, rating } of ratings) {
            const foodItem = foodItems.find((item) => item._id.toString() === foodItemId);
            if (!foodItem) {
                console.log('Food item not found:', foodItemId);
                return res.status(404).json({ message: `Food item ${foodItemId} not found` });
            }

            // Add new rating without checking for existing user rating
            foodItem.userRatings.push({ userId, rating });
            foodItem.ratingsCount += 1;

            const totalRatings = foodItem.userRatings.reduce((sum, r) => sum + r.rating, 0);
            foodItem.rating = Number((totalRatings / foodItem.userRatings.length).toFixed(2));

            await foodItem.save();
        }

        order.hasRated = true;
        await order.save();

        res.status(200).json({ message: 'Ratings submitted successfully' });
    } catch (error) {
        console.error('Error submitting ratings:', error);
        res.status(500).json({ message: 'Failed to submit ratings', error: error.message });
    }
});

router.get('/ratings/:orderId', async (req, res) => {
    console.log('Received GET request to /api/food-items/ratings/:orderId:', req.params);
    const { orderId } = req.params;
    const userId = req.user.userId;
    console.log('Authenticated userId:', userId, 'Order ID:', orderId, 'orderId type:', typeof orderId);

    try {
        const order = await Order.findOne({ orderId: Number(orderId), userId }).catch(err => {
            console.error('Order query error:', err);
            throw err;
        });
        console.log('Found order:', order);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const foodItemIds = order.items.map((item) => item.foodItemId);
        console.log('Querying FoodItem with _ids:', foodItemIds);
        const foodItems = await FoodItem.find({ _id: { $in: foodItemIds } }).catch(err => {
            console.error('FoodItem query error:', err);
            throw err;
        });
        console.log('Found food items:', foodItems.map(item => ({ _id: item._id.toString(), foodItemId: item.foodItemId })));

        const hasRatedInFoodItems = foodItems.some((item) =>
            item.userRatings.some((rating) => rating.userId.toString() === userId.toString())
        );

        const hasRated = order.hasRated || hasRatedInFoodItems;

        res.status(200).json({ hasRated });
    } catch (error) {
        console.error('Error checking ratings:', error);
        res.status(500).json({ message: 'Failed to check ratings', error: error.message });
    }
});

export default router;