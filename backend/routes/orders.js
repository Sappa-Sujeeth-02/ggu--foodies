import express from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import FoodItem from '../models/foodItemModel.js';
import authMiddleware from '../middlewares/auth.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import admin from 'firebase-admin';
import restaurantModel from '../models/restaurantModel.js';
import mongoose from 'mongoose';

const router = express.Router();
router.use(authMiddleware);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order and payment
router.post('/create', async (req, res) => {
  const { orderType, subtotal, serviceCharge, total, isPreOrder, slot } = req.body;

  try {
    // Validate request body
    if (!orderType || subtotal === undefined || serviceCharge === undefined || total === undefined) {
      return res.status(400).json({ message: 'Missing required fields: orderType, subtotal, serviceCharge, or total' });
    }
    if (isPreOrder && !slot) {
      return res.status(400).json({ message: 'Slot is required for preorder' });
    }

    // Validate auth
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized: Invalid user' });
    }

    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.foodItemId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or not found' });
    }

    // Validate that all items are available
    const unavailableItems = cart.items.filter(item => !item.foodItemId.availability);
    if (unavailableItems.length > 0) {
      // Remove unavailable items from cart
      for (const item of unavailableItems) {
        cart.items = cart.items.filter(i => i.name !== item.name);
        await cart.save();
      }
      return res.status(400).json({
        message: `The following items are no longer available: ${unavailableItems.map(i => i.name).join(', ')}`,
        items: cart.items,
      });
    }

    // Validate restaurant IDs
    const restaurantIds = [...new Set(cart.items.map(item => item.foodItemId?.restaurantid?.toString()))];
    if (restaurantIds.length > 1 || !restaurantIds[0]) {
      return res.status(400).json({ message: 'All items must be from the same restaurant' });
    }
    const restaurantid = restaurantIds[0];

    // Validate restaurant and its availability
    const restaurant = await restaurantModel.findById(restaurantid).select('availability restaurantname preOrderEnabled slotCapacity');
    if (!restaurant) {
      return res.status(400).json({ message: 'Restaurant not found' });
    }
    if (!isPreOrder && restaurant.availability === false) {
      return res.status(400).json({ message: 'Restaurant is currently closed' });
    }
    if (isPreOrder && !restaurant.preOrderEnabled) {
      return res.status(400).json({ message: 'Preorders are disabled for this restaurant' });
    }
    if (isPreOrder && slot) {
      const slotData = restaurant.slotCapacity.find(s => s.slot === slot);
      if (!slotData) {
        return res.status(400).json({ message: 'Invalid slot' });
      }
      if (slotData.currentOrders >= slotData.maxOrders) {
        return res.status(400).json({ message: `Slot ${slot} is fully booked` });
      }
    }

    console.log('Received from frontend:', { orderType, subtotal, serviceCharge, total, isPreOrder, slot });

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Razorpay configuration missing' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    });

    console.log('Razorpay Order Created:', razorpayOrder);

    const order = {
      userId: req.user.userId,
      restaurantid,
      items: cart.items.map(item => {
        if (!item.foodItemId) {
          throw new Error(`Invalid food item in cart: ${item.name}`);
        }
        return {
          foodItemId: item.foodItemId._id,
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          restaurant: item.restaurant,
        };
      }),
      orderType,
      subtotal,
      serviceCharge,
      total,
      status: 'pending',
      isPreOrder: !!isPreOrder,
      slot: isPreOrder ? slot : '',
    };

    res.status(200).json({
      message: 'Order created successfully',
      order,
      razorpayOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error.stack);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

// Verify payment and save order
router.post('/verify', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, order } = req.body;

    // Validate request body
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Missing required payment or order details' });
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    if (!process.env.RAZORPAY_KEY_SECRET) {
      await session.abortTransaction();
      session.endSession();
      console.error('RAZORPAY_KEY_SECRET not set in environment');
      return res.status(500).json({ message: 'Server configuration error: Missing Razorpay secret' });
    }
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Payment verification failed: Invalid signature' });
    }

    // Validate order fields
    if (!order.userId || !order.restaurantid || !order.items || !order.orderType || order.subtotal == null || order.serviceCharge == null || order.total == null) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid order data: Missing required fields' });
    }

    // Validate restaurant and its availability
    const restaurant = await restaurantModel.findById(order.restaurantid).select('availability restaurantname preOrderEnabled slotCapacity').session(session);
    if (!restaurant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Restaurant not found' });
    }
    if (!order.isPreOrder && restaurant.availability === false) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Restaurant is currently closed' });
    }
    if (order.isPreOrder && !restaurant.preOrderEnabled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Preorders are disabled for this restaurant' });
    }
    if (order.isPreOrder && order.slot) {
      const slotData = restaurant.slotCapacity.find(s => s.slot === order.slot);
      if (!slotData) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Invalid slot' });
      }
      if (slotData.currentOrders >= slotData.maxOrders) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Slot ${order.slot} is fully booked` });
      }
    }

    // Validate that all items are available
    const foodItems = await FoodItem.find({
      _id: { $in: order.items.map(item => item.foodItemId) },
    }).session(session);
    const unavailableItems = foodItems.filter(item => !item.availability);
    if (unavailableItems.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `The following items are no longer available: ${unavailableItems.map(item => item.dishname).join(', ')}`,
      });
    }

    // Increment currentOrders for preorder slot within transaction
    if (order.isPreOrder && order.slot) {
      await restaurantModel.updateOne(
        { _id: order.restaurantid, 'slotCapacity.slot': order.slot },
        { $inc: { 'slotCapacity.$.currentOrders': 1 } },
        { session }
      );
      console.log(`Incremented currentOrders for slot ${order.slot} in restaurant ${order.restaurantid}`);
    }

    // Remove the _id field from the order object
    delete order._id;

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Create and save the order
    const newOrder = new Order({
      ...order,
      status: 'pending',
      createdAt: new Date(),
      otp,
      restaurantid: order.restaurantid,
      isPreOrder: !!order.isPreOrder,
      slot: order.isPreOrder ? order.slot : '',
    });

    await newOrder.save({ session });
    console.log('Order saved:', newOrder._id, newOrder.orderId);

    // Clear the cart
    try {
      const cartDeleteResult = await Cart.deleteOne({ userId: req.user.userId }, { session });
      console.log('Cart deletion result:', cartDeleteResult);
    } catch (error) {
      console.error('Error deleting cart:', error.message, error.stack);
      // Continue even if cart deletion fails
    }

    // Send FCM notification
    try {
      if (restaurant && restaurant.fcmToken) {
        const message = {
          notification: {
            title: `New Order #${newOrder.orderId}`,
            body: `A new ${order.orderType} order has been placed! Total: ₹${order.total}${order.isPreOrder ? ` (Preorder for ${order.slot})` : ''}`,
          },
          token: restaurant.fcmToken,
        };
        await admin.messaging().send(message);
        console.log(`Notification sent to restaurant ${restaurant.restaurantname} for order #${newOrder.orderId}`);
      } else {
        console.warn(`No FCM token found for restaurant ${order.restaurantid}`);
      }
    } catch (error) {
      console.error('Error sending FCM notification:', error.message, error.stack);
      // Continue even if FCM fails
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Payment successful and order created',
      order: newOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Verification Error:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
});

// Cancel order
router.post('/:orderId/cancel', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find the order
    const order = await Order.findOne({ orderId: req.params.orderId }).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorize: Allow user who placed the order or restaurant staff
    if (!req.user || (!req.user.userId && !req.user.restaurantid)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({ message: 'Unauthorized: Invalid user or restaurant' });
    }

    const isUser = req.user.userId && req.user.userId.toString() === order.userId.toString();
    const isRestaurantStaff = req.user.restaurantid && req.user.restaurantid.toString() === order.restaurantid.toString();
    if (!isUser && !isRestaurantStaff) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Forbidden: You are not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Order cannot be cancelled after confirmation' });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save({ session });

    // Decrement currentOrders for preorder slot
    let updatedSlot = null;
    if (order.isPreOrder && order.slot) {
      const restaurant = await restaurantModel.findById(order.restaurantid).session(session);
      if (!restaurant) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Restaurant not found' });
      }
      const slotData = restaurant.slotCapacity.find(s => s.slot === order.slot);
      if (!slotData) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Slot ${order.slot} not found in restaurant ${order.restaurantid}` });
      }
      console.log(`Before update - Slot: ${order.slot}, currentOrders: ${slotData.currentOrders}, Restaurant: ${order.restaurantid}`);
      await restaurantModel.updateOne(
        { _id: order.restaurantid, 'slotCapacity.slot': order.slot },
        { $inc: { 'slotCapacity.$.currentOrders': -1 } },
        { session }
      );
      // Fetch updated restaurant to confirm change
      const updatedRestaurant = await restaurantModel.findById(order.restaurantid).session(session);
      updatedSlot = updatedRestaurant.slotCapacity.find(s => s.slot === order.slot);
      console.log(`After update - Slot: ${order.slot}, currentOrders: ${updatedSlot.currentOrders}, Restaurant: ${order.restaurantid}`);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Order cancelled successfully',
      slot: order.isPreOrder && order.slot ? {
        slot: order.slot,
        currentOrders: updatedSlot ? updatedSlot.currentOrders : null,
      } : null,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling order:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
});

// Update order status
router.put('/:orderId/update-status', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findOne({ orderId }).session(session);
        if (!order) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status === 'cancelled' || order.status === 'completed') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Order cannot be updated' });
        }

        if (status === 'confirmed' && order.status === 'pending') {
            order.confirmedAt = new Date();
        } else if (status === 'preparing' && order.status === 'confirmed') {
            order.preparingAt = new Date();
        } else if (status === 'cancelled') {
            order.cancelledAt = new Date();
            if (order.isPreOrder && order.slot) {
                await restaurantModel.findByIdAndUpdate(
                    order.restaurantid,
                    { $inc: { 'slotCapacity.$[elem].currentOrders': -1 } },
                    { arrayFilters: [{ 'elem.slot': order.slot }], session }
                );
            }
        }

        order.status = status;
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        const populatedOrder = await Order.findOne({ orderId })
            .populate('userId', 'name phone')
            .populate('restaurantid', 'restaurantname address phone')
            .lean();

        res.status(200).json({ message: 'Order status updated', order: populatedOrder });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error updating order status:', error.message, error.stack);
        res.status(500).json({ message: 'Failed to update order status', error: error.message });
    }
});

// Get user orders
router.get('/', async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized: Invalid user' });
    }

    const orders = await Order.find({ userId: req.user.userId })
      .populate('userId', 'name phone')
      .populate('restaurantid', 'restaurantname address phone')
      .lean();

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get user orders error:', error.stack);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

export default router;
