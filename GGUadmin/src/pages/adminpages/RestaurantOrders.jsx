import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Search, Calendar } from 'lucide-react';

function RestaurantOrders({ restaurantId }) {
  const { backendURL, aToken } = useContext(AdminContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    date: 'today',
    customDate: '',
    orderType: 'all'
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendURL}/api/admin/restaurant/${restaurantId}/orders`, {
          headers: { aToken },
          params: {
            status: 'completed',
            date: filters.date,
            customDate: filters.customDate,
            orderType: filters.orderType === 'all' ? undefined : filters.orderType
          }
        });

        if (data.success) {
          setOrders(data.orders);
        } else {
          toast.error(data.message || 'Failed to fetch orders');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [restaurantId, backendURL, aToken, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  const filteredOrders = orders.filter(order =>
    order.orderId.toString().includes(filters.search) ||
    order.userId?.email?.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Restaurant Orders</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="search"
              placeholder="Search by order ID or user email..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="today">Today</option>
            <option value="custom">Custom Date</option>
          </select>
          {filters.date === 'custom' && (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                name="customDate"
                value={filters.customDate}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          <select
            name="orderType"
            value={filters.orderType}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Orders</option>
            <option value="dining">Dining</option>
            <option value="takeaway">Takeaway</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.orderId} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
                  <p className="text-sm text-gray-600">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {order.orderType}
                </span>
              </div>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>₹{order.total}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">No orders found</div>
        )}
      </div>
    </div>
  );
}

export default RestaurantOrders;