import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Close profile dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
      setProfileOpen(false);
    }
  };

  // Attach event listener on mount and cleanup on unmount
  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);



  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */} 
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-yellow-600">
              HyperlocalAI
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            <button
              onClick={() => {
                if (user && (user.role === 'admin' || user.role === 'provider')) {
                  logout();
                  navigate('/login');
                } else {
                  navigate('/');
                }
              }}
              className="text-gray-700 hover:text-yellow-600 focus:outline-none"
            >
              Home
            </button>
            <Link to="/about" className="text-gray-700 hover:text-yellow-600">About</Link>
            <Link to="/services" className="text-gray-700 hover:text-yellow-600">Services</Link>
            <Link to="/contact" className="text-gray-700 hover:text-yellow-600">Contact</Link>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="profile-button flex items-center space-x-2 text-gray-700 hover:text-yellow-600 focus:outline-none"
                >
                  <span>{user.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                      to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'provider' ? '/provider-dashboard' : '/dashboard'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate('/');
                        setProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-yellow-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <button
              onClick={() => {
                if (user && (user.role === 'admin' || user.role === 'provider')) {
                  logout();
                  navigate('/login');
                } else {
                  navigate('/');
                }
                setIsOpen(false);
              }}
              className="block text-gray-700 hover:text-yellow-600 focus:outline-none"
            >
              Home
            </button>
            <Link to="/about" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:text-yellow-600">About</Link>
            <Link to="/services" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:text-yellow-600">Services</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className="block text-gray-700 hover:text-yellow-600">Contact</Link>
            {user ? (
              <div className="space-y-2">
                <div className="text-sm text-gray-500 px-2">Welcome, {user.name}</div>
                <Link
                  to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'provider' ? '/provider-dashboard' : '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-yellow-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setIsOpen(false);
                  }}
                  className="block w-full text-left text-gray-700 hover:text-yellow-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block text-white bg-blue-600 text-center py-2 rounded hover:bg-blue-700">Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
