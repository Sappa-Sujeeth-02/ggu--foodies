import express from 'express';
import Cart from '../models/Cart.js';
import FoodItem from '../models/foodItemModel.js';
import restaurantModel from '../models/restaurantModel.js';
import authMiddleware from '../middlewares/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Add item to cart
router.post('/add', async (req, res) => {
  const { foodItemId, quantity } = req.body;

  try {
    // Validate food item
    const foodItem = await FoodItem.findById(foodItemId).populate('restaurantid', 'restaurantname availability');
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }
    if (foodItem.availability === false) {
      return res.status(400).json({ message: `Food item "${foodItem.dishname}" is not available` });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      cart = new Cart({ userId: req.user.userId, items: [] });
    }

    // Check if cart already has items and enforce same food court rule
    if (cart.items.length > 0) {
      const existingCourt = cart.items[0].restaurant;
      const newItemCourt = foodItem.restaurantid?.restaurantname;
      if (existingCourt !== newItemCourt) {
        return res.status(400).json({ message: 'Add items from the same food court only.' });
      }
    }

    // Check if item already exists in cart
    const itemIndex = cart.items.findIndex(item => item.foodItemId.toString() === foodItemId);
    if (itemIndex >= 0) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({
        foodItemId,
        name: foodItem.dishname,
        description: foodItem.description,
        price: foodItem.dineinPrice,
        takeawayPrice: foodItem.takeawayPrice,
        quantity,
        image: foodItem.dishphoto,
        restaurant: foodItem.restaurantid?.restaurantname || 'Unknown Restaurant',
        isAvailable: foodItem.availability !== false,
      });
    }

    await cart.save();
    res.status(200).json({ message: 'Item added to cart', items: cart.items });
  } catch (error) {
    console.error('Error adding to cart:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

// Update item quantity
router.put('/update/:itemName', async (req, res) => {
  const { quantity } = req.body;
  const itemName = decodeURIComponent(req.params.itemName);

  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.foodItemId');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.name === itemName);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    const foodItem = cart.items[itemIndex].foodItemId;
    if (!foodItem) {
      console.error(`Food item not found for cart item: ${itemName}`);
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return res.status(400).json({ message: `Item "${itemName}" is no longer valid and has been removed from cart`, items: cart.items });
    }

    if (foodItem.availability === false) {
      console.warn(`Item "${itemName}" is unavailable`);
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return res.status(400).json({ message: `Item "${itemName}" is no longer available and has been removed from cart`, items: cart.items });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].isAvailable = foodItem.availability !== false;
    }

    await cart.save();
    res.status(200).json({ message: 'Cart updated', items: cart.items });
  } catch (error) {
    console.error('Error updating cart:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemName', async (req, res) => {
  const itemName = decodeURIComponent(req.params.itemName);

  try {
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.name !== itemName);
    await cart.save();
    res.status(200).json({ message: 'Item removed from cart', items: cart.items });
  } catch (error) {
    console.error('Error removing item from cart:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
});

// Get cart
router.get('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate('items.foodItemId', 'dishname availability dineinPrice takeawayPrice dishphoto restaurantid');
    if (!cart) {
      return res.status(200).json({ items: [], restaurantIsOpen: true });
    }
    // Add isAvailable field and fetch restaurant status
    let restaurantIsOpen = true;
    if (cart.items.length > 0) {
      const restaurantId = cart.items[0].foodItemId?.restaurantid;
      if (restaurantId) {
        const restaurant = await restaurantModel.findById(restaurantId).select('availability');
        if (restaurant) {
          restaurantIsOpen = restaurant.availability !== false; // Use restaurant's availability field
          if (!restaurantIsOpen) {
            console.log(`Restaurant ${restaurantId} is closed (availability: ${restaurant.availability})`);
          }
        } else {
          console.warn(`Restaurant not found for ID: ${restaurantId}`);
        }
      }
    }
    const cartItems = cart.items.map(item => {
      if (!item.foodItemId) {
        console.warn(`Missing foodItemId for cart item: ${item.name}`);
        return null;
      }
      return {
        foodItemId: item.foodItemId._id,
        name: item.name,
        description: item.description,
        price: item.price,
        takeawayPrice: item.takeawayPrice,
        quantity: item.quantity,
        image: item.image,
        restaurant: item.restaurant,
        isAvailable: item.foodItemId.availability !== false,
      };
    }).filter(item => item !== null);
    res.status(200).json({ items: cartItems, restaurantIsOpen });
  } catch (error) {
    console.error('Error fetching cart:', error.message, error.stack);
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

export default router;