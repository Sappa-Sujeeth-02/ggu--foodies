import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Search, Calendar, Download, Package, DollarSign, TrendingUp, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function RestaurantHistory({ restaurantId }) {
  const { backendURL, aToken } = useContext(AdminContext);
  const [orders, setOrders] = useState([]);
  const [restaurantName, setRestaurantName] = useState('GGU Foodie');
  const [restaurantPhone, setRestaurantPhone] = useState('123-456-7890');
  const [restaurantIdState, setRestaurantIdState] = useState(restaurantId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    date: 'all',
    customStartDate: '',
    customEndDate: '',
    orderType: 'all',
    userEmail: '',
    isPreOrder: 'all',
  });
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${backendURL}/api/admin/restaurant/${restaurantId}/history`, {
          headers: { aToken },
          params: {
            status: 'completed',
            date: filters.date,
            customDate: filters.date === 'custom' ? filters.customStartDate : undefined,
            orderType: filters.orderType === 'all' ? undefined : filters.orderType,
            userEmail: filters.userEmail,
            isPreOrder: filters.isPreOrder === 'all' ? undefined : filters.isPreOrder,
          },
        });

        if (data.success) {
          const menuItems = await axios.get(`${backendURL}/api/admin/restaurant/${restaurantId}/menu`, {
            headers: { aToken },
          });
          const itemMap = menuItems.data.menuItems.reduce((acc, item) => {
            acc[item.foodItemId] = item.rating || 0;
            return acc;
          }, {});

          const enrichedOrders = data.orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
              ...item,
              rating: itemMap[item.foodItemId] || 0,
            })),
          }));
          setOrders(enrichedOrders);
        } else {
          throw new Error(data.message || 'Failed to fetch order history');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error.response?.data?.message || 'Failed to load order history.');
        toast.error(error.response?.data?.message || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    const fetchRestaurantDetails = async () => {
      try {
        const { data } = await axios.get(`${backendURL}/api/admin/restaurants`, {
          headers: { aToken },
        });
        if (data.success) {
          const restaurant = data.restaurants.find(r => r.restaurantid === restaurantId);
          if (restaurant) {
            setRestaurantName(restaurant.restaurantname || 'GGU Foodie');
            setRestaurantPhone(restaurant.phone || '123-456-7890');
            setRestaurantIdState(restaurant.restaurantid || restaurantId);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      }
    };

    if (aToken) {
      fetchHistory();
      fetchRestaurantDetails();
    }
  }, [restaurantId, backendURL, aToken, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    let dateMatch = true;

    if (filters.date === 'custom') {
      const startDate = filters.customStartDate ? new Date(filters.customStartDate) : new Date(0);
      const endDate = filters.customEndDate ? new Date(filters.customEndDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
      dateMatch = orderDate >= startDate && orderDate <= endDate;
    } else if (filters.date === 'month') {
      const selectedMonth = parseInt(filters.selectedMonth || new Date().getMonth());
      const selectedYear = parseInt(filters.selectedYear || new Date().getFullYear());
      dateMatch = orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
    }

    const matchesType = filters.orderType === 'all' || order.orderType === filters.orderType;
    const matchesPreOrder = filters.isPreOrder === 'all' || 
      (filters.isPreOrder === 'true' ? order.isPreOrder : !order.isPreOrder);
    const matchesSearch =
      order.orderId.toString().includes(filters.search) ||
      (order.userId?.email || '').toLowerCase().includes(filters.search.toLowerCase());

    return dateMatch && matchesType && matchesPreOrder && matchesSearch;
  });

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const type = order.orderType || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(order);
    return acc;
  }, {});

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const renderStars = (items) => {
    const ratings = items.filter(item => item.rating && item.rating > 0).map(item => item.rating);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }

    return <span>{avgRating.toFixed(1)} {stars}</span>;
  };

  const generateExcel = () => {
    setIsGenerating(true);
    try {
      const worksheetData = filteredOrders.map(order => ({
        'Order ID': order.orderId,
        'Customer': order.userId?.email || 'N/A',
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Time': new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'Type': order.orderType,
        'Order Mode': order.isPreOrder ? 'Pre-order' : 'Instant',
        'Items': order.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
        'Average Rating': order.items
          .filter(item => item.rating && item.rating > 0)
          .map(item => item.rating)
          .reduce((sum, r) => sum + r, 0) / (order.items.length || 1),
        'Amount': `₹${order.total.toLocaleString()}`,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Order History');

      const summaryData = [
        { 'Summary': 'Total Orders', 'Value': totalOrders },
        { 'Summary': 'Total Revenue', 'Value': `₹${totalRevenue.toLocaleString()}` },
        { 'Summary': 'Average Order Value', 'Value': `₹${avgOrderValue.toFixed(2)}` },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      XLSX.writeFile(workbook, `Restaurant-${restaurantIdState}-History-${filters.date === 'custom' ? 'Custom' : `${months[filters.selectedMonth || 0]}-${filters.selectedYear || new Date().getFullYear()}`}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Error generating Excel. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();

      // Header
      doc.setFont("Times", "bold");
      doc.setFontSize(18);
      doc.setTextColor(229, 9, 20);
      doc.text(`Restaurant Order History - ${restaurantName}`, 15, 20);

      // Restaurant Details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("Times", "normal");
      doc.text(`Restaurant: ${restaurantName}`, 15, 30);
      doc.text(`ID: ${restaurantIdState}`, 15, 38);
      doc.text(`Phone: ${restaurantPhone}`, 15, 46);
      doc.text(
        filters.date === 'custom'
          ? `Period: ${filters.customStartDate} to ${filters.customEndDate}`
          : `Period: ${months[filters.selectedMonth || new Date().getMonth()]} ${filters.selectedYear || new Date().getFullYear()}`,
        15, 54
      );
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 15, 62);

      // Summary
      doc.setFontSize(14);
      doc.setFont("Times", "bold");
      doc.text('Summary:', 15, 72);
      doc.setFontSize(10);
      doc.setFont("Times", "normal");
      doc.text(`Total Orders: ${totalOrders}`, 15, 82);
      doc.text(`Total Revenue: ₹${totalRevenue.toLocaleString()}`, 15, 90);
      doc.text(`Average Order Value: ₹${avgOrderValue.toFixed(2)}`, 15, 98);

      // Orders Table
      const tableData = [];
      Object.keys(groupedOrders).sort().forEach((type) => {
        groupedOrders[type].forEach((order) => {
          const itemsText = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
          const avgRating = order.items
            .filter(item => item.rating && item.rating > 0)
            .map(item => item.rating)
            .reduce((sum, r) => sum + r, 0) / (order.items.length || 1);
          tableData.push([
            order.orderId,
            order.userId?.email || 'N/A',
            new Date(order.createdAt).toLocaleDateString(),
            type === 'dining' ? 'Dine-in' : 'Takeaway',
            order.isPreOrder ? 'Pre-order' : 'Instant',
            itemsText,
            avgRating.toFixed(1),
            `₹${order.total.toLocaleString()}`,
          ]);
        });
      });

      autoTable(doc, {
        startY: 108,
        head: [['Order ID', 'Customer', 'Date', 'Type', 'Order Mode', 'Items', 'Rating', 'Amount']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [229, 9, 20], textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { top: 20, right: 15, bottom: 20, left: 15 },
      });

      // Total Profit
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.setFont("Times", "bold");
      doc.text('Total Profit:', 15, finalY);
      doc.setFont("Times", "normal");
      doc.text(`₹${totalRevenue.toLocaleString()}`, 180, finalY);

      doc.save(`Restaurant-${restaurantIdState}-History-${filters.date === 'custom' ? 'Custom' : `${months[filters.selectedMonth || 0]}-${filters.selectedYear || new Date().getFullYear()}`}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (downloadFormat === 'pdf') {
      generatePDF();
    } else {
      generateExcel();
    }
  };

  if (loading) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 text-center">
        <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-xs sm:text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Order History</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
          <button
            onClick={handleDownload}
            disabled={isGenerating || filteredOrders.length === 0}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200 text-xs sm:text-sm w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {downloadFormat.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Orders</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-100">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-2 rounded-full bg-green-100">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Avg Order Value</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">₹{avgOrderValue.toFixed(0)}</p>
            </div>
            <div className="p-2 rounded-full bg-purple-100">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date Filter</label>
            <select
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="month">Month/Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
          {filters.date === 'custom' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="customStartDate"
                  value={filters.customStartDate}
                  onChange={handleFilterChange}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="customEndDate"
                  value={filters.customEndDate}
                  onChange={handleFilterChange}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </>
          ) : filters.date === 'month' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select
                  name="selectedMonth"
                  value={filters.selectedMonth || new Date().getMonth()}
                  onChange={handleFilterChange}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                <select
                  name="selectedYear"
                  value={filters.selectedYear || new Date().getFullYear()}
                  onChange={handleFilterChange}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
            <select
              name="orderType"
              value={filters.orderType}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="dining">Dine-in</option>
              <option value="takeaway">Takeaway</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order Mode</label>
            <select
              name="isPreOrder"
              value={filters.isPreOrder}
              onChange={handleFilterChange}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="true">Pre-order</option>
              <option value="false">Instant</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                name="search"
                placeholder="Search by order ID or email"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Type */}
      {Object.keys(groupedOrders).sort().length > 0 ? (
        Object.keys(groupedOrders).sort().map((type) => (
          <div key={type} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-200 pb-2">
              {type === 'dining' ? 'Dine-in Orders' : 'Takeaway Orders'}
            </h2>
            {/* Mobile Cards */}
            <div className="space-y-3 sm:hidden">
              {groupedOrders[type].map((order) => (
                <div key={order.orderId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.orderType === 'dining' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {order.orderType === 'dining' ? 'Dine-in' : 'Takeaway'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.isPreOrder ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.isPreOrder ? 'Pre-order' : 'Instant'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">{order.userId?.email || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-700">Items:</div>
                      <div className="space-y-1 mt-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-xs flex items-center">
                            <span className="font-medium truncate max-w-[200px]">{item.name}</span>
                            <span className="text-gray-500 mx-1">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      Rating: {renderStars(order.items)}
                    </div>
                    <div className="text-sm font-bold text-gray-900">₹{order.total}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Mode
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedOrders[type].map((order) => (
                      <tr key={order.orderId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()} at{' '}
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {order.userId?.email || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.orderType === 'dining' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {order.orderType === 'dining' ? 'Dine-in' : 'Takeaway'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.isPreOrder ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.isPreOrder ? 'Pre-order' : 'Instant'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1 max-h-16 overflow-y-auto">
                            {order.items.map((item, index) => (
                              <div key={index} className="text-xs flex items-center">
                                <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                                <span className="text-gray-500 mx-1">× {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{renderStars(order.items)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-900">₹{order.total}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-xs sm:text-sm text-gray-500">
            No completed orders found for the selected period
          </p>
        </div>
      )}
    </div>
  );
}

export default RestaurantHistory;