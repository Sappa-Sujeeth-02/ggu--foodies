import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  Search,
  FileText,
  TrendingUp,
  DollarSign,
  Package
} from 'lucide-react';
import { useRestaurantContext } from '../../context/RestaurantContext';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import axios from 'axios';
import toast from 'react-hot-toast';

function History() {
  const { backendURL, rToken } = useRestaurantContext();
  const [orders, setOrders] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [orderModeFilter, setOrderModeFilter] = useState('all');
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('GGU Foodie');
  const [restaurantPhone, setRestaurantPhone] = useState('123-456-7890');
  const [restaurantId, setRestaurantId] = useState('REST001');

  // Fetch orders and restaurant details
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${backendURL}/api/restaurant/orders`, {
          headers: { rtoken: rToken },
        });
        if (response.data.success) {
          const completedOrders = response.data.orders.filter(order => order.status === 'completed');
          setOrders(completedOrders);
        } else {
          throw new Error(response.data.message || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load order history. Please try again.');
        toast.error('Failed to load order history.');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRestaurantDetails = async () => {
      try {
        const response = await axios.get(`${backendURL}/api/restaurant/profile`, {
          headers: { rtoken: rToken },
        });
        if (response.data.success) {
          setRestaurantName(response.data.restaurant.restaurantname || 'GGU Foodie');
          setRestaurantPhone(response.data.restaurant.phone || '123-456-7890');
          setRestaurantId(response.data.restaurant.restaurantid || 'REST001');
        }
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
      }
    };

    if (rToken) {
      fetchOrders();
      fetchRestaurantDetails();
    }
  }, [backendURL, rToken]);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    let dateMatch = true;

    if (useCustomDate) {
      const startDate = customStartDate ? new Date(customStartDate) : new Date(0);
      const endDate = customEndDate ? new Date(customEndDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
      dateMatch = orderDate >= startDate && orderDate <= endDate;
    } else {
      dateMatch = orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
    }

    const matchesType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter;
    const matchesMode = orderModeFilter === 'all' || 
                       (orderModeFilter === 'preorder' && order.isPreOrder) || 
                       (orderModeFilter === 'instant' && !order.isPreOrder);
    const matchesSearch = 
      (order.userId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.orderId || '').toString().includes(searchTerm) ||
      (order.userId?.phone || '').includes(searchTerm);

    return dateMatch && matchesType && matchesMode && matchesSearch;
  });

  // Calculate statistics
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      
      // Set font
      doc.setFont("helvetica", "normal");

      // Header
      doc.setFontSize(18);
      doc.setTextColor(229, 9, 20);
      doc.setFont("helvetica", "bold");
      doc.text('GGU Foodie - Order History Report', 15, 20, { maxWidth: 180 });

      // Restaurant Details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`Restaurant: ${restaurantName}`, 15, 30, { maxWidth: 180 });
      doc.text(`ID: ${restaurantId}`, 15, 38, { maxWidth: 180 });
      doc.text(`Phone: ${restaurantPhone}`, 15, 46, { maxWidth: 180 });
      doc.text(
        useCustomDate 
          ? `Period: ${customStartDate} to ${customEndDate}`
          : `Period: ${months[selectedMonth]} ${selectedYear}`,
        15, 54, { maxWidth: 180 }
      );
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 62, { maxWidth: 180 });

      // Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('Summary:', 15, 78, { maxWidth: 180 });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total Orders: ${totalOrders}`, 15, 88, { maxWidth: 180 });
      doc.text(`Total Revenue: ${totalRevenue.toLocaleString()}`, 15, 96, { maxWidth: 180 });
      doc.text(`Average Order Value: ${avgOrderValue.toFixed(2)}`, 15, 104, { maxWidth: 180 });

      // Orders table header
      let yPosition = 120;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Order Details:', 15, yPosition, { maxWidth: 180 });
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text('Order ID', 15, yPosition, { maxWidth: 20 });
      doc.text('Customer', 35, yPosition, { maxWidth: 30 });
      doc.text('Phone', 65, yPosition, { maxWidth: 30 });
      doc.text('Date', 95, yPosition, { maxWidth: 25 });
      doc.text('Type', 120, yPosition, { maxWidth: 20 });
      doc.text('Mode', 140, yPosition, { maxWidth: 20 });
      doc.text('Items', 160, yPosition, { maxWidth: 30 });
      doc.text('Amount', 190, yPosition, { maxWidth: 25 });
      yPosition += 5;

      // Draw line
      doc.line(15, yPosition, 205, yPosition);
      yPosition += 8;

      // Orders data
      doc.setFont("helvetica", "normal");
      filteredOrders.forEach((order, index) => {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(order.orderId.toString(), 15, yPosition, { maxWidth: 20 });
        doc.text((order.userId?.name || 'Unknown').substring(0, 15), 35, yPosition, { maxWidth: 30 });
        doc.text(order.userId?.phone || 'N/A', 65, yPosition, { maxWidth: 30 });
        doc.text(new Date(order.createdAt).toLocaleDateString(), 95, yPosition, { maxWidth: 25 });
        doc.text(order.orderType, 120, yPosition, { maxWidth: 20 });
        doc.text(order.isPreOrder ? 'Preorder' : 'Instant', 140, yPosition, { maxWidth: 20 });
        const itemsText = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
        doc.text(itemsText, 160, yPosition, { maxWidth: 30 });
        doc.text(`${order.total.toLocaleString()}`, 190, yPosition, { maxWidth: 25 });
        yPosition += 10;
      });

      // Add Total Profit
      yPosition += 10;
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text('Total Profit:', 15, yPosition, { maxWidth: 180 });
      doc.setFont("helvetica", "normal");
      doc.text(`${totalRevenue.toLocaleString()}`, 190, yPosition, { maxWidth: 25 });

      doc.save(`GGU-Foodie-History-${useCustomDate ? 'Custom' : `${months[selectedMonth]}-${selectedYear}`}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateExcel = () => {
    setIsGenerating(true);
    try {
      const worksheetData = filteredOrders.map(order => ({
        'Order ID': order.orderId,
        'Customer': order.userId?.name || 'Unknown',
        'Phone': order.userId?.phone || 'N/A',
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Type': order.orderType,
        'Mode': order.isPreOrder ? 'Preorder' : 'Instant',
        'Items': order.items.map(item => `${item.name} (x${item.quantity})`).join(', '),
        'Amount': `${order.total.toLocaleString()}`,
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Order History');

      // Add summary
      const summaryData = [
        { 'Summary': 'Total Orders', 'Value': totalOrders },
        { 'Summary': 'Total Revenue', 'Value': `${totalRevenue.toLocaleString()}` },
        { 'Summary': 'Average Order Value', 'Value': `${avgOrderValue.toFixed(2)}` },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      XLSX.writeFile(workbook, `GGU-Foodie-History-${useCustomDate ? 'Custom' : `${months[selectedMonth]}-${selectedYear}`}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Error generating Excel. Please try again.');
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

  if (isLoading) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date Filter</label>
            <select
              value={useCustomDate ? 'custom' : 'month'}
              onChange={(e) => setUseCustomDate(e.target.value === 'custom')}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="month">Month/Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {useCustomDate ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
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
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Order Type Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="dining">Dine-in</option>
              <option value="takeaway">Takeaway</option>
            </select>
          </div>

          {/* Order Mode Filter (Preorder/Instant) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Order Mode</label>
            <select
              value={orderModeFilter}
              onChange={(e) => setOrderModeFilter(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="preorder">Preorder</option>
              <option value="instant">Instant</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, ID, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List (Mobile: Cards) */}
      <div className="space-y-3 sm:hidden">
        {filteredOrders.map((order) => (
          <div key={order.orderId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.orderType === 'dining'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {order.orderType === 'dining' ? 'Dine-in' : 'Takeaway'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.isPreOrder
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.isPreOrder ? 'Preorder' : 'Instant'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 truncate">{order.userId?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">{order.userId?.phone || 'N/A'}</div>
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
              <div className="text-sm font-bold text-gray-900">₹{order.total.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders Table (Desktop) */}
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
                  Items
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mode
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{order.userId?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{order.userId?.phone || 'N/A'}</div>
                    </div>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.orderType === 'dining'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {order.orderType === 'dining' ? 'Dine-in' : 'Takeaway'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.isPreOrder
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.isPreOrder ? 'Preorder' : 'Instant'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-gray-900">₹{order.total.toLocaleString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredOrders.length === 0 && (
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

export default History;