import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CartPage from './pages/CartPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import HomePage from './pages/HomePage';
import About from './pages/About';
import Profile from './pages/auth/Profile';
import FoodCourtsPage from './pages/FoodCourtsPage';
import SearchPage from './pages/SearchPage';
import './index.css';
import ScrollToTop from './components/ScrollToTop';
import OrderSuccessPage from './components/OrderSuccessPage';
import Orders from './pages/Orders';
import Terms from './pages/auth/Terms';
import Privacy from './pages/auth/Privacy';
import Shipping from './pages/auth/Shipping';
import Contact from './pages/auth/Contact';
import Refunds from './pages/auth/Refunds';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <Toaster
            containerClassName="toast-container"
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/food-courts" element={<ProtectedRoute><FoodCourtsPage /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/order-success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/contact" element={<ErrorBoundary><Contact /></ErrorBoundary>} />
            <Route path="/refunds" element={<Refunds />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;