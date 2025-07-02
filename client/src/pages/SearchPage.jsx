import { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiSearch,
    HiX,
    HiStar,
    HiClock,
    HiPlus,
    HiShoppingCart,
    HiHome,
    HiOfficeBuilding,
    HiClipboardList,
    HiUser,
    HiChevronDown,
    HiChevronUp,
    HiXCircle,
    HiLogout,
    HiEye
} from 'react-icons/hi';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const SearchPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { searchQuery: initialSearchQuery, scrollToItemId } = location.state || { searchQuery: '' };
    const [searchInput, setSearchInput] = useState(initialSearchQuery || '');
    const [foodCourts, setFoodCourts] = useState([]);
    const [foodItems, setFoodItems] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [isReplacePopupOpen, setIsReplacePopupOpen] = useState(false);
    const [newItemToAdd, setNewItemToAdd] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('success');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [categories, setCategories] = useState(['All Categories']);
    const [categoryOpenState, setCategoryOpenState] = useState({});
    const [itemSearchQuery, setItemSearchQuery] = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [userName, setUserName] = useState('');
    const searchInputRef = useRef(null);
    const {
        updateCart,
        cartItems: contextCartItems,
        cartCount: contextCartCount,
        logout
    } = useContext(AuthContext);
    const foodItemRefs = useRef({});
    const topRef = useRef(null);
    const isInitialMount = useRef(true);
    const categoryToggleStateRef = useRef({});
    const currentFoodCourtRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    const showPopup = (message, type) => {
        setPopupMessage(message);
        setPopupType(type);
        setIsPopupOpen(true);
        setTimeout(() => setIsPopupOpen(false), 3000);
    };

    const processFoodCourts = (restaurantsData) => {
        return restaurantsData.map((restaurant, index) => ({
            id: index + 1,
            name: restaurant.restaurantname,
            restaurantname: restaurant.restaurantname,
            image: restaurant.image,
            address: restaurant.address,
            description: `A delightful food court at ${restaurant.address}.`,
            isOpen: restaurant.availability,
            availability: restaurant.availability,
            rating: parseFloat(restaurant.rating.toFixed(1)),
            time: '20-30 min'
        }));
    };

    const processFoodItems = (foodItemsData) => {
        return foodItemsData.map(item => ({
            _id: item._id,
            name: item.dishname,
            image: item.dishphoto,
            court: item.restaurantid.restaurantname,
            category: item.category,
            price: item.dineinPrice,
            description: item.description,
            isAvailable: item.availability,
            availability: item.availability,
            rating: parseFloat(item.rating.toFixed(1))
        }));
    };

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUserName(response.data.name);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [response, responseItems] = await Promise.all([
                axios.get(`/api/restaurant/restaurants`),
                axios.get(`/api/restaurant/all-food-items`),
            ]);

            if (response.data.success) {
                const updatedFoodCourts = processFoodCourts(response.data.restaurants);
                setFoodCourts(updatedFoodCourts);

                // Check if selected court is closed
                if (selectedCourt) {
                    const currentCourt = updatedFoodCourts.find(
                        court => court.restaurantname === selectedCourt.restaurantname
                    );

                    if (currentCourt && currentCourt.isOpen === false) {
                        showPopup(`${selectedCourt.restaurantname} is now temporarily closed.`, 'error');
                        handleClearCourt();
                        return;
                    }
                }

                // Handle location state changes
                if (location.state?.selectedCourt) {
                    const courtFromState = updatedFoodCourts.find(
                        court => court.restaurantname === location.state.selectedCourt.restaurantname
                    );
                    if (courtFromState && !courtFromState.isOpen) {
                        showPopup(`${courtFromState.restaurantname} is temporarily closed.`, 'error');
                        return;
                    }
                }
            } else {
                throw new Error('Failed to fetch food courts');
            }

            if (responseItems.data.success) {
                const updatedFoodItems = processFoodItems(responseItems.data.foodItems);
                setFoodItems(updatedFoodItems);

                // Update selected items based on current view
                if (selectedCourt) {
                    // If viewing items from a specific food court
                    const courtItems = updatedFoodItems.filter(
                        item => item.court === selectedCourt.restaurantname
                    );
                    setSelectedItems(courtItems);
                } else if (selectedItems.length > 0 && !selectedCourt) {
                    // If viewing items with same name from different courts
                    const itemName = selectedItems[0].name;
                    const relatedItems = updatedFoodItems.filter(item =>
                        item.name.toLowerCase() === itemName.toLowerCase()
                    );
                    setSelectedItems(relatedItems);
                }

                const uniqueCategories = ['All Categories', ...new Set(updatedFoodItems.map(item => item.category))];
                setCategories(uniqueCategories);
            } else {
                throw new Error('Failed to fetch food items');
            }
            setFetchError('');
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setFetchError('Failed to load food courts or items. Please try again later.');
            showPopup('Failed to load food courts or items', 'error');
        }
    };

    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }
        // Only start polling if there's a search input, selected items, or selected court
        if (searchInput || selectedItems.length > 0 || selectedCourt) {
            pollingIntervalRef.current = setInterval(fetchData, 5000);
        }
    };

    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        fetchUserProfile();
        fetchData();
        startPolling();

        return () => stopPolling();
    }, []);

    useEffect(() => {
        if (selectedCourt || searchInput || selectedItems.length > 0) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [selectedCourt, searchInput, selectedItems]);

    useEffect(() => {
        if (isInitialMount.current && location.state?.selectedCourt) {
            isInitialMount.current = false;
            const court = foodCourts.find(fc => fc.restaurantname === location.state.selectedCourt.restaurantname);
            if (court) {
                if (!court.isOpen) {
                    showPopup(`${court.restaurantname} is temporarily closed.`, 'error');
                    handleClearCourt();
                    return;
                }
                setSelectedCourt(court);
                setSearchInput(court.restaurantname);
                currentFoodCourtRef.current = court.restaurantname;
                const courtItems = foodItems.filter(item => item.court === court.restaurantname);
                setSelectedItems(courtItems);
            }
        }
    }, [foodCourts, foodItems, location.state]);

    useEffect(() => {
        if (scrollToItemId && foodItemRefs.current[scrollToItemId]) {
            foodItemRefs.current[scrollToItemId].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            navigate(location.pathname, {
                replace: true,
                state: { ...location.state, scrollToItemId: undefined }
            });
        }
    }, [scrollToItemId, location, navigate]);

    useEffect(() => {
        if (searchInput && !selectedItems.length && !selectedCourt) {
            const filteredCourts = foodCourts.filter(court =>
                court.restaurantname.toLowerCase().includes(searchInput.toLowerCase())
            );
            const filteredItems = foodItems.filter(item =>
                item.name.toLowerCase().includes(searchInput.toLowerCase())
            );
            setSuggestions([...filteredItems, ...filteredCourts]);
        } else {
            setSuggestions([]);
        }
    }, [searchInput, foodCourts, foodItems, selectedItems, selectedCourt]);

    useEffect(() => {
        if (selectedCourt) {
            const newCategoryState = {};
            categories
                .filter(cat => cat !== 'All Categories')
                .forEach(cat => {
                    const storedState = categoryToggleStateRef.current[`${currentFoodCourtRef.current}_${cat}`];
                    newCategoryState[cat] = storedState !== undefined ? storedState : true;
                });
            setCategoryOpenState(newCategoryState);
        }
    }, [selectedCourt, categories]);

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            setSelectedItems([]);
            setSelectedCourt(null);
            setSuggestions([]);
            setItemSearchQuery('');
            setSelectedCategory('All Categories');
            navigate('/search', { replace: true });
            startPolling();
        }
    };

    const clearSearch = () => {
        setSearchInput('');
        setSuggestions([]);
        setSelectedItems([]);
        setSelectedCourt(null);
        setItemSearchQuery('');
        setSelectedCategory('All Categories');
        navigate('/search', { replace: true, state: {} });
        stopPolling();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        if (suggestion.availability === false) {
            showPopup(
                suggestion.price
                    ? `${suggestion.name} is temporarily not available.`
                    : `${suggestion.restaurantname} is temporarily closed.`,
                'error'
            );
            return;
        }

        setSearchInput(suggestion.name || suggestion.restaurantname);
        setSuggestions([]);

        if (suggestion.price) {
            const relatedItems = foodItems.filter(item =>
                item.name.toLowerCase() === suggestion.name.toLowerCase()
            );
            setSelectedItems(relatedItems);
            setSelectedCourt(null);
            navigate('/search', { replace: true, state: { searchQuery: suggestion.name } });
            startPolling();
        } else {
            const court = foodCourts.find(fc => fc.restaurantname === suggestion.restaurantname);
            if (court) {
                if (!court.isOpen) {
                    showPopup(`${court.restaurantname} is temporarily closed.`, 'error');
                    return;
                }
                setSelectedCourt(court);
                currentFoodCourtRef.current = court.restaurantname;
                const courtItems = foodItems.filter(item => item.court === suggestion.restaurantname);
                setSelectedItems(courtItems);
                navigate('/search', {
                    replace: true,
                    state: { searchQuery: court.restaurantname, selectedCourt: court }
                });
                startPolling();
            }
        }
    };

    const handleAddItem = async (item) => {
        if (!item.isAvailable) {
            showPopup('This item is temporarily not available.', 'error');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (contextCartItems.length > 0) {
                const existingCourt = contextCartItems[0].restaurant;
                if (existingCourt && item.court !== existingCourt) {
                    setNewItemToAdd(item);
                    setIsReplacePopupOpen(true);
                    return;
                }
            }
            const response = await axios.post(
                `/api/cart/add`,
                { foodItemId: item._id, quantity: 1 },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            updateCart(response.data.items);
            showPopup('Item added to cart successfully!', 'success');
        } catch (error) {
            console.error('Add to cart error:', error);
            showPopup('Failed to add item to cart', 'error');
        }
    };

    const handleReplaceItem = async () => {
        if (newItemToAdd) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/cart/clear`, { headers: { Authorization: `Bearer ${token}` } });
                const response = await axios.post(
                    `/api/cart/add`,
                    { foodItemId: newItemToAdd._id, quantity: 1 },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                updateCart(response.data.items);
                showPopup('Cart updated with new food court items!', 'success');
            } catch (error) {
                console.error('Replace cart error:', error);
                showPopup('Failed to replace items in cart', 'error');
            } finally {
                setIsReplacePopupOpen(false);
                setNewItemToAdd(null);
            }
        }
    };

    const handleCancelReplace = () => {
        setIsReplacePopupOpen(false);
        setNewItemToAdd(null);
    };

    const handleCategoryToggle = (category) => {
        setCategoryOpenState(prev => {
            const newState = {
                ...prev,
                [category]: !prev[category]
            };
            if (currentFoodCourtRef.current) {
                categoryToggleStateRef.current[`${currentFoodCourtRef.current}_${category}`] = newState[category];
            }
            return newState;
        });
    };

    const handleFoodItemClick = (item) => {
        if (!item.isAvailable) {
            showPopup('This item is temporarily not available.', 'error');
            return;
        }
    };

    const handleClearCourt = () => {
        setSelectedCourt(null);
        setSelectedItems([]);
        setSearchInput('');
        setItemSearchQuery('');
        setSelectedCategory('All Categories');
        navigate('/search', { replace: true, state: {} });
        stopPolling();
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsProfileOpen(false);
    };

    const filteredItems = selectedCourt
        ? selectedItems.filter(item =>
            (itemSearchQuery ? item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) : true) &&
            (selectedCategory === 'All Categories' || item.category === selectedCategory)
        )
        : selectedItems;

    return (
        <div className="min-h-screen bg-white relative pb-16 md:pb-0">
            <nav className="bg-gradient-to-r from-primary-600 to-primary-700 text-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigate('/home')}
                                className="text-white hover:text-gray-200 flex items-center"
                            >
                                <HiHome className="w-6 h-6" />
                                <span className="ml-1 hidden sm:inline">Home</span>
                            </button>
                        </div>
                        <div className="flex items-center flex-1 justify-center mx-4">
                            <div className="relative w-full max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <HiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search food courts or items..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={handleSearch}
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-800 bg-white"
                                />
                                {searchInput && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    >
                                        <HiX className="h-5 w-5 text-gray-400 hover:text-red-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="relative hidden md:flex items-center space-x-2">
                                <Link to="/cart" className="relative flex items-center">
                                    <HiShoppingCart className="w-6 h-6 text-white hover:text-gray-200" />
                                    {contextCartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                            {contextCartCount}
                                        </span>
                                    )}
                                </Link>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                >
                                    <HiUser className="w-6 h-6 text-gray-600" />
                                    <span className="text-gray-600 text-sm font-medium hidden md:inline">
                                        {userName || 'Loading...'}
                                    </span>
                                </button>
                                <AnimatePresence>
                                    {isProfileOpen && (
                                        <motion.div
                                            initial={{ x: '100%' }}
                                            animate={{ x: 0 }}
                                            exit={{ x: '100%' }}
                                            transition={{ type: 'tween', duration: 0.3 }}
                                            className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50"
                                        >
                                            <div className="flex flex-col h-full">
                                                <div className="p-4 flex justify-end">
                                                    <button
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    >
                                                        <HiX className="w-6 h-6" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 px-4 py-2 space-y-1">
                                                    <Link
                                                        to="/profile"
                                                        className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        <HiEye className="w-4 h-4 inline mr-2" />
                                                        View Profile
                                                    </Link>
                                                    <Link
                                                        to="/orders"
                                                        className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        <HiClipboardList className="w-4 h-4 inline mr-2" />
                                                        Orders
                                                    </Link>
                                                    <Link
                                                        to="/cart"
                                                        className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        <HiShoppingCart className="w-4 h-4 inline mr-2" />
                                                        Cart ({contextCartCount})
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md w-full text-left"
                                                    >
                                                        <HiLogout className="w-4 h-4 inline mr-2" />
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div ref={topRef} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
                <AnimatePresence>
                    {fetchError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center max-w-md mx-auto"
                        >
                            {fetchError}
                        </motion.div>
                    )}
                </AnimatePresence>

                {searchInput && suggestions.length > 0 && !selectedCourt && (
                    <div className="mb-6">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer border-b ${suggestion.availability === false ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <img
                                    src={suggestion.image || suggestion.dishphoto}
                                    alt={suggestion.name || suggestion.restaurantname}
                                    className="w-24 h-24 object-cover rounded-lg mr-6"
                                />
                                <div className="text-xl font-medium">
                                    {suggestion.name || suggestion.restaurantname}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedCourt && (
                    <>
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                                <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                                    <button
                                        onClick={handleClearCourt}
                                        className="text-gray-600 hover:text-red-600 text-sm font-medium flex items-center"
                                    >
                                        <HiX className="w-4 h-4 mr-1" />
                                        Back
                                    </button>
                                    <span className="text-gray-600">/</span>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {selectedCourt.restaurantname}
                                    </h2>
                                </div>
                                <div className="relative w-full sm:w-[400px] md:w-[360px] lg:w-[500px] xl:w-[600px]">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <HiSearch className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        value={itemSearchQuery}
                                        onChange={(e) => setItemSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-800 bg-white"
                                    />
                                    {itemSearchQuery && (
                                        <button
                                            onClick={() => setItemSearchQuery('')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        >
                                            <HiX className="h-5 w-5 text-gray-400 hover:text-red-600" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="text-center mb-4">
                                <p className="text-gray-600">{selectedCourt.restaurantname}</p>
                                <div className="flex justify-center items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                        <HiStar className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-medium">{selectedCourt.rating || 4.5}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-gray-600">
                                        <HiClock className="w-4 h-4" />
                                        <span className="text-sm">20-30 min</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                <h2 className="text-2xl font-bold text-gray-800 text-center sm:text-left">
                                    Items at {selectedCourt.restaurantname}
                                </h2>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-48 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                                >
                                    {categories.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {filteredItems.length > 0 ? (
                                selectedCategory === 'All Categories' ? (
                                    categories
                                        .filter(cat => cat !== 'All Categories')
                                        .map(category => {
                                            const categoryItems = filteredItems.filter(
                                                item => item.category === category
                                            );
                                            return categoryItems.length > 0 ? (
                                                <div key={category} className="mb-4">
                                                    <button
                                                        onClick={() => handleCategoryToggle(category)}
                                                        className="w-full flex justify-between items-center py-2 px-4 bg-gradient-to-r from-red-500 to-red-500 hover:from-red-700 hover:to-red-700 rounded-lg text-white font-semibold transition-colors"
                                                    >
                                                        <h3 className="text-lg">{category}</h3>
                                                        {categoryOpenState[category] ? (
                                                            <HiChevronUp className="w-5 h-5" />
                                                        ) : (
                                                            <HiChevronDown className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                    <AnimatePresence>
                                                        {categoryOpenState[category] && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-2"
                                                            >
                                                                {categoryItems.map((item, index) => (
                                                                    <motion.div
                                                                        key={index}
                                                                        ref={(el) => (foodItemRefs.current[item._id] = el)}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -20 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        whileHover={item.isAvailable ? { scale: 1.02 } : {}}
                                                                        onClick={() => handleFoodItemClick(item)}
                                                                        className={`bg-white rounded-xl shadow-md flex overflow-hidden transition-shadow h-48 ${item.isAvailable ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                                                    >
                                                                        <div className="flex-1 p-4 flex flex-col justify-between">
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                                                                                <p className="text-xs text-gray-600 mt-1">{item.category}</p>
                                                                                <p className="text-sm font-semibold text-gray-800 mt-1">
                                                                                    ₹{item.price !== undefined ? item.price : 'N/A'}
                                                                                </p>
                                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleAddItem(item);
                                                                                }}
                                                                                className={`mt-2 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors w-fit ${item.isAvailable ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                                                            >
                                                                                <HiPlus className="w-4 h-4" />
                                                                                <span className="text-sm">Add</span>
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex-shrink-0 w-40 h-full relative">
                                                                            <img
                                                                                src={item.image}
                                                                                alt={item.name}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                                                                                <HiStar className="w-4 h-4 text-yellow-500" />
                                                                                <span className="text-xs font-medium text-white">
                                                                                    {item.rating ? item.rating : 'N/A'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ) : null;
                                        })
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                        {filteredItems.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                ref={(el) => (foodItemRefs.current[item._id] = el)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                whileHover={item.isAvailable ? { scale: 1.02 } : {}}
                                                onClick={() => handleFoodItemClick(item)}
                                                className={`bg-white rounded-xl shadow-md flex overflow-hidden transition-shadow h-48 ${item.isAvailable ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                                            >
                                                <div className="flex-1 p-4 flex flex-col justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</p>
                                                        <p className="text-xs text-gray-600 mt-1">{item.category}</p>
                                                        <p className="text-sm font-semibold text-gray-800 mt-1">
                                                            ₹{item.price !== undefined ? item.price : 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAddItem(item);
                                                        }}
                                                        className={`mt-2 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors w-fit ${item.isAvailable ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                                    >
                                                        <HiPlus className="w-4 h-4" />
                                                        <span className="text-sm">Add</span>
                                                    </button>
                                                </div>
                                                <div className="flex-shrink-0 w-40 h-full relative">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                                                        <HiStar className="w-4 h-4 text-yellow-500" />
                                                        <span className="text-xs font-medium text-white">
                                                            {item.rating ? item.rating : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No items available yet for this category.</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {!selectedCourt && selectedItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                        {selectedItems.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                whileHover={item.isAvailable ? { scale: 1.02 } : {}}
                                onClick={() => handleFoodItemClick(item)}
                                className={`bg-white rounded-xl shadow-md flex overflow-hidden transition-shadow h-48 ${item.isAvailable ? 'hover:shadow-lg cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                            >
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-800 line-clamp-1">{item.name}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{item.court}</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">₹{item.price || 'N/A'}</p>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddItem(item);
                                        }}
                                        className={`mt-2 px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors w-fit ${item.isAvailable ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                                    >
                                        <HiPlus className="w-4 h-4" />
                                        <span className="text-sm">Add</span>
                                    </button>
                                </div>
                                <div className="flex-shrink-0 w-40 h-full relative">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black bg-opacity-50 px-2 py-1 rounded-lg">
                                        <HiStar className="w-4 h-4 text-yellow-500" />
                                        <span className="text-xs font-medium text-white">{item.rating || 'N/A'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {contextCartItems.length > 0 && (
                <div className="fixed bottom-16 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-50 bg-white border-t border-gray-200 p-4 shadow-lg mb-3 md:mb-0">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-medium">
                            {contextCartItems.length} item{contextCartItems.length > 1 ? 's' : ''} added
                        </span>
                        <Link
                            to="/cart"
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            View Cart
                        </Link>
                    </div>
                </div>
            )}

            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
                <div className="flex justify-around items-center">
                    <Link
                        to="/home"
                        className={`flex flex-col items-center py-2 ${location.pathname === '/home' ? 'text-red-600' : 'text-gray-600'}`}
                    >
                        <HiHome className="w-6 h-6" />
                        <span className="text-xs mt-1">Home</span>
                    </Link>
                    <Link
                        to="/food-courts"
                        className={`flex flex-col items-center py-2 ${location.pathname === '/food-courts' ? 'text-red-600' : 'text-gray-600'}`}
                    >
                        <HiOfficeBuilding className="w-6 h-6" />
                        <span className="text-xs mt-1">Food Courts</span>
                    </Link>
                    <Link
                        to="/orders"
                        className={`flex flex-col items-center py-2 ${location.pathname === '/orders' ? 'text-red-600' : 'text-gray-600'}`}
                    >
                        <HiClipboardList className="w-6 h-6" />
                        <span className="text-xs mt-1">Orders</span>
                    </Link>
                    <Link
                        to="/cart"
                        className={`flex flex-col items-center py-2 relative ${location.pathname === '/cart' ? 'text-red-600' : 'text-gray-600'}`}
                    >
                        <HiShoppingCart className="w-6 h-6" />
                        <span className="text-xs mt-1">Cart</span>
                        {contextCartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {contextCartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>

            <AnimatePresence>
                {isReplacePopupOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            className="p-4 rounded-lg shadow-lg bg-yellow-100 text-yellow-800 max-w-sm w-full"
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="flex flex-col items-center justify-between">
                                <p className="text-sm font-medium mb-4">Add items from the same food court or do you want to replace the items?</p>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={handleReplaceItem}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        Replace
                                    </button>
                                    <button
                                        onClick={handleCancelReplace}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isPopupOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            className={`p-4 rounded-lg shadow-lg max-w-sm w-full ${popupType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">{popupMessage}</p>
                                <button
                                    onClick={() => setIsPopupOpen(false)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    <HiX className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>
                {`
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        overflow-x: hidden;
                    }
                    .line-clamp-1 {
                        display: -webkit-box;
                        -webkit-line-clamp: 1;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .line-clamp-2 {
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .fixed.bottom-0 {
                        bottom: 0 !important;
                    }
                    .fixed.bottom-16 {
                        bottom: 4rem !important;
                    }
                    @media (min-width: 768px) {
                        .fixed.bottom-16 {
                            bottom: 0 !important;
                        }
                    }
                `}
            </style>
        </div>
    );
};

export default SearchPage;