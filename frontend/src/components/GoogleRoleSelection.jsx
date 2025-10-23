import React from 'react';

const GoogleRoleSelection = () => {
  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
    // Use current origin for local development, fallback to env for production
    const frontendUrl = window.location.origin;
    window.location.href = `${backendUrl}/api/auth/google?frontend_url=${encodeURIComponent(frontendUrl)}`;
  };

  return (
    <div className="mt-4 flex justify-center">
      <button
        onClick={handleGoogleLogin}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded flex items-center space-x-2"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path d="M21.35 11.1h-9.18v2.92h5.27c-.23 1.23-1.5 3.6-5.27 3.6-3.18 0-5.78-2.63-5.78-5.87s2.6-5.87 5.78-5.87c1.81 0 3.03.77 3.73 1.44l2.54-2.45C16.3 5.1 14.4 4.2 12 4.2 7.03 4.2 3 8.24 3 13.2s4.03 9 9 9c5.18 0 8.6-3.63 8.6-8.75 0-.59-.06-1.04-.25-1.55z" />
        </svg>
        <span>Sign in with Google (Customers only)</span>
      </button>
    </div>
  );
};

export default GoogleRoleSelection;
