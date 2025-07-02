import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  Edit,
  Eye,
  EyeOff,
  Star,
  Leaf,
  ChefHat,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useContext } from 'react';
import { RestaurantContext } from '../../context/RestaurantContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import toast from 'react-hot-toast';

function Menu() {
  const { rToken, backendURL } = useContext(RestaurantContext);
  const [foodItems, setFoodItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterVeg, setFilterVeg] = useState('all');
  const [editItem, setEditItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const menuContainerRef = useRef(null);
  const mainContainerRef = useRef(null);
  const navigate = useNavigate(); // Initialize navigate

  const categories = [
    'All',
    'Beverages',
    'Breakfast Items',
    'Noodles & Fried Rice',
    'Biryanis & Meals',
    'Chicken Specials',
    'Veg Specials & Curries',
    'Egg Dishes',
    'Snacks/Sides',
  ];

  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${backendURL}/api/restaurant/menu`, {
          headers: { rtoken: rToken },
        });
        if (response.data.success) {
          setFoodItems(response.data.foodItems);
        } else {
          toast.error(response.data.message || 'Failed to fetch menu');
        }
      } catch (error) {
        toast.error('Failed to fetch menu');
      } finally {
        setIsLoading(false);
      }
    };
    if (rToken) {
      fetchMenu();
    }
  }, [rToken, backendURL]);

  useEffect(() => {
    if (editItem || deleteItem || isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editItem, deleteItem, isFilterOpen]);

  const toggleAvailability = async (itemId, event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent navigation
    const windowScrollPosition = window.scrollY;
    const containerScrollPosition = menuContainerRef.current ? menuContainerRef.current.scrollTop : 0;
    const mainScrollPosition = mainContainerRef.current ? mainContainerRef.current.scrollTop : 0;

    try {
      const item = foodItems.find((item) => item.id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }
      const response = await axios.put(
        `${backendURL}/api/restaurant/menu/${itemId}`,
        { availability: !item.isAvailable },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setFoodItems(
          foodItems.map((item) =>
            item.id === itemId
              ? { ...item, isAvailable: response.data.foodItem.isAvailable }
              : item
          )
        );
        setTimeout(() => {
          if (mainContainerRef.current) {
            mainContainerRef.current.scrollTop = mainScrollPosition;
          }
          if (menuContainerRef.current) {
            menuContainerRef.current.scrollTop = containerScrollPosition;
          }
          window.scrollTo(0, windowScrollPosition);
        }, 50);
        toast.success(`Availability set to ${response.data.foodItem.isAvailable ? 'Available' : 'Not Available'}`);
      } else {
        toast.error(response.data.message || 'Failed to update availability');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    }
  };

  const toggleCategoryAvailability = async (category, isAvailable, event) => {
    event.preventDefault();
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/menu/category/${category}`,
        { availability: isAvailable },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setFoodItems(
          foodItems.map((item) =>
            item.category === category
              ? { ...item, isAvailable }
              : item
          )
        );
        toast.success(`Category ${category} set to ${isAvailable ? 'Available' : 'Not Available'}`);
      } else {
        toast.error(response.data.message || 'Failed to update category availability');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category availability');
    }
  };

  const handleEditClick = (item, event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent navigation
    const windowScrollPosition = window.scrollY;
    const containerScrollPosition = menuContainerRef.current ? menuContainerRef.current.scrollTop : 0;
    const mainScrollPosition = mainContainerRef.current ? mainContainerRef.current.scrollTop : 0;

    setEditItem({ ...item });

    setTimeout(() => {
      if (mainContainerRef.current) {
        mainContainerRef.current.scrollTop = mainScrollPosition;
      }
      if (menuContainerRef.current) {
        menuContainerRef.current.scrollTop = containerScrollPosition;
      }
      window.scrollTo(0, windowScrollPosition);
    }, 50);
  };

  const handleDeleteClick = (item, event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent navigation
    setDeleteItem(item);
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete(
        `${backendURL}/api/restaurant/menu/${deleteItem.id}`,
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setFoodItems(foodItems.filter((item) => item.id !== deleteItem.id));
        setDeleteItem(null);
        toast.success('Food item deleted successfully');
      } else {
        toast.error(response.data.message || 'Failed to delete item');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${backendURL}/api/restaurant/menu/${editItem.id}`,
        {
          dishname: editItem.name,
          category: editItem.category,
          dineinPrice: editItem.price,
          takeawayPrice: editItem.takeawayPrice,
          foodtype: editItem.isVeg ? 'Vegetarian' : 'Non-Vegetarian',
          description: editItem.description,
          availability: editItem.isAvailable,
        },
        { headers: { rtoken: rToken } }
      );
      if (response.data.success) {
        setFoodItems(
          foodItems.map((item) =>
            item.id === editItem.id ? response.data.foodItem : item
          )
        );
        setEditItem(null);
        toast.success('Food item updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update item');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  const filteredItems = foodItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesVegFilter =
      filterVeg === 'all' ||
      (filterVeg === 'veg' && item.isVeg) ||
      (filterVeg === 'non-veg' && !item.isVeg);

    return matchesSearch && matchesCategory && matchesVegFilter;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  function FoodCard({ item }) {
    const handleCardClick = () => {
      navigate(`/restaurant-dashboard/menu/${item.id}`);
    };

    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden flex flex-col h-full cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-40 object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex space-x-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                item.isVeg ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              <Leaf className="w-3 h-3 inline mr-1" />
              {item.isVeg ? 'Veg' : 'Non-Veg'}
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => toggleAvailability(item.id, e)}
              className={`p-1.5 rounded-full ${
                item.isAvailable
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-500 hover:bg-gray-600'
              } text-white transition-colors duration-200`}
              title={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
              aria-label={item.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
            >
              {item.isAvailable ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-200 flex-1 pr-2 truncate">
              {item.name}
            </h3>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{item.rating.toFixed(1)}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">{item.category}</p>

          <div className="min-h-[40px] mb-2">
            {item.description && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-200">₹{item.price}</div>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Takeaway: +₹{item.takeawayPrice}
              </div>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                item.isAvailable ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {item.isAvailable ? 'Available' : 'Not Available'}
            </div>
          </div>

          <div className="flex space-x-2 mt-auto">
            <button
              onClick={(e) => handleEditClick(item, e)}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
              aria-label={`Edit ${item.name}`}
            >
              <Edit className="w-4 h-4" />
              <span>Edit Item</span>
            </button>
            <button
              onClick={(e) => handleDeleteClick(item, e)}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={mainContainerRef} className="p-3 sm:p-4 lg:p-6 space-y-4 bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-200">Menu Management</h1>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {filteredItems.length} items found
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="sm:hidden flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
            <span className="text-xs">{isFilterOpen ? 'Close' : 'Filters'}</span>
          </button>
        </div>
      </div>

      <div className="sm:hidden">
        <div
          className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
            isFilterOpen ? 'translate-x-0' : '-translate-x-full'
          } w-64 p-4 z-50`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-200">Filters</h2>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Food Type</label>
              <select
                value={filterVeg}
                onChange={(e) => setFilterVeg(e.target.value)}
                className="w-full px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">All Items</option>
                <option value="veg">Vegetarian Only</option>
                <option value="non-veg">Non-Vegetarian Only</option>
              </select>
            </div>
          </div>
        </div>
        {isFilterOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsFilterOpen(false)}
          ></div>
        )}
      </div>

      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search food items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filterVeg}
            onChange={(e) => setFilterVeg(e.target.value)}
            className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="all">All Items</option>
            <option value="veg">Vegetarian Only</option>
            <option value="non-veg">Non-Vegetarian Only</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-sm text-gray-500

 dark:text-gray-400 mt-2">Loading menu...</p>
        </div>
      ) : (
        <div
          ref={menuContainerRef}
          className="space-y-6"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {Object.keys(groupedItems).length > 0 ? (
            Object.keys(groupedItems).sort().map((category) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-200">{category}</h2>
                  <button
                    onClick={(e) => {
                      const isCategoryAvailable = groupedItems[category].some((item) => item.isAvailable);
                      toggleCategoryAvailability(category, !isCategoryAvailable, e);
                    }}
                    className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-200"
                    title={
                      groupedItems[category].some((item) => item.isAvailable)
                        ? 'Mark category as unavailable'
                        : 'Mark category as available'
                    }
                    aria-label={
                      groupedItems[category].some((item) => item.isAvailable)
                        ? `Mark ${category} as unavailable`
                        : `Mark ${category} as available`
                    }
                  >
                    {groupedItems[category].some((item) => item.isAvailable) ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-500" />
                    )}
                    <span>
                      {groupedItems[category].some((item) => item.isAvailable) ? 'Available' : 'Not Available'}
                    </span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {groupedItems[category].map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">No items found</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      )}

      {editItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">Edit Item</h2>
              <button
                onClick={() => setEditItem(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close edit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                >
                  {categories
                    .filter((cat) => cat !== 'All')
                    .map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: parseFloat(e.target.value) })}
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Takeaway Charge Price (₹)
                </label>
                <input
                  type="number"
                  value={editItem.takeawayPrice}
                  onChange={(e) =>
                    setEditItem({ ...editItem, takeawayPrice: parseFloat(e.target.value) })
                  }
                  onWheel={(e) => e.target.blur()}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  rows="3"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editItem.isVeg}
                  onChange={(e) => setEditItem({ ...editItem, isVeg: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded dark:border-gray-600"
                />
                <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Vegetarian</label>
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-200">Confirm Deletion</h2>
              <button
                onClick={() => setDeleteItem(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Close delete modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <span className="font-semibold">{deleteItem.name}</span>? This action cannot be undone.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 px-3 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;