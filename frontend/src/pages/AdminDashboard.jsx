import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getPendingProviders,
  getPendingServices,
  getApprovedProviders,
  getApprovedServices,
  getRejectedProviders,
  updateAdminProfile,
  approveProvider,
  rejectProvider,
  approveService,
  rejectService,
} from "../api/admin";

export default function AdminDashboard() {
  const { user, logout, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [pendingProviders, setPendingProviders] = useState([]);
  const [pendingServices, setPendingServices] = useState([]);
  const [approvedProviders, setApprovedProviders] = useState([]);
  const [approvedServices, setApprovedServices] = useState([]);
  const [rejectedProviders, setRejectedProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  const [activeMainTab, setActiveMainTab] = useState(() => {
    return searchParams.get("mainTab") || "profile";
  });
  const [activeSubTab, setActiveSubTab] = useState(() => {
    return searchParams.get("subTab") || "pending";
  });

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Profile editing handlers
  const handleEditProfile = () => {
    setProfileForm({
      name: user.name,
      email: user.email,
    });
    setIsEditingProfile(true);
    setProfileError("");
    setProfileSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      name: user.name,
      email: user.email,
    });
    setProfileError("");
    setProfileSuccess("");
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      setProfileError("");
      setProfileSuccess("");

      const response = await updateAdminProfile(profileForm);

      // Update the user context with new data
      login({
        ...user,
        name: response.admin.name,
        email: response.admin.email,
      });

      setProfileSuccess("Profile updated successfully!");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileError(error.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // If user is not an admin or not logged in, show access denied
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 text-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    const mainTab = searchParams.get("mainTab") || "profile";
    const subTab = searchParams.get("subTab") || "pending";
    setActiveMainTab(mainTab);
    setActiveSubTab(subTab);
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        pendingProvidersData,
        pendingServicesData,
        approvedProvidersData,
        approvedServicesData,
        rejectedProvidersData,
      ] = await Promise.all([
        getPendingProviders(),
        getPendingServices(),
        getApprovedProviders(),
        getApprovedServices(),
        getRejectedProviders(),
      ]);

      setPendingProviders(pendingProvidersData);
      setPendingServices(pendingServicesData);
      setApprovedProviders(approvedProvidersData);
      setApprovedServices(approvedServicesData);
      setRejectedProviders(rejectedProvidersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm">
            ⏳ Pending
          </span>
        );
      case "approved":
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-sm">
            ✅ Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-400 to-pink-400 text-white shadow-sm">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const renderProviders = () => {
    let providers = [];
    if (activeSubTab === "pending") providers = pendingProviders;
    else if (activeSubTab === "approved") providers = approvedProviders;
    else if (activeSubTab === "rejected") providers = rejectedProviders;

    const getTabColor = () => {
      switch (activeSubTab) {
        case "pending": return "from-yellow-50 to-orange-50 border-yellow-200";
        case "approved": return "from-green-50 to-emerald-50 border-green-200";
        case "rejected": return "from-red-50 to-pink-50 border-red-200";
        default: return "from-gray-50 to-gray-50 border-gray-200";
      }
    };

    const handleApprove = async (providerId) => {
      const note = prompt("Enter approval note (optional):");
      try {
        await approveProvider(providerId, note || "");
        fetchDashboardData();
      } catch (error) {
        console.error("Error approving provider:", error);
        alert("Failed to approve provider.");
      }
    };

    const handleReject = async (providerId) => {
      const note = prompt("Enter rejection note (optional):");
      try {
        await rejectProvider(providerId, note || "");
        fetchDashboardData();
      } catch (error) {
        console.error("Error rejecting provider:", error);
        alert("Failed to reject provider.");
      }
    };

    return providers.length === 0 ? (
      <div className={`bg-gradient-to-br ${getTabColor()} rounded-xl p-8 text-center border`}>
        <div className="text-6xl mb-4">📋</div>
        <p className="text-gray-600 text-lg">No {activeSubTab} providers</p>
      </div>
    ) : (
      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider._id} className={`bg-gradient-to-r ${getTabColor()} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {provider.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{provider.name}</h3>
                    <p className="text-sm text-gray-600">{provider.company}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-1">📧 {provider.email}</p>
                <p className="text-xs text-gray-500">
                  📅 Created: {new Date(provider.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 space-y-2">
                {statusBadge(activeSubTab)}
                {activeSubTab === "pending" && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <button
                      onClick={() => handleApprove(provider._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(provider._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProfile = () => {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 max-w-lg mx-auto border border-purple-200">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-purple-800 mb-2">Admin Profile</h2>
          <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            {user.role}
          </div>
        </div>

        {profileError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {profileSuccess}
          </div>
        )}

        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Name</label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileFormChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your name"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Email</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileFormChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Role</label>
              <p className="mt-1 text-gray-900 font-medium">{user.role}</p>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={handleSaveProfile}
                disabled={profileLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Name</label>
              <p className="mt-1 text-gray-900 font-medium">{user.name}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Email</label>
              <p className="mt-1 text-gray-900 font-medium">{user.email}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <label className="block text-purple-700 font-semibold text-sm uppercase tracking-wide">Role</label>
              <p className="mt-1 text-gray-900 font-medium">{user.role}</p>
            </div>
            <div className="mt-6">
              <button
                onClick={handleEditProfile}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-md"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderServices = () => {
    let services = [];
    if (activeSubTab === "pending") services = pendingServices;
    else if (activeSubTab === "approved") services = approvedServices;

    const getTabColor = () => {
      switch (activeSubTab) {
        case "pending": return "from-yellow-50 to-orange-50 border-yellow-200";
        case "approved": return "from-green-50 to-emerald-50 border-green-200";
        default: return "from-gray-50 to-gray-50 border-gray-200";
      }
    };

    const handleApprove = async (serviceId) => {
      const note = prompt("Enter approval note (optional):");
      try {
        await approveService(serviceId, note || "");
        fetchDashboardData();
      } catch (error) {
        console.error("Error approving service:", error);
        alert("Failed to approve service.");
      }
    };

    const handleReject = async (serviceId) => {
      const note = prompt("Enter rejection note (optional):");
      try {
        const response = await rejectService(serviceId, note || "");
        alert("Service rejected and deleted successfully.");
        fetchDashboardData();
      } catch (error) {
        console.error("Error rejecting service:", error);
        alert("Failed to reject service.");
      }
    };

    return services.length === 0 ? (
      <div className={`bg-gradient-to-br ${getTabColor()} rounded-xl p-8 text-center border`}>
        <div className="text-6xl mb-4">🛠️</div>
        <p className="text-gray-600 text-lg">No {activeSubTab} services</p>
      </div>
    ) : (
      <div className="space-y-4">
        {services.map((service) => (
          <div key={service._id} className={`bg-gradient-to-r ${getTabColor()} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {service.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 mb-1">
                  <p className="text-sm text-gray-700">💰 ${service.price}</p>
                  <p className="text-sm text-gray-700">👤 {service.provider?.name || "Unknown"}</p>
                </div>
                <p className="text-xs text-gray-500">
                  📅 Created: {new Date(service.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="ml-4 space-y-2">
                {statusBadge(activeSubTab)}
                {activeSubTab === "pending" && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <button
                      onClick={() => handleApprove(service._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(service._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Manage the system and oversee operations
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
          >
            Logout
          </button>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex border-b border-gray-300">
            <button
              className={`px-4 py-2 font-semibold ${
                activeMainTab === "profile"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            onClick={() => {
              setActiveMainTab("profile");
              setSearchParams({ mainTab: "profile" });
            }}
            >
              Profile
            </button>
            <button
              className={`ml-4 px-4 py-2 font-semibold ${
                activeMainTab === "providers"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            onClick={() => {
              setActiveMainTab("providers");
              setSearchParams({ mainTab: "providers", subTab: activeSubTab });
            }}
            >
              Providers
            </button>
            <button
              className={`ml-4 px-4 py-2 font-semibold ${
                activeMainTab === "services"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            onClick={() => {
              setActiveMainTab("services");
              setSearchParams({ mainTab: "services", subTab: activeSubTab });
            }}
            >
              Services
            </button>
          </div>

          {/* Sub Tabs - Only show for providers and services */}
          {activeMainTab !== "profile" && (
            <div className="flex border-b border-gray-300 mt-4">
              {(activeMainTab === "services" ? ["pending", "approved"] : ["pending", "approved", "rejected"]).map((status) => (
                <button
                  key={status}
                  className={`px-4 py-2 font-semibold ${
                    activeSubTab === status
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-gray-600 hover:text-indigo-600"
                  }`}
                  onClick={() => {
                    setActiveSubTab(status);
                    setSearchParams({ mainTab: activeMainTab, subTab: status });
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="mt-6">
            {activeMainTab === "profile"
              ? renderProfile()
              : activeMainTab === "providers"
              ? renderProviders()
              : renderServices()}
          </div>
        </div>
      </div>
    </div>
  );
}
