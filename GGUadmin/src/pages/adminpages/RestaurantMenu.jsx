import React, { useState, useEffect, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Search } from 'lucide-react';

function RestaurantMenu({ restaurantId }) {
  const { backendURL, aToken } = useContext(AdminContext);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${backendURL}/api/admin/restaurant/${restaurantId}/menu`, {
          headers: { aToken },
        });

        console.log('Menu items received:', data.menuItems);

        if (data.success) {
          setMenuItems(data.menuItems);
        } else {
          toast.error(data.message || 'Failed to fetch menu items');
        }
      } catch (error) {
        console.error('Fetch menu error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to fetch menu items');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId, backendURL, aToken]);

  // Group menu items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Filter items based on search term
  const filteredGroupedItems = Object.keys(groupedItems).reduce((acc, category) => {
    const filtered = groupedItems[category].filter(
      (item) =>
        item.dishname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {});

  // Render star symbols based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    // Fill remaining stars (up to 5) with empty stars
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }
    
    return stars;
  };

  if (loading) {
    return <div className="text-center py-12">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Restaurant Menu</h1>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search menu items or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {Object.keys(filteredGroupedItems).length > 0 ? (
        Object.keys(filteredGroupedItems).sort().map((category) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b-2 border-gray-200 pb-2">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroupedItems[category].map((item) => (
                <div key={item.foodItemId} className="bg-white rounded-xl shadow-sm p-6">
                  <img
                    src={item.dishphoto || 'https://via.placeholder.com/150'}
                    alt={item.dishname}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">{item.dishname}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  <div className="mt-2 flex justify-between">
                    <span className="text-sm font-medium">Dine-in: ₹{item.dineinPrice}</span>
                    <span className="text-sm font-medium">Takeaway: ₹{item.takeawayPrice}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Total Orders: {item.totalOrders}</span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm font-medium mr-2">Rating: {item.rating.toFixed(1)}</span>
                    {renderStars(item.rating)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center col-span-full py-12">
          <p className="text-gray-500">No menu items or categories found</p>
        </div>
      )}
    </div>
  );
}

export default RestaurantMenu;