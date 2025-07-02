import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Clock,
  Check,
  X,
  Phone,
  User,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Edit2,
} from 'lucide-react';
import { RestaurantContext } from '../../context/RestaurantContext';
import axios from 'axios';
import toast from 'react-hot-toast';

function Preorders() {
  const { restaurant, rToken, backendURL, setRestaurant, isAuthenticated } = useContext(RestaurantContext);
  const [preorders, setPreorders] = useState([]);
  const [slotFilter, setSlotFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSlotFilterOpen, setIsSlotFilterOpen] = useState(false);
  const [slotCapacities, setSlotCapacities] = useState(restaurant?.slotCapacity || []);
  const [editSlot, setEditSlot] = useState(null);
  const [newMaxOrders, setNewMaxOrders] = useState('');
  const hasFetchedInitially = useRef(false);
  const notifiedOrderIds = useRef(new Set());
  const scrollPositions = useRef({});
  const [fetchError, setFetchError] = useState(null);

  // Calculate remaining time (though not displayed anymore)
  const calculateRemainingTime = (createdAt, initialTime = 20) => {
    if (!createdAt) return initialTime;
    const createdTime = new Date(createdAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now - createdTime) / 60000);
    let remainingTime = initialTime - elapsedMinutes;
    if (remainingTime <= 0) {
      const extraCycles = Math.floor(Math.abs(remainingTime) / 3) + 1;
      remainingTime = extraCycles * 3 + remainingTime;
    }
    return Math.max(0, remainingTime);
  };

  // Preserve scroll position
  const preserveScroll = (orderId, callback) => {
    const cardElement = document.getElementById(`preorder-card-${orderId}`);
    const scrollContainer = window;
    const scrollPosition = scrollContainer.scrollY || scrollContainer.pageYOffset;

    scrollPositions.current[orderId] = scrollPosition;

    callback();

    requestAnimationFrame(() => {
      scrollContainer.scrollTo({
        top: scrollPositions.current[orderId] || scrollPosition,
        behavior: 'instant',
      });
    });
  };

  // Fetch preorders
  const fetchPreorders = async () => {
    if (!isAuthenticated || !rToken) {
      console.log('FetchPreorders: Missing authentication or token');
      setFetchError('Authentication required to fetch preorders');
      return;
    }
    try {
      console.log('Fetching preorders with rToken:', rToken);
      const response = await axios.get(`${backendURL}/api/restaurant/orders`, {
        headers: { rtoken: rToken },
        params: { isPreOrder: true, timestamp: new Date().getTime() },
      });
      console.log('FetchPreorders response:', response.data);
      if (response.data.success) {
        const adjustedOrders = response.data.orders.map(order => ({
          ...order,
          estimatedTime: ['confirmed', 'preparing'].includes(order.status)
            ? calculateRemainingTime(order.createdAt, 20)
            : order.estimatedTime || 20,
        }));

        setPreorders(prevOrders => {
          const prevOrdersMap = new Map(prevOrders.map(order => [order.orderId, order]));
          let hasChanges = false;
          const updatedOrders = adjustedOrders.map(newOrder => {
            const prevOrder = prevOrdersMap.get(newOrder.orderId);
            if (!prevOrder) {
              hasChanges = true;
              if (hasFetchedInitially.current) {
                const now = new Date();
                const orderCreatedAt = new Date(newOrder.createdAt);
                const timeDiff = (now - orderCreatedAt) / 1000;
                if (timeDiff <= 5 && !notifiedOrderIds.current.has(newOrder.orderId)) {
                  toast.success(`New preorder #${newOrder.orderId} received!`);
                  notifiedOrderIds.current.add(newOrder.orderId);
                }
              }
              return newOrder;
            }
            if (
              prevOrder.status !== newOrder.status ||
              prevOrder.estimatedTime !== newOrder.estimatedTime ||
              JSON.stringify(prevOrder.items) !== JSON.stringify(newOrder.items) ||
              prevOrder.total !== newOrder.total
            ) {
              hasChanges = true;
              return newOrder;
            }
            return prevOrder;
          });

          const newOrderIds = new Set(adjustedOrders.map(order => order.orderId));
          const filteredOrders = updatedOrders.filter(order => newOrderIds.has(order.orderId));
          if (filteredOrders.length !== prevOrders.length) {
            hasChanges = true;
          }

          return hasChanges ? filteredOrders : prevOrders;
        });

        hasFetchedInitially.current = true;
        setFetchError(null);
      } else {
        console.error('FetchPreorders failed:', response.data.message);
        setFetchError(response.data.message || 'Failed to fetch preorders');
        toast.error(response.data.message || 'Failed to fetch preorders');
      }
    } catch (error) {
      console.error('FetchPreorders error:', error);
      setFetchError(error.response?.data?.message || 'Server error');
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Fetch restaurant profile
  const fetchRestaurantProfile = async () => {
    if (!isAuthenticated || !rToken || slotCapacities.length > 0) {
      console.log('FetchRestaurantProfile: Skipping fetch due to conditions', {
        isAuthenticated,
        rToken,
        slotCapacitiesLength: slotCapacities.length,
      });
      return;
    }
    try {
      console.log('Fetching restaurant profile with rToken:', rToken);
      const response = await axios.get(`${backendURL}/api/restaurant/profile`, {
        headers: { rtoken: rToken },
      });
      console.log('FetchRestaurantProfile response:', response.data);
      if (response.data.success) {
        setSlotCapacities(response.data.restaurant.slotCapacity);
        setRestaurant(prev => {
          if (
            prev.preOrderEnabled !== response.data.restaurant.preOrderEnabled ||
            JSON.stringify(prev.slotCapacity) !== JSON.stringify(response.data.restaurant.slotCapacity)
          ) {
            return response.data.restaurant;
          }
          return prev;
        });
      } else {
        console.error('FetchRestaurantProfile failed:', response.data.message);
        setFetchError(response.data.message || 'Failed to fetch restaurant profile');
        toast.error(response.data.message || 'Failed to fetch restaurant profile');
      }
    } catch (error) {
      console.error('FetchRestaurantProfile error:', error);
      setFetchError(error.response?.data?.message || 'Server error');
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    console.log('Preorders useEffect triggered', { isAuthenticated, rToken, restaurant });
    if (!isAuthenticated || !rToken || !restaurant) {
      console.log('Preorders useEffect: Context not ready, delaying fetch');
      setIsLoading(true);
      return;
    }

    const fetchAndSetPreorders = async () => {
      setIsLoading(true);
      try {
        console.log('Starting initial fetch');
        await Promise.all([fetchPreorders(), fetchRestaurantProfile()]);
      } catch (error) {
        console.error('Initial fetch error:', error);
        setFetchError('Failed to load preorders');
        toast.error('Failed to load preorders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetPreorders();

    const pollingInterval = setInterval(() => {
      if (isAuthenticated && rToken) {
        console.log('Polling preorders');
        fetchPreorders();
      } else {
        console.log('Polling skipped: Missing authentication or token');
      }
    }, 5000);

    return () => {
      console.log('Cleaning up polling interval');
      clearInterval(pollingInterval);
    };
  }, [isAuthenticated, rToken, restaurant, backendURL]);

  // Auto-decrement estimated time (though not displayed anymore)
  useEffect(() => {
    const interval = setInterval(() => {
      setPreorders(prevOrders =>
        prevOrders.map(order => {
          if (['confirmed', 'preparing'].includes(order.status) && order.estimatedTime > 0) {
            const newTime = order.estimatedTime - 1;
            return { ...order, estimatedTime: newTime };
          } else if (['confirmed', 'preparing'].includes(order.status) && order.estimatedTime === 0) {
            return { ...order, estimatedTime: 3 };
          }
          return order;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Clean up notified order IDs
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      const fiveSecondsAgo = now.getTime() - 5000;
      const currentNotifiedIds = Array.from(notifiedOrderIds.current);
      currentNotifiedIds.forEach(orderId => {
        const order = preorders.find(o => o.orderId === orderId);
        if (order) {
          const orderCreatedAt = new Date(order.createdAt).getTime();
          if (orderCreatedAt < fiveSecondsAgo) {
            notifiedOrderIds.current.delete(orderId);
          }
        } else {
          notifiedOrderIds.current.delete(orderId);
        }
      });
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, [preorders]);

  // Toggle Preorder Enabled
  const handleTogglePreOrder = async () => {
    if (!isAuthenticated || !rToken) return;
    try {
      const newStatus = !restaurant.preOrderEnabled;
      const response = await axios.put(
        `${backendURL}/api/restaurant/preorder-enabled`,
        { preOrderEnabled: newStatus },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setRestaurant(prev => ({ ...prev, preOrderEnabled: newStatus }));
        toast.success(`Preorder is now ${newStatus ? 'Open' : 'Closed'}`);
      } else {
        toast.error(response.data.message || 'Failed to update preorder status');
      }
    } catch (error) {
      console.error('Toggle preorder error:', error);
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Update Slot Capacity
  const handleUpdateSlotCapacity = async (slot) => {
    if (!isAuthenticated || !rToken) return;
    if (!newMaxOrders || isNaN(newMaxOrders) || newMaxOrders < 0) {
      toast.error('Please enter a valid number of maximum orders');
      return;
    }
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/slot-capacity`,
        { slot, maxOrders: parseInt(newMaxOrders) },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setSlotCapacities(prev =>
          prev.map(s =>
            s.slot === slot ? { ...s, maxOrders: parseInt(newMaxOrders) } : s
          )
        );
        setRestaurant(prev => ({
          ...prev,
          slotCapacity: prev.slotCapacity.map(s =>
            s.slot === slot ? { ...s, maxOrders: parseInt(newMaxOrders) } : s
          ),
        }));
        setEditSlot(null);
        setNewMaxOrders('');
        toast.success(`Slot ${slot} updated to max ${newMaxOrders} orders`);
      } else {
        toast.error(response.data.message || 'Failed to update slot capacity');
      }
    } catch (error) {
      console.error('Update slot capacity error:', error);
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Accept Preorder
  const handleAcceptOrder = async (orderId) => {
    if (!isAuthenticated || !rToken) return;
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/orders/accept/${orderId}`,
        {},
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        preserveScroll(orderId, () => {
          setPreorders(preorders.map(order =>
            order.orderId === orderId
              ? { ...order, status: 'confirmed', confirmedAt: new Date() }
              : order
          ));
        });
        toast.success('Preorder accepted successfully');
      } else {
        toast.error(response.data?.message || 'Failed to accept preorder');
      }
    } catch (error) {
      console.error('Accept preorder error:', error);
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Cancel Preorder
  const handleCancelOrder = async (orderId) => {
    if (!isAuthenticated || !rToken) return;
    if (window.confirm('Are you sure you want to cancel this preorder?')) {
      try {
        const response = await axios.put(
          `${backendURL}/api/restaurant/orders/cancel/${orderId}`,
          {},
          { headers: { rtoken: rToken } }
        );
        if (response.data.success) {
          preserveScroll(orderId, () => {
            setPreorders(preorders.map(order =>
              order.orderId === orderId
                ? { ...order, status: 'cancelled', cancelledAt: new Date() }
                : order
            ));
          });
          toast.success('Preorder cancelled successfully');
        } else {
          toast.error(response.data?.message || 'Failed to cancel preorder');
        }
      } catch (error) {
        console.error('Cancel preorder error:', error);
        toast.error(error.response?.data?.message || 'Server error');
      }
    }
  };

  // Start Preparing Preorder
  const handleStartPreparing = async (orderId) => {
    if (!isAuthenticated || !rToken) return;
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/orders/prepare/${orderId}`,
        {},
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        preserveScroll(orderId, () => {
          setPreorders(preorders.map(order =>
            order.orderId === orderId
              ? { ...order, status: 'preparing', preparingAt: new Date() }
              : order
          ));
        });
        toast.success('Preorder preparation started');
      } else {
        toast.error(response.data?.message || 'Failed to start preparing preorder');
      }
    } catch (error) {
      console.error('Start preparing preorder error:', error);
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Mark Preorder as Prepared
  const handleMarkPrepared = async (orderId) => {
    if (!isAuthenticated || !rToken) return;
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/orders/prepared/${orderId}`,
        {},
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        preserveScroll(orderId, () => {
          setPreorders(preorders.map(order =>
            order.orderId === orderId
              ? { ...order, status: 'ready', estimatedTime: 0 }
              : order
          ));
        });
        toast.success('Preorder marked as prepared');
      } else {
        toast.error(response.data?.message || 'Failed to mark preorder as prepared');
      }
    } catch (error) {
      console.error('Mark prepared preorder error:', error);
      toast.error(error.response?.data?.message || 'Server error');
    }
  };

  // Complete Preorder
  const handleCompleteOrder = async (orderId, otpDigits, setOtpDigits, setOtpError) => {
    if (!isAuthenticated || !rToken) return;
    const enteredOtp = otpDigits.join('');
    if (otpDigits.every(digit => digit === '')) {
      setOtpError('Enter OTP');
      return;
    }

    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/orders/complete/${orderId}`,
        { otp: enteredOtp },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        preserveScroll(orderId, () => {
          setPreorders(preorders.map(order =>
            order.orderId === orderId
              ? { ...order, status: 'completed' }
              : order
          ));
        });
        setOtpDigits(['', '', '', '']);
        setOtpError('');
        toast.success('Preorder completed successfully');
      } else {
        setOtpError(response.data?.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Complete preorder error:', error);
      setOtpError(error.response?.data?.message || 'Server error');
    }
  };

  // Filter preorders by slot
  const filteredPreorders = slotFilter === 'all'
    ? preorders.filter(order => order.status !== 'completed' && order.status !== 'cancelled')
    : preorders.filter(order => order.slot === slotFilter && order.status !== 'completed' && order.status !== 'cancelled');

  // Get unique slots for filter dropdown
  const availableSlots = slotCapacities.map(s => s.slot);

  // Count orders per slot
  const slotOrderCounts = slotCapacities.reduce((acc, slot) => {
    acc[slot.slot] = preorders.filter(
      order => order.slot === slot.slot && order.status !== 'cancelled' && order.status !== 'completed'
    ).length;
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-gray-800 border-orange-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  function PreorderCard({ order }) {
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const inputRefs = useRef([null, null, null, null]);

    const handleOtpChange = (index, value) => {
      if (/^\d?$/.test(value)) {
        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value;
        setOtpDigits(newOtpDigits);
        if (value && index < 3) {
          inputRefs.current[index + 1]?.focus();
        }
      }
    };

    const handleKeyDown = (index, e) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const shortenName = (name) => {
      if (!name) return 'Unknown';
      const firstName = name.split(' ')[0];
      if (firstName.length > 15) {
        return `${firstName.substring(0, 15)}…`;
      }
      return firstName;
    };

    // Prevent default form submission behavior
    const handleButtonClick = (e, action) => {
      e.preventDefault();
      action();
    };

    return (
      <div id={`preorder-card-${order.orderId}`} className="bg-white rounded-xl shadow-md border border-gray-200 p-4 sm:p-5 flex flex-col h-full transition-transform duration-200 hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">#{order.orderId}</h3>
            <p className="text-sm sm:text-base text-gray-500">
              {new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p className="text-sm sm:text-base text-gray-500">Slot: {order.slot}</p>
            
          </div>
          <div className={`px-3 py-1 rounded-full text-sm sm:text-base font-medium border flex-shrink-0 ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
        </div>

        <div className={`mt-2 px-3 py-1 rounded-full text-sm sm:text-base font-medium flex-shrink-0 ${
          order.orderType === 'dining' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {order.orderType === 'dining' ? (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Dine-in</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Takeaway</span>
            </div>
          )}
        </div>

        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 flex-1">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-base truncate">{shortenName(order.userId?.name)}</p>
              <div className="flex items-center space-x-2 text-base text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{order.userId?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex-1">
          <h4 className="font-medium text-gray-900 text-base mb-2">Order Items:</h4>
          <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-base font-medium truncate">{item.name}</span>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    item.foodtype === 'Vegetarian' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </div>
                <div className="text-base text-gray-600 flex-shrink-0 ml-3">
                  Qty: {item.quantity} × ₹{order.orderType === 'dining' ? item.price : item.takeawayPrice || item.price}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center font-semibold text-base">
              <span>Total Amount:</span>
              <span className="text-lg text-red-600">₹{order.total}</span>
            </div>
          </div>
        </div>

        {order.status === 'ready' && (
          <div className="mb-3">
            <div className="flex justify-center space-x-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={el => inputRefs.current[index] = el}
                  maxLength={1}
                  pattern="\d"
                  className="w-12 h-12 text-center text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="-"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            {otpError && (
              <p className="text-red-600 text-base mt-2 text-center transition-all duration-200">{otpError}</p>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-2 mt-3">
          {order.status === 'pending' && (
            <>
              <button
                onClick={(e) => handleButtonClick(e, () => handleAcceptOrder(order.orderId))}
                disabled={!restaurant?.availability}
                className="flex items-center justify-center space-x-3 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 text-base"
              >
                <Check className="w-5 h-5" />
                <span>Accept</span>
              </button>
              <button
                onClick={(e) => handleButtonClick(e, () => handleCancelOrder(order.orderId))}
                className="flex items-center justify-center space-x-3 bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 text-base"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </>
          )}
          {order.status === 'confirmed' && (
            <button
              onClick={(e) => handleButtonClick(e, () => handleStartPreparing(order.orderId))}
              className="flex items-center justify-center space-x-3 bg-orange-600 text-white px-5 py-3 rounded-lg hover:bg-orange-700 transition-colors duration-200 text-base"
            >
              <Clock className="w-5 h-5" />
              <span>Start Preparing</span>
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={(e) => handleButtonClick(e, () => handleMarkPrepared(order.orderId))}
              className="flex items-center justify-center space-x-3 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-base"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Mark as Prepared</span>
            </button>
          )}
          {order.status === 'ready' && (
            <button
              onClick={(e) => handleButtonClick(e, () => handleCompleteOrder(order.orderId, otpDigits, setOtpDigits, setOtpError))}
              className="flex items-center justify-center space-x-3 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 text-base"
            >
              <Check className="w-5 h-5" />
              <span>Complete Order</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex justify-center items-center">
        <p className="text-lg sm:text-xl text-gray-500">Please log in to view preorders</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 overflow-x-hidden">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Preorders Management</h1>
          <div className="text-base sm:text-lg text-gray-500 mt-2 sm:mt-0">
            {filteredPreorders.length} active preorders
          </div>
        </div>

        {!restaurant?.availability && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-base">Restaurant is currently closed</span>
            </div>
            <p className="text-base text-red-600 mt-2">
              New preorders cannot be accepted while the restaurant is closed.
            </p>
          </div>
        )}

        {fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 sm:mb-6">
            <div className="flex items-center space-x-3 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-base">{fetchError}</span>
            </div>
          </div>
        )}

        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Preorder Settings</h2>
            <button
              onClick={handleTogglePreOrder}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm sm:text-base font-medium border ${
                restaurant?.preOrderEnabled
                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                  : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
              } transition-colors duration-200`}
              disabled={!isAuthenticated}
            >
              {restaurant?.preOrderEnabled ? (
                <>
                  <ToggleRight className="w-4 h-4" />
                  <span>Preorders Open</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  <span>Preorders Close</span>
                </>
              )}
            </button>
          </div>
          {!restaurant?.preOrderEnabled && (
            <p className="text-base text-red-600 mt-2">
              Preorders are not accepting, open to accept
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {slotCapacities.map(slot => (
              <div key={slot.slot} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg relative">
                <div>
                  <p className="font-medium text-base">Slot: {slot.slot}</p>
                  <p className="text-sm text-gray-600">
                    Max Orders: {slot.maxOrders} | Current: {slotOrderCounts[slot.slot] || 0}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditSlot(slot.slot);
                    setNewMaxOrders(slot.maxOrders.toString());
                  }}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  disabled={!isAuthenticated}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {editSlot === slot.slot && (
                  <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 right-0 top-full">
                    <input
                      type="number"
                      value={newMaxOrders}
                      onChange={(e) => setNewMaxOrders(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 mb-2 w-full text-base"
                      placeholder="Max Orders"
                      min="0"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateSlotCapacity(slot.slot)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditSlot(null);
                          setNewMaxOrders('');
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
          <div className="relative">
            <div className="sm:hidden">
              <button
                onClick={() => setIsSlotFilterOpen(!isSlotFilterOpen)}
                className="w-full flex justify-between items-center px-4 py-3 text-base font-medium text-gray-900 bg-gray-50 rounded-lg"
              >
                <span>Filter by Slot: {slotFilter === 'all' ? 'All Slots' : slotFilter}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isSlotFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSlotFilterOpen && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  <div className="flex flex-col p-2">
                    <button
                      onClick={() => {
                        setSlotFilter('all');
                        setIsSlotFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-base font-medium rounded-lg transition-colors duration-200 ${
                        slotFilter === 'all'
                          ? 'bg-red-600 text-white'
                          : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      All Slots
                    </button>
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => {
                          setSlotFilter(slot);
                          setIsSlotFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-base font-medium rounded-lg transition-colors duration-200 ${
                          slotFilter === slot
                            ? 'bg-red-600 text-white'
                            : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="flex space-x-1 overflow-x-auto hide-scrollbar scroll-smooth p-2">
                <button
                  onClick={() => setSlotFilter('all')}
                  className={`px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
                    slotFilter === 'all'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  All Slots
                </button>
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSlotFilter(slot)}
                    className={`px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 whitespace-nowrap ${
                      slotFilter === slot
                        ? 'bg-red-600 text-white'
                        : 'text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-lg sm:text-xl text-gray-600">Loading preorders...</p>
          </div>
        ) : fetchError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Error loading preorders</h3>
            <p className="text-base sm:text-lg text-gray-500">{fetchError}</p>
            <button
              onClick={() => fetchAndSetPreorders()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base"
            >
              Retry
            </button>
          </div>
        ) : filteredPreorders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No preorders found</h3>
            <p className="text-base sm:text-lg text-gray-500">
              {slotFilter === 'all'
                ? 'No active preorders at the moment'
                : `No preorders found for slot ${slotFilter}`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPreorders.map(order => (
              <PreorderCard key={order.orderId} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Preorders;