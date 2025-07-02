import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantContext } from '../../context/RestaurantContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ArrowLeft, Star } from 'lucide-react';
import { debounce } from 'lodash'; // Ensure lodash is installed: npm install lodash

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function FoodItemDetails() {
  const { foodItemId } = useParams();
  const { rToken, backendURL } = useRestaurantContext();
  const navigate = useNavigate();
  const [foodItem, setFoodItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderTrends, setOrderTrends] = useState([]);

  // Debounced fetch function to prevent rapid re-fetches
  const fetchFoodItemDetails = useCallback(
    debounce(async () => {
      if (!rToken || !backendURL) {
        toast.error('Please log in to view food item details');
        navigate('/restaurant-login', { replace: true });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(
          `${backendURL}/api/restaurant/food-item/${foodItemId}/details`,
          { headers: { rtoken: rToken } }
        );
        if (response.data.success) {
          setFoodItem(response.data.foodItem || {});
          setOrderTrends(response.data.hourlyOrderTrends || []);
        } else {
          toast.error(response.data.message || 'Failed to fetch food item details');
          setFoodItem(null);
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || 'Failed to fetch food item details';
        if (status === 401) {
          toast.error('Session expired. Please log in again.');
          navigate('/restaurant-login', { replace: true });
        } else if (status === 404) {
          toast.error('Food item not found');
          setFoodItem(null);
        } else {
          toast.error(message);
          setFoodItem(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [rToken, backendURL, foodItemId, navigate]
  );

  useEffect(() => {
    if (rToken && backendURL) {
      fetchFoodItemDetails();
    } else {
      toast.error('Session expired. Please log in again.');
      navigate('/restaurant-login', { replace: true });
    }
    return () => fetchFoodItemDetails.cancel();
  }, [rToken, backendURL, fetchFoodItemDetails, navigate]);

  // Define hours from 08:00 to 23:00
  const allHours = Array.from({ length: 16 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Map order trends to ensure all hours are included
  const chartData = {
    labels: allHours,
    datasets: [
      {
        label: 'Orders per Hour',
        data: allHours.map((hour) => {
          const trend = orderTrends.find((t) => t?.hour === hour);
          return trend ? trend.orders : 0;
        }),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      title: {
        display: true,
        text: 'Hourly Order Trends (8 AM - 11 PM)',
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Number of Orders', font: { size: 14 } },
        ticks: { stepSize: 1, font: { size: 12 } },
      },
      x: {
        title: { display: true, text: 'Hour of Day', font: { size: 14 } },
        ticks: {
          font: { size: 12 },
          callback: function (value, index) {
            return index < allHours.length && index % 2 === 0 ? allHours[index] : '';
          },
        },
      },
    },
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <button
        onClick={() => navigate('/restaurant-dashboard/menu')}
        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500 mb-4 text-base sm:text-lg"
        aria-label="Back to menu"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        <span>Back to Menu</span>
      </button>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-3">Loading food item details...</p>
        </div>
      ) : !foodItem ? (
        <div className="text-center py-10">
          <p className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-200">Food Item Not Found</p>
          <button
            onClick={() => navigate('/restaurant-dashboard/menu')}
            className="mt-4 text-sm sm:text-base text-red-600 hover:underline"
            aria-label="Return to menu"
          >
            Return to Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-200">
            {foodItem.dishname || 'Unknown Dish'} Analytics
          </h1>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-200 mb-4 sm:mb-6">Overview</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm personally dark:text-gray-400">Total Orders</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                  {foodItem.totalOrders ?? 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                  ₹{(foodItem.totalRevenue ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Orders</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                  {foodItem.todayOrders ?? 0}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Today's Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                  ₹{(foodItem.todayRevenue ?? 0).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                    {(foodItem.rating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Number of Ratings</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">
                  {foodItem.ratingsCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-200 mb-4 sm:mb-6">Hourly Order Trends</h2>
            <div className="relative h-48 sm:h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodItemDetails;