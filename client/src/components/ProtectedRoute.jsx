import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useContext(AuthContext);

    // Show loading state or nothing while checking auth status
    if (isLoggedIn === null) {
        return null; // or return a loading spinner
    }

    if (!isLoggedIn) {
        // Redirect to landing page if not logged in
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;