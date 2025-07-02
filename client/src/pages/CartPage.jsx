import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Payment from '../components/Payment';
import {
  HiArrowLeft,
  HiPlus,
  HiMinus,
  HiTrash,
  HiX,
  HiCheck,
  HiExclamationCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const CartPage = () => {
  const { cartItems, updateCart } = useContext(AuthContext);
  const [orderMode, setOrderMode] = useState('instant');
  const [orderType, setOrderType] = useState('dining');
  const [showRulesPopup, setShowRulesPopup] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [foodItems, setFoodItems] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [preOrderEnabled, setPreOrderEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const foodResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/restaurant/all-food-items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (foodResponse.data.success) {
          setFoodItems(foodResponse.data.foodItems || []);
        } else {
          throw new Error('Failed to fetch food items');
        }

        const cartResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cart = cartResponse.data;
        console.log('Cart Response:', cart);

        if (cart.items && cart.items.length > 0) {
          setRestaurantIsOpen(cart.restaurantIsOpen !== false);
          const unavailableItems = cart.items.filter(item => item.isAvailable === false);
          console.log('Unavailable Items:', unavailableItems);
          if (unavailableItems.length > 0) {
            const unavailableNames = unavailableItems.map(item => item.name).join(', ');
            for (const item of unavailableItems) {
              await removeItem(item.name);
            }
            updateCart(cart.items.filter(item => item.isAvailable !== false));
            toast.error(`${unavailableNames} ${unavailableItems.length > 1 ? 'are' : 'is'} no longer available and ${unavailableItems.length > 1 ? 'have' : 'has'} been removed from your cart.`);
          } else {
            updateCart(cart.items);
          }

          const firstItemRestaurant = cart.items[0]?.restaurant;
          if (firstItemRestaurant) {
            const restaurantResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/restaurant/restaurants`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const restaurant = restaurantResponse.data.restaurants.find(
              (r) => r.restaurantname === firstItemRestaurant
            );
            if (restaurant) {
              setRestaurantId(restaurant.restaurantid);
              setSlots(restaurant.slotCapacity || []);
              setPreOrderEnabled(restaurant.preOrderEnabled || false);
              if (!restaurant.preOrderEnabled) {
                setOrderMode('instant');
                setSelectedSlot('');
              }
            } else {
              console.warn('Restaurant not found for:', firstItemRestaurant);
              toast.error('Restaurant not found for cart items.');
            }
          }
        } else {
          updateCart([]);
          setRestaurantId('');
          setSlots([]);
          setPreOrderEnabled(false);
          setOrderMode('instant');
          setSelectedSlot('');
          setRestaurantIsOpen(true);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch data:', error.response?.data || error.message);
          toast.error(error.response?.data?.message || 'Failed to load cart data. Please try again.');
          setFoodItems([]);
          setSlots([]);
          setPreOrderEnabled(false);
          setRestaurantIsOpen(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    const pollingInterval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const token = localStorage.getItem('token');
        const cartResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cart = cartResponse.data;
        console.log('Polling Cart Response:', cart);

        if (cart.items && cart.items.length > 0) {
          setRestaurantIsOpen(cart.restaurantIsOpen !== false);
          const unavailableItems = cart.items.filter(item => item.isAvailable === false);
          console.log('Polling Unavailable Items:', unavailableItems);
          if (unavailableItems.length > 0) {
            const unavailableNames = unavailableItems.map(item => item.name).join(', ');
            for (const item of unavailableItems) {
              await removeItem(item.name);
            }
            updateCart(cart.items.filter(item => item.isAvailable !== false));
            toast.error(`${unavailableNames} ${unavailableItems.length > 1 ? 'are' : 'is'} no longer available and ${unavailableItems.length > 1 ? 'have' : 'has'} been removed from your cart.`);
          }
        } else {
          updateCart([]);
          setRestaurantId('');
          setSlots([]);
          setPreOrderEnabled(false);
          setOrderMode('instant');
          setSelectedSlot('');
          setRestaurantIsOpen(true);
        }

        if (orderMode === 'preorder' && restaurantId && preOrderEnabled) {
          const restaurantResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/restaurant/restaurants`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const restaurant = restaurantResponse.data.restaurants.find(
            (r) => r.restaurantid === restaurantId
          );
          if (restaurant) {
            setSlots(restaurant.slotCapacity || []);
            setPreOrderEnabled(restaurant.preOrderEnabled || false);
            const selectedSlotData = restaurant.slotCapacity.find((s) => s.slot === selectedSlot);
            if (!restaurant.preOrderEnabled || (selectedSlot && (!selectedSlotData || selectedSlotData.maxOrders - selectedSlotData.currentOrders <= 0))) {
              setSelectedSlot('');
              setOrderMode('instant');
              toast.error(
                !restaurant.preOrderEnabled
                  ? 'Currently not accepting preorders'
                  : `Slot ${selectedSlot} is now full. Please select another slot.`
              );
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to poll data:', error.response?.data || error.message);
          toast.error(error.response?.data?.message || 'Failed to update cart. Please refresh the page.');
        }
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
    };
  }, [orderMode, restaurantId, preOrderEnabled, selectedSlot]);

  const updateQuantity = async (itemName, newQuantity) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/update/${encodeURIComponent(itemName)}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Update Quantity Response:', response.data);
      updateCart(response.data.items);
      if (newQuantity === 0) {
        toast.success('Item removed from cart');
      }
    } catch (error) {
      console.error('Update Quantity Error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to update cart');
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemName) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/cart/remove/${encodeURIComponent(itemName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Remove Item Response:', response.data);
      updateCart(response.data.items);
    } catch (error) {
      console.error('Remove Item Error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateItemPrice = (item) => {
    const foodItem = foodItems.find((fi) => fi.dishname === item.name);
    const basePrice = item.price * item.quantity;
    const takeawayAddOn = orderType === 'takeaway' && foodItem ? foodItem.takeawayPrice * item.quantity : 0;
    return basePrice + takeawayAddOn;
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const calculateServiceCharge = () => {
    return cartItems.reduce((total, item) => {
      const foodItem = foodItems.find((fi) => fi.dishname === item.name);
      return total + (orderType === 'takeaway' && foodItem ? foodItem.takeawayPrice * item.quantity : 0);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateServiceCharge();
  };

  const handleContinue = async () => {
    if ((orderMode === 'instant' || orderMode === 'preorder') && !orderType) {
      toast.error('Please select an order type (Dining or Takeaway)');
      return;
    }
    if (orderMode === 'preorder' && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const cartResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cart = cartResponse.data;
      console.log('Continue Cart Response:', cart);

      if (orderMode === 'instant' && !cart.restaurantIsOpen) {
        toast.error('Restaurant is currently closed. Please try again when the restaurant is open.');
        return;
      }

      const unavailableItems = cart.items.filter(item => item.isAvailable === false);
      if (unavailableItems.length > 0) {
        const unavailableNames = unavailableItems.map(item => item.name).join(', ');
        for (const item of unavailableItems) {
          await removeItem(item.name);
        }
        updateCart(cart.items.filter(item => item.isAvailable !== false));
        toast.error(`${unavailableNames} ${unavailableItems.length > 1 ? 'are' : 'is'} no longer available and ${unavailableItems.length > 1 ? 'have' : 'has'} been removed from your cart.`);
        return;
      }

      setShowRulesPopup(true);
    } catch (error) {
      console.error('Continue Error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to validate cart items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setShowRulesPopup(false);
    setShowPayment(true);
  };

  const alertIcon = <HiExclamationCircle className="w-5 h-5 text-red-600" />;

  const rules = [
    {
      icon: alertIcon,
      text: orderType === 'takeaway'
        ? 'Takeaway charges vary per item based on the food court pricing.'
        : 'No additional charges for dining.',
    },
    {
      icon: alertIcon,
      text: orderType === 'dining'
        ? 'If dining, please be at the food court 5 minutes before your scheduled time.'
        : 'Please arrive on time for takeaway pickup.',
    },
    {
      icon: alertIcon,
      text: 'Cancellation is allowed only until the order is confirmed by the food court. Once the order is confirmed, cancellation will no longer be possible.',
    },
    {
      icon: alertIcon,
      text: 'In case of a valid cancellation, the refund amount will be credited to your account within 2–3 business days.',
    },
    {
      icon: alertIcon,
      text: 'If you are late, food quality may decrease as it cools down. We will not be responsible for temperature-related quality issues.',
    },
    {
      icon: alertIcon,
      text: (
        <span>
          Please verify your mobile number before proceeding to payment.{' '}
          <Link
            to="/profile"
            className="text-red-600 underline hover:text-red-700"
            onClick={() => setShowRulesPopup(false)}
          >
            Check the number
          </Link>
        </span>
      ),
    },
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiTrash className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
          <Link
            to="/home"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/home"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiArrowLeft className="w-6 h-6 text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
            </div>
            <span className="text-sm text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => {
                setOrderMode('instant');
                setSelectedSlot('');
              }}
              className={`px-4 py-2 rounded-lg ${orderMode === 'instant' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              disabled={isLoading}
            >
              Instant
            </button>
            <button
              onClick={() => {
                if (preOrderEnabled) {
                  setOrderMode('preorder');
                  setSelectedSlot('');
                } else {
                  toast.error('Currently not accepting preorders');
                }
              }}
              className={`px-4 py-2 rounded-lg ${
                preOrderEnabled
                  ? orderMode === 'preorder'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
              disabled={!preOrderEnabled || isLoading}
            >
              Preorder
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="text-center py-4">
            <p className="text-gray-600">Updating cart...</p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => {
                const foodItem = foodItems.find((fi) => fi.dishname === item.name);
                const basePrice = item.price * item.quantity;
                const takeawayAddOn = orderType === 'takeaway' && foodItem ? foodItem.takeawayPrice * item.quantity : 0;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                            <p className="text-sm text-gray-600">{item.restaurant}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.name)}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isLoading}
                          >
                            <HiTrash className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-red-600">₹{basePrice}</span>
                            {takeawayAddOn > 0 && (
                              <span className="text-sm text-gray-600">+ ₹{takeawayAddOn}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.name, item.quantity - 1)}
                              className="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center transition-colors"
                              disabled={isLoading}
                            >
                              <HiMinus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="font-semibold text-gray-800 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.name, item.quantity + 1)}
                              className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                              disabled={isLoading}
                            >
                              <HiPlus className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Order Type</h3>
                {(orderMode === 'instant' || (orderMode === 'preorder' && preOrderEnabled)) && (
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="orderType"
                        value="dining"
                        checked={orderType === 'dining'}
                        onChange={() => setOrderType('dining')}
                        className="mr-3 text-red-600 focus:ring-red-500"
                        disabled={isLoading}
                      />
                      <div>
                        <span className="font-medium text-gray-800">Dining</span>
                        <p className="text-sm text-gray-600">Eat at the food court (No extra charge)</p>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="orderType"
                        value="takeaway"
                        checked={orderType === 'takeaway'}
                        onChange={() => setOrderType('takeaway')}
                        className="mr-3 text-red-600 focus:ring-red-500"
                        disabled={isLoading}
                      />
                      <div>
                        <span className="font-medium text-gray-800">Takeaway</span>
                        <p className="text-sm text-gray-600">Pick up and go (Additional charges may apply)</p>
                      </div>
                    </label>
                  </div>
                )}
                {orderMode === 'preorder' && preOrderEnabled && slots.length > 0 ? (
                  <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                    {slots.map((slot, index) => {
                      const availableSlots = slot.maxOrders - slot.currentOrders;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot(slot.slot)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            selectedSlot === slot.slot
                              ? 'bg-red-600 text-white'
                              : availableSlots > 0
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          }`}
                          disabled={availableSlots <= 0 || isLoading}
                        >
                          {slot.slot} ({availableSlots} slots left)
                        </button>
                      );
                    })}
                  </div>
                ) : orderMode === 'preorder' && !preOrderEnabled ? (
                  <p className="mt-4 text-sm text-gray-600">Preorders are currently disabled for this restaurant.</p>
                ) : null}
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{calculateSubtotal()}</span>
                </div>
                {orderType === 'takeaway' && calculateServiceCharge() > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Takeaway charges</span>
                    <span>₹{calculateServiceCharge()}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleContinue}
                disabled={isLoading || !orderType || (orderMode === 'preorder' && !selectedSlot)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  orderType && (orderMode === 'instant' || selectedSlot) && !isLoading
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Checking Availability...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRulesPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Terms & Conditions</h2>
                  <button
                    onClick={() => setShowRulesPopup(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isLoading}
                  >
                    <HiX className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  {rules.map((rule, index) => (
                    <div key={index} className="flex space-x-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">{rule.icon}</div>
                      <p className="text-sm text-gray-700">{rule.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-6">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedRules}
                      onChange={(e) => setAcceptedRules(e.target.checked)}
                      className="mt-1 text-red-600 focus:ring-red-500 rounded"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-600">
                      I have read and accept all the terms and conditions mentioned above
                    </span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRulesPopup(false)}
                    className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!acceptedRules || isLoading}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      acceptedRules && !isLoading
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showPayment && (
        <Payment
          orderType={orderType}
          cartItems={cartItems}
          subtotal={calculateSubtotal()}
          serviceCharge={calculateServiceCharge()}
          total={calculateTotal()}
          onClose={() => setShowPayment(false)}
          slot={selectedSlot}
          isPreOrder={orderMode === 'preorder'}
        />
      )}
    </div>
  );
};

export default CartPage;