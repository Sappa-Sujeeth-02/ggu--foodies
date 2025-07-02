import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRestaurantContext } from '../../context/RestaurantContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const COLORS = ['#E50914', '#FF6B6B', '#FF8787', '#FFA5A5', '#FFC1C1', '#FFDDDD'];

function Analysis() {
  const { rToken, backendURL } = useRestaurantContext();
  const [dashboardData, setDashboardData] = useState({
    revenueByCategory: [],
    mostSoldItems: [],
    dailyOrderTrends: [],
    orderTypeDistribution: [],
    monthlyProfitTrends: [],
    avgOrderValueTrends: [],
    ratingsDistribution: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate fallback data for charts
  const generateFallbackDailyOrderTrends = () => {
    const trends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayName = date.toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
      trends.push({ day: dayName, orders: 0 });
    }
    return trends;
  };

  const generateFallbackMonthlyProfitTrends = () => {
    const trends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      trends.push({ month: monthName, profit: 0 });
    }
    return trends;
  };

  const generateFallbackAvgOrderValueTrends = () => {
    const trends = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayName = date.toLocaleString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' });
      trends.push({ day: dayName, avgOrderValue: 0 });
    }
    return trends;
  };

  const generateFallbackRatingsDistribution = () => {
    return [
      { rating: '1', count: 0 },
      { rating: '2', count: 0 },
      { rating: '3', count: 0 },
      { rating: '4', count: 0 },
      { rating: '5', count: 0 },
    ];
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${backendURL}/api/restaurant/dashboard`, {
          headers: { rtoken: rToken },
        });
        if (response.data.success) {
          setDashboardData({
            revenueByCategory: response.data.revenueByCategory.length
              ? response.data.revenueByCategory
              : [{ category: 'No Data', revenue: 0 }],
            mostSoldItems: response.data.mostSoldItems.length
              ? response.data.mostSoldItems
              : [{ name: 'No Items', count: 0, percentage: 0 }],
            dailyOrderTrends: response.data.dailyOrderTrends.length
              ? response.data.dailyOrderTrends
              : generateFallbackDailyOrderTrends(),
            orderTypeDistribution: response.data.orderTypeDistribution.length
              ? response.data.orderTypeDistribution
              : [{ type: 'dining', count: 0 }, { type: 'takeaway', count: 0 }],
            monthlyProfitTrends: response.data.monthlyProfitTrends.length
              ? response.data.monthlyProfitTrends
              : generateFallbackMonthlyProfitTrends(),
            avgOrderValueTrends: response.data.avgOrderValueTrends.length
              ? response.data.avgOrderValueTrends
              : generateFallbackAvgOrderValueTrends(),
            ratingsDistribution: response.data.ratingsDistribution.length
              ? response.data.ratingsDistribution
              : generateFallbackRatingsDistribution(),
          });
        } else {
          throw new Error(response.data.message || 'Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Fetch dashboard data error:', error);
        setError(error.response?.data?.message || 'Server error');
        toast.error(error.response?.data?.message || 'Server error');
      } finally {
        setIsLoading(false);
      }
    };

    if (rToken) {
      fetchDashboardData();
    }
  }, [rToken, backendURL]);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Restaurant Performance Analysis</h1>
      <div className="text-sm text-gray-500">
        Last updated: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </div>

      {/* Revenue by Category (Bar Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.revenueByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={45} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="#E50914" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Revenue: {dashboardData.revenueByCategory.map(d => `${d.category}: ₹${d.revenue.toLocaleString()}`).join(', ')}
        </div>
      </div>

      {/* Most Sold Items (Pie Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Most Sold Items</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.mostSoldItems}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {dashboardData.mostSoldItems.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [`${value} sold`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Items: {dashboardData.mostSoldItems.map(d => `${d.name}: ${d.count} (${d.percentage}%)`).join(', ')}
        </div>
      </div>

      {/* Daily Order Trends (Bar Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Order Trends (Last 7 Days)</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.dailyOrderTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${value} orders`}
              />
              <Bar dataKey="orders" fill="#E50914" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Orders: {dashboardData.dailyOrderTrends.map(d => `${d.day}: ${d.orders}`).join(', ')}
        </div>
      </div>

      {/* Order Type Distribution (Pie Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type Distribution</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.orderTypeDistribution}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label
              >
                {dashboardData.orderTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [`${value} orders`, name]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Orders: {dashboardData.orderTypeDistribution.map(d => `${d.type}: ${d.count}`).join(', ')}
        </div>
      </div>

      {/* Monthly Profit Trends (Line Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Profit Trends (Last 12 Months)</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.monthlyProfitTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={45} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="profit" stroke="#E50914" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Profit: {dashboardData.monthlyProfitTrends.map(d => `${d.month}: ₹${d.profit.toLocaleString()}`).join(', ')}
        </div>
      </div>

      {/* Average Order Value Trends (Line Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Order Value Trends (Last 7 Days)</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardData.avgOrderValueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="avgOrderValue" stroke="#E50914" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Avg Order Value: {dashboardData.avgOrderValueTrends.map(d => `${d.day}: ₹${d.avgOrderValue.toLocaleString()}`).join(', ')}
        </div>
      </div>

      {/* Customer Ratings Distribution (Bar Chart) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Ratings Distribution</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.ratingsDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E50914',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${value} ratings`}
              />
              <Bar dataKey="count" fill="#E50914" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Ratings: {dashboardData.ratingsDistribution.map(d => `${d.rating}: ${d.count}`).join(', ')}
        </div>
      </div>
    </div>
  );
}

export default Analysis;