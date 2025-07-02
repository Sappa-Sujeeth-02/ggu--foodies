import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Menu, ShoppingBag, Clock } from 'lucide-react';
import g from '../../assets/g.png';

function RestaurantSidebar({ isOpen, onClose, restaurantId }) {
  const menuItems = [
    { path: `/restaurants/${restaurantId}/overview`, icon: LayoutDashboard, label: 'Overview' },
    { path: `/restaurants/${restaurantId}/menu`, icon: Menu, label: 'Menu' },
    { path: `/restaurants/${restaurantId}/orders`, icon: ShoppingBag, label: 'Orders' },
    { path: `/restaurants/${restaurantId}/history`, icon: Clock, label: 'History' },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-red-600 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-red-700">
          <div className="flex items-center space-x-2">
            <img src={g} alt="GGU Logo" className="h-8 w-8 bg-white rounded-full" />
            <span className="text-xl font-bold text-white">GGU Foodies</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:bg-red-500 p-2 rounded-md"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => window.innerWidth < 1024 && onClose()}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-red-600 shadow-md' 
                      : 'text-white hover:bg-red-500 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

export default RestaurantSidebar;