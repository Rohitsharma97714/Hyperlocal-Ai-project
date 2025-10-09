import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount, check localStorage for user info
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const id = localStorage.getItem('id');
    console.log('AuthContext: Initializing from localStorage:', { token: !!token, role, name, email, id });
    if (token && role && name && id) {
      const userData = { token, role, name, email, id };
      setUser(userData);
      console.log('AuthContext: User initialized from localStorage:', userData);
    } else {
      console.log('AuthContext: No valid user data in localStorage');
    }
    // Set loading to false after initialization
    setIsLoading(false);
  }, []);

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      console.log('Token expiration check:', {
        exp: payload.exp,
        currentTime,
        isExpired,
        timeLeft: payload.exp - currentTime
      });
      return isExpired;
    } catch (error) {
      console.log('Token decode error:', error);
      return true; // If we can't decode, assume expired
    }
  };

  // Check token validity periodically (but not on mount to avoid logout on refresh)
  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        logout();
      }
    };

    // Check every 5 minutes (but not immediately on mount)
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const login = useCallback((userData) => {
    if (!userData) {
      // Handle logout case when userData is null
      logout();
      return;
    }
    console.log('AuthContext: Setting user data:', userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('name', userData.name);
    localStorage.setItem('email', userData.email || '');
    localStorage.setItem('id', userData.id || '');
    setUser({
      token: userData.token,
      role: userData.role,
      name: userData.name,
      email: userData.email || '',
      id: userData.id || ''
    });
    console.log('AuthContext: User state updated:', userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('id');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
