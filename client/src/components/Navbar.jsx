import { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiLogout } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn, logout } = useContext(AuthContext);

    const toggleMenu = () => setIsOpen(!isOpen);

    const scrollToSection = (sectionId) => {
        if (location.pathname === '/') {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setIsOpen(false);
                setActiveSection(sectionId);
            }
        }
    };

    const handleLogoClick = () => {
        if (isLoggedIn && location.pathname === '/home') {
            navigate('/home');
        } else {
            navigate('/');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsOpen(false);
    };

    const isActive = (path) => location.pathname === path;
    const isSectionActive = (id) => location.pathname === '/' && activeSection === id;

    useEffect(() => {
        setActiveSection('');
    }, [location.pathname]);

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <button onClick={handleLogoClick} className="flex items-center space-x-2">
                        <img
                            src="/logo.png"
                            alt="GGU Foodies Logo"
                            className="w-10 h-10 rounded-lg"
                        />
                        <span className="text-xl font-bold text-primary-500">GGU Foodies</span>
                    </button>

                    <div className="hidden md:flex items-center space-x-8 ml-auto">
                        <div className="relative">
                            {location.pathname === '/' ? (
                                <button
                                    onClick={() => scrollToSection('top')}
                                    className={`text-gray-700 hover:text-primary-600 font-medium ${isActive('/') && activeSection === '' ? 'text-primary-600' : ''}`}
                                >
                                    Home
                                    {isActive('/') && activeSection === '' && (
                                        <span className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-primary-600"></span>
                                    )}
                                </button>
                            ) : (
                                <Link
                                    to="/"
                                    className={`text-gray-700 hover:text-primary-600 font-medium ${isActive('/') ? 'text-primary-600' : ''}`}
                                >
                                    Home
                                </Link>
                            )}
                        </div>

                        <div className="relative">
                            {location.pathname === '/' ? (
                                <button
                                    onClick={() => {
                                        if (isLoggedIn) {
                                            navigate('/home');
                                        } else {
                                            navigate('/login');
                                        }
                                    }}
                                    className={`text-gray-700 hover:text-primary-600 font-medium ${isSectionActive('food-courts') ? 'text-primary-600' : ''}`}
                                >
                                    All Food Courts
                                    {isSectionActive('food-courts') && (
                                        <span className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-primary-600"></span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (isLoggedIn) {
                                            navigate('/home');
                                        } else {
                                            navigate('/login');
                                        }
                                    }}
                                    className="text-gray-700 hover:text-primary-600 font-medium"
                                >
                                    All Food Courts
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            <Link
                                to="/about"
                                className={`text-gray-700 hover:text-primary-600 font-medium ${isActive('/about') ? 'text-primary-600' : ''}`}
                            >
                                About
                                {isActive('/about') && (
                                    <span className="absolute bottom-[-4px] left-0 w-full h-0.5 bg-primary-600"></span>
                                )}
                            </Link>
                        </div>

                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="text-gray-700 hover:text-red-600 font-medium flex items-center space-x-1"
                            >
                                <HiLogout className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="text-gray-700 hover:text-primary-600 font-medium"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={toggleMenu}
                            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed inset-y-0 right-0 w-64 bg-white z-50 md:hidden shadow-lg"
                        >
                            <div className="flex flex-col h-full">
                                <div className="p-4 flex justify-end">
                                    <button
                                        onClick={toggleMenu}
                                        className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                    >
                                        <HiX className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                                    {location.pathname === '/' ? (
                                        <button
                                            onClick={() => scrollToSection('top')}
                                            className={`block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left ${isActive('/') && activeSection === '' ? 'text-primary-600' : ''}`}
                                        >
                                            Home
                                            {isActive('/') && activeSection === '' && (
                                                <span className="inline-block mt-1 w-auto h-0.5 bg-primary-600"></span>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            to="/"
                                            className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Home
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (isLoggedIn) {
                                                navigate('/home');
                                            } else {
                                                navigate('/login');
                                            }
                                            setIsOpen(false);
                                        }}
                                        className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                                    >
                                        All Food Courts
                                    </button>

                                    <Link
                                        to="/about"
                                        className={`block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left ${isActive('/about') ? 'text-primary-600' : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        About
                                        {isActive('/about') && (
                                            <span className="inline-block mt-1 w-auto h-0.5 bg-primary-600"></span>
                                        )}
                                    </Link>

                                    {isLoggedIn ? (
                                        <button
                                            onClick={handleLogout}
                                            className="block px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded-md w-full text-left flex items-center space-x-1"
                                        >
                                            <HiLogout className="w-5 h-5" />
                                            <span>Logout</span>
                                        </button>
                                    ) : (
                                        <>
                                            <Link
                                                to="/login"
                                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Login
                                            </Link>
                                            <Link
                                                to="/signup"
                                                className="block px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md w-full text-left"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                Sign Up
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;