import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isLoading } = useContext(AuthContext);

  console.log('ProtectedRoute: Checking user:', user);
  console.log('ProtectedRoute: Allowed roles:', allowedRoles);
  console.log('ProtectedRoute: Is loading:', isLoading);

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading spinner');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have the right role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: User role not allowed, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: User authenticated, rendering component');
  // User is authenticated and has the right role, render the component
  return children;
};

export default ProtectedRoute;
