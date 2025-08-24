import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import EmissionTracker from "./pages/EmissionTracker";
import DigitalTwin from "./pages/DigitalTwin";
import CarbonMarketplace from "./pages/CarbonMarketplace";
import Analytics from "./pages/Analytics";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/emissions" element={<EmissionTracker />} />
            <Route path="/digital-twin" element={<DigitalTwin />} />
            <Route path="/marketplace" element={<CarbonMarketplace />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
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
}

export default App;
