import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

function Overview({ restaurantId }) {
  const { backendURL, aToken } = useContext(AdminContext);
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    averageRating: 0,
    totalItems: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    orderCompletionRate: 0,
    topItem: { name: 'N/A', orders: 0 },
    lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendURL}/api/admin/restaurant/${restaurantId}/stats`, {
          headers: { aToken }
        });

        console.log('API Response:', data); // Debug: Log the full response

        if (data.success) {
          const enrichedStats = {
            ...data.stats,
            pendingOrders: data.stats.pendingOrders || 0,
            cancelledOrders: data.stats.cancelledOrders || 0,
            orderCompletionRate: data.stats.totalOrders > 0
              ? ((data.stats.totalOrders - (data.stats.cancelledOrders || 0)) / data.stats.totalOrders * 100).toFixed(1)
              : 0,
            topItem: data.stats.topItem || { name: 'N/A', orders: 0 },
            lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
          };
          console.log('Processed Stats:', enrichedStats); // Debug: Log processed stats
          setStats(enrichedStats);
        } else {
          toast.error(data.message || 'Failed to fetch restaurant stats');
        }
      } catch (error) {
        console.error('Fetch stats error:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || 'Failed to fetch restaurant stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [restaurantId, backendURL, aToken]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Restaurant Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Total Orders', value: stats.totalOrders, icon: 'ShoppingBag' },
          { title: "Today's Orders", value: stats.todayOrders, icon: 'ShoppingBag' },
          { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: 'CurrencyRupee' },
          { title: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: 'CurrencyRupee' },
          { title: 'Average Rating', value: stats.averageRating.toFixed(1), icon: 'Star' },
          { title: 'Total Menu Items', value: stats.totalItems, icon: 'Menu' },
          { title: 'Pending Orders', value: stats.pendingOrders, icon: 'Clock' },
          { title: 'Cancelled Orders', value: stats.cancelledOrders, icon: 'XCircle' },
          { title: 'Completion Rate', value: `${stats.orderCompletionRate}%`, icon: 'CheckCircle' },
          { title: 'Top Item', value: `${stats.topItem.name} (${stats.topItem.orders} orders)`, icon: 'Trophy' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border-l-4 border-red-600 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-red-600">{stat.value}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={
                      stat.icon === 'ShoppingBag'
                        ? 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                        : stat.icon === 'CurrencyRupee'
                        ? 'M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z'
                        : stat.icon === 'Star'
                        ? 'M11 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l- "2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'
                        : stat.icon === 'Clock'
                        ? 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        : stat.icon === 'XCircle'
                        ? 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                        : stat.icon === 'CheckCircle'
                        ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                        : stat.icon === 'Menu'
                        ? 'M4 6h16M4 12h16M4 18h16'
                        : stat.icon === 'Trophy'
                        ? 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                        : 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                    }
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 text-right">
        Last updated: {stats.lastUpdated}
      </div>
    </div>
  );
}

export default Overview;