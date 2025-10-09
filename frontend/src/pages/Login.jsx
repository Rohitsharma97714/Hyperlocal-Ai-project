// pages/Login.jsx
import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, loginProvider, loginAdmin } from "../api/auth";
import { AuthContext } from "../context/AuthContext";
import GoogleRoleSelection from "../components/GoogleRoleSelection";

const Login = () => {
  const [role, setRole] = useState("user"); // default role
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const hasProcessedGoogleLogin = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    console.log('Login useEffect running, location.search:', location.search);
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const user = params.get("user");
    const errorParam = params.get("error");

    console.log('Parsed params:', { token: !!token, user: !!user, errorParam });

    if (errorParam) {
      setError(errorParam);
      // Clean URL params
      window.history.replaceState({}, document.title, location.pathname);
      return;
    }

    if (!hasProcessedGoogleLogin.current && token && user) {
      console.log('Processing Google login');
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        console.log('Parsed user:', parsedUser);
        login({
          token,
          role: parsedUser.role,
          name: parsedUser.name,
          email: parsedUser.email,
          id: parsedUser.id,
        });
        hasProcessedGoogleLogin.current = true;
        // Clean URL params
        window.history.replaceState({}, document.title, location.pathname);

        // Redirect based on role
        if (parsedUser.role === "admin") {
          navigate("/admin-dashboard");
        } else if (parsedUser.role === "provider") {
          navigate("/provider-dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (e) {
        console.error('Error processing Google login:', e);
        setError("Invalid login data");
      }
    }
  }, [location.search, login, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (role === "user") response = await loginUser(formData);
      else if (role === "provider") response = await loginProvider(formData);
      else response = await loginAdmin(formData);

      login({
        token: response.data.token,
        role,
        name: response.data.user?.name || response.data.provider?.name || response.data.admin?.name,
        email: response.data.user?.email || response.data.provider?.email || response.data.admin?.email,
        id: response.data.user?.id || response.data.provider?.id || response.data.admin?.id,
      });

      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "provider") {
        navigate("/provider-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  const handleNavigateToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-2xl rounded-2xl p-6 sm:p-8 md:p-10 w-full max-w-md border border-gray-200">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your HyperLocal AI account</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-center text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Google Role Selection */}
        <GoogleRoleSelection />

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              I am a
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            >
              <option value="user">👤 User</option>
              <option value="provider">🏢 Service Provider</option>
              <option value="admin">⚙️ Admin</option>
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-gray-500 hover:text-gray-700 focus:outline-none text-sm sm:text-base"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right text-sm sm:text-base">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300 shadow-md"
          >
            Sign In
          </button>

          {/* Sign Up Link */}
          <div className="text-center text-sm sm:text-base">
            <p className="text-gray-600">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={handleNavigateToRegister}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
