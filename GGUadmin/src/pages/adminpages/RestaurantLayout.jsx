import React, { useState } from 'react';
import RestaurantSidebar from './RestaurantSidebar';
import { useNavigate } from 'react-router-dom';

function RestaurantLayout({ children, restaurantId }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-50">
      <RestaurantSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        restaurantId={restaurantId} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/restaurants')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to All Restaurants
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default RestaurantLayout;