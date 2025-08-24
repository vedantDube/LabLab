import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useUser, UserButton } from "@clerk/clerk-react";
import {
  HomeIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useUser();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if dark mode is saved in localStorage
    return localStorage.getItem("darkMode") === "true";
  });
  const [notifications, setNotifications] = useState(() => {
    // Check if notifications setting is saved in localStorage
    return localStorage.getItem("notifications") !== "false";
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Emissions", href: "/emissions", icon: ChartBarIcon },
    { name: "Digital Twin", href: "/digital-twin", icon: CubeIcon },
    { name: "Marketplace", href: "/marketplace", icon: ShoppingCartIcon },
    { name: "Analytics", href: "/analytics", icon: PresentationChartLineIcon },
  ];

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSettings = () => {
    setShowSettingsDropdown(!showSettingsDropdown);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    toast.success(newDarkMode ? "Dark mode enabled" : "Light mode enabled");
  };

  const toggleNotifications = () => {
    const newNotifications = !notifications;
    setNotifications(newNotifications);
    localStorage.setItem("notifications", newNotifications.toString());
    toast.success(
      newNotifications ? "Notifications enabled" : "Notifications disabled"
    );

    // Request notification permission if enabling
    if (newNotifications && "Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("CarbonTwin Notifications", {
            body: "You will now receive notifications from CarbonTwin",
            icon: "/favicon.ico",
          });
        }
      });
    }
  };

  const handleHelp = () => {
    setShowHelpModal(true);
    setShowSettingsDropdown(false);
    toast("Help & Support opened", {
      icon: "❓",
    });
  };

  const settingsMenuItems = [
    {
      label: notifications ? "Disable Notifications" : "Enable Notifications",
      icon: BellIcon,
      onClick: toggleNotifications,
    },
    {
      label: isDarkMode ? "Light Mode" : "Dark Mode",
      icon: isDarkMode ? SunIcon : MoonIcon,
      onClick: toggleDarkMode,
    },
    {
      label: "Help & Support",
      icon: QuestionMarkCircleIcon,
      onClick: handleHelp,
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                CarbonTwin
              </span>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden xl:inline">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-100 dark:bg-blue-900/50 rounded-md -z-10"
                      initial={false}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            {/* AI Status Indicator - Responsive visibility */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400 hidden md:inline">
                ChatGPT-5 Active
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 md:hidden">
                AI
              </span>
            </div>

            {/* User Greeting - Hide on small screens */}
            {user && (
              <div className="hidden lg:flex items-center text-sm text-gray-700 dark:text-gray-300">
                <span className="truncate max-w-32 xl:max-w-none">
                  Welcome, {user.firstName || user.username || "User"}!
                </span>
              </div>
            )}

            {/* Desktop User Controls */}
            <div
              className="hidden md:flex items-center space-x-2 relative"
              ref={settingsRef}
            >
              {/* Clerk User Button */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard:
                      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                    userButtonPopoverActionButton:
                      "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  },
                }}
                userProfileMode="navigation"
                userProfileUrl="/user-profile"
              />

              {/* Settings Button */}
              <button
                onClick={toggleSettings}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>

              {/* Settings Dropdown */}
              <AnimatePresence>
                {showSettingsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    style={{
                      maxHeight: "calc(100vh - 100px)",
                      right: "0",
                      top: "100%",
                    }}
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Settings
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Customize your experience
                        </p>
                      </div>

                      {settingsMenuItems.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            item.onClick();
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-left transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <item.icon className="h-4 w-4 mr-3" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {showMobileMenu ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile User Profile */}
              {user && (
                <div className="flex items-center space-x-3 px-3 py-3 border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8",
                        userButtonPopoverCard:
                          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                        userButtonPopoverActionButton:
                          "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                      },
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName || user.username || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Signed in
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile AI Status */}
              <div className="flex items-center space-x-3 px-3 py-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ChatGPT-5 AI Active
                </span>
              </div>

              {/* Mobile Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Settings
                  </p>
                  {settingsMenuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        item.onClick();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center px-3 py-3 text-sm text-left transition-colors duration-200 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Settings
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your display name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      toast.success("Profile updated successfully");
                      setShowProfileModal(false);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Help & Support
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Frequently Asked Questions
                  </h4>
                  <div className="space-y-2">
                    <div className="border border-gray-200 rounded-md p-3">
                      <p className="font-medium text-sm text-gray-900">
                        How do I connect my wallet?
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Go to the Analytics page and click the "Connect Wallet"
                        button. Make sure you have MetaMask installed.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-md p-3">
                      <p className="font-medium text-sm text-gray-900">
                        How do carbon credits work?
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Carbon credits represent verified reductions in
                        greenhouse gas emissions. Each credit equals one ton of
                        CO₂ equivalent.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-md p-3">
                      <p className="font-medium text-sm text-gray-900">
                        What is a Digital Twin?
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        A digital twin is a virtual representation of your
                        physical facility that helps track and optimize carbon
                        emissions.
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Contact Support
                  </h4>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        toast.success("Email support contacted");
                        setShowHelpModal(false);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Email Support
                    </button>
                    <button
                      onClick={() => {
                        toast.success("Opening live chat...");
                        setShowHelpModal(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Live Chat
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
