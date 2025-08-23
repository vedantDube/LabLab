import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import EmissionTracker from "./pages/EmissionTracker";
import DigitalTwin from "./pages/DigitalTwin";
import CarbonMarketplace from "./pages/CarbonMarketplace";
import Analytics from "./pages/Analytics";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import "./App.css";

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key");
}

// Component that handles authenticated content
const AuthenticatedApp: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();

  // Clear wallet connection state on app startup
  useEffect(() => {
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    console.log("App started - wallet state cleared");
  }, []);

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {isSignedIn ? (
          <>
            <Navbar />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/emissions" element={<EmissionTracker />} />
                <Route path="/digital-twin" element={<DigitalTwin />} />
                <Route path="/marketplace" element={<CarbonMarketplace />} />
                <Route path="/analytics" element={<Analytics />} />
              </Routes>
            </main>
          </>
        ) : (
          <Routes>
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="*" element={<SignInPage />} />
          </Routes>
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey!}>
      <AuthenticatedApp />
    </ClerkProvider>
  );
}

export default App;
