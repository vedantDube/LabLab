import React, { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/apiService";
import toast from "react-hot-toast";

const DigitalTwin: React.FC = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [facilityData, setFacilityData] = useState({
    type: "",
    size_sqft: "",
    industry: "",
    energy_systems: [] as string[],
    production_capacity: "",
    energy_kwh_month: "",
    current_emissions: "",
    equipment: [] as string[],
    location: "",
  });
  const [twinResult, setTwinResult] = useState<any>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const facilityTypes = [
    "Manufacturing",
    "Office",
    "Warehouse",
    "Data Center",
    "Retail",
    "Hospital",
    "School",
    "Other",
  ];
  const industries = [
    "Technology",
    "Manufacturing",
    "Healthcare",
    "Retail",
    "Energy",
    "Transportation",
    "Construction",
    "Other",
  ];
  const energySystems = [
    "Grid Electricity",
    "Solar Panels",
    "Wind Turbines",
    "Natural Gas",
    "Diesel Generators",
    "Battery Storage",
  ];
  const equipmentTypes = [
    "HVAC Systems",
    "Production Machinery",
    "Lighting",
    "Computers/IT",
    "Refrigeration",
    "Compressed Air",
    "Pumps",
    "Motors",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFacilityData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (field: string, value: string) => {
    setFacilityData((prev) => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter(
            (item) => item !== value
          )
        : [...(prev[field as keyof typeof prev] as string[]), value],
    }));
  };

  const createDigitalTwin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiService.createDigitalTwin({
        ...facilityData,
        size_sqft: parseFloat(facilityData.size_sqft),
        production_capacity: parseFloat(facilityData.production_capacity),
        energy_kwh_month: parseFloat(facilityData.energy_kwh_month),
        current_emissions: parseFloat(facilityData.current_emissions),
      });

      setTwinResult(result);
      toast.success("Digital twin created successfully!");
    } catch (error) {
      toast.error("Failed to create digital twin");
      console.error("Creation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!twinResult?.twin_id) {
      toast.error("Please create a digital twin first");
      return;
    }

    setLoading(true);
    try {
      const scenarios = [
        {
          name: "LED Lighting Upgrade",
          changes: {
            energy_efficiency_improvement: 15,
            implementation_cost: 50000,
            equipment_upgrades: ["LED lighting system"],
          },
        },
        {
          name: "Solar Panel Installation",
          changes: {
            renewable_energy_percentage: 40,
            implementation_cost: 200000,
            equipment_additions: ["Solar panel array", "Inverters"],
          },
        },
        {
          name: "HVAC Optimization",
          changes: {
            energy_efficiency_improvement: 25,
            implementation_cost: 75000,
            equipment_upgrades: [
              "Smart HVAC controls",
              "Variable speed drives",
            ],
          },
        },
      ];

      const result = await apiService.simulateScenarios(
        twinResult.twin_id,
        scenarios
      );
      setSimulationResults(result);
      toast.success("Simulation completed!");
    } catch (error) {
      toast.error("Simulation failed");
      console.error("Simulation error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔗 Digital Twin Carbon Simulator
        </h1>
        <p className="text-lg text-gray-600">
          Create virtual facility models and simulate carbon reduction scenarios
          with AI-powered insights
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "create", label: "Create Twin", icon: "🏗️" },
          { id: "simulate", label: "Run Simulation", icon: "⚡" },
          { id: "results", label: "View Results", icon: "📊" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Create Digital Twin Tab */}
      {activeTab === "create" && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create Facility Digital Twin
          </h2>

          <form onSubmit={createDigitalTwin} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Type *
                </label>
                <select
                  name="type"
                  value={facilityData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select facility type</option>
                  {facilityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  name="industry"
                  value={facilityData.industry}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (sq ft) *
                </label>
                <input
                  type="number"
                  name="size_sqft"
                  value={facilityData.size_sqft}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter facility size"
                  required
                />
              </div>
            </div>

            {/* Operational Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Production Capacity (units/month)
                </label>
                <input
                  type="number"
                  name="production_capacity"
                  value={facilityData.production_capacity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter production capacity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energy Consumption (kWh/month) *
                </label>
                <input
                  type="number"
                  name="energy_kwh_month"
                  value={facilityData.energy_kwh_month}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter monthly energy use"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Emissions (kg CO2/month)
                </label>
                <input
                  type="number"
                  name="current_emissions"
                  value={facilityData.current_emissions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current emissions"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={facilityData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, State/Country"
              />
            </div>

            {/* Energy Systems */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Energy Systems
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {energySystems.map((system) => (
                  <label
                    key={system}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={facilityData.energy_systems.includes(system)}
                      onChange={() =>
                        handleArrayChange("energy_systems", system)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{system}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Major Equipment
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equipmentTypes.map((equipment) => (
                  <label
                    key={equipment}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={facilityData.equipment.includes(equipment)}
                      onChange={() => handleArrayChange("equipment", equipment)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating with ChatGPT-5...</span>
                  </div>
                ) : (
                  "Create Digital Twin"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Simulation Tab */}
      {activeTab === "simulate" && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {twinResult ? (
            <>
              {/* Twin Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Digital Twin Summary
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Twin ID</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {twinResult.twin_id}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">
                      Baseline Emissions
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {twinResult.baseline_model?.validated_emissions?.toLocaleString()}{" "}
                      kg CO2/month
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800">
                      Efficiency Score
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {twinResult.baseline_model?.energy_efficiency || "N/A"}
                      /100
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Run Carbon Optimization Scenarios
                </h2>
                <p className="text-gray-600 mb-6">
                  Test different optimization strategies to see their impact on
                  carbon emissions and ROI
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">
                      💡 LED Lighting Upgrade
                    </h3>
                    <p className="text-sm text-blue-600">
                      15% energy efficiency improvement
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">
                      ☀️ Solar Panel Installation
                    </h3>
                    <p className="text-sm text-green-600">
                      40% renewable energy adoption
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800">
                      🌡️ HVAC Optimization
                    </h3>
                    <p className="text-sm text-purple-600">
                      25% HVAC efficiency improvement
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={runSimulation}
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Running AI Simulation...</span>
                    </div>
                  ) : (
                    "🚀 Run Comprehensive Simulation"
                  )}
                </motion.button>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-medium text-yellow-800 mb-2">
                ⚠️ No Digital Twin Found
              </h3>
              <p className="text-yellow-700">
                Please create a digital twin first in the "Create Twin" tab.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {simulationResults ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                🎯 Simulation Results
              </h2>

              {Object.entries(simulationResults.simulation_results || {}).map(
                ([scenarioName, results]: [string, any]) => (
                  <div
                    key={scenarioName}
                    className="bg-white rounded-xl shadow-lg p-6"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {scenarioName}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Carbon Impact */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-medium text-green-800">
                          Carbon Reduction
                        </h4>
                        <p className="text-2xl font-bold text-green-600">
                          {results.carbon_impact?.percentage_reduction?.toFixed(
                            1
                          ) || "N/A"}
                          %
                        </p>
                        <p className="text-sm text-green-600">
                          {results.carbon_impact?.annual_reduction_kg_co2?.toLocaleString() ||
                            "N/A"}{" "}
                          kg CO2/year
                        </p>
                      </div>

                      {/* ROI */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800">ROI</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {results.financial_analysis?.net_roi_percentage?.toFixed(
                            1
                          ) || "N/A"}
                          %
                        </p>
                        <p className="text-sm text-blue-600">
                          {results.financial_analysis?.payback_months || "N/A"}{" "}
                          months payback
                        </p>
                      </div>

                      {/* Implementation Cost */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-800">
                          Investment
                        </h4>
                        <p className="text-2xl font-bold text-purple-600">
                          $
                          {results.financial_analysis?.implementation_cost?.toLocaleString() ||
                            "N/A"}
                        </p>
                        <p className="text-sm text-purple-600">Initial cost</p>
                      </div>

                      {/* Risk Level */}
                      <div
                        className={`p-4 rounded-lg ${
                          results.risk_assessment?.overall_risk === "LOW"
                            ? "bg-green-50"
                            : results.risk_assessment?.overall_risk === "MEDIUM"
                            ? "bg-yellow-50"
                            : "bg-red-50"
                        }`}
                      >
                        <h4
                          className={`font-medium ${
                            results.risk_assessment?.overall_risk === "LOW"
                              ? "text-green-800"
                              : results.risk_assessment?.overall_risk ===
                                "MEDIUM"
                              ? "text-yellow-800"
                              : "text-red-800"
                          }`}
                        >
                          Risk Level
                        </h4>
                        <p
                          className={`text-2xl font-bold ${
                            results.risk_assessment?.overall_risk === "LOW"
                              ? "text-green-600"
                              : results.risk_assessment?.overall_risk ===
                                "MEDIUM"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {results.risk_assessment?.overall_risk || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div
                      className={`mt-4 p-4 rounded-lg ${
                        results.recommendation === "HIGHLY_RECOMMENDED"
                          ? "bg-green-100 border border-green-200"
                          : results.recommendation === "RECOMMENDED"
                          ? "bg-blue-100 border border-blue-200"
                          : results.recommendation === "CONSIDER"
                          ? "bg-yellow-100 border border-yellow-200"
                          : "bg-red-100 border border-red-200"
                      }`}
                    >
                      <h4
                        className={`font-medium ${
                          results.recommendation === "HIGHLY_RECOMMENDED"
                            ? "text-green-800"
                            : results.recommendation === "RECOMMENDED"
                            ? "text-blue-800"
                            : results.recommendation === "CONSIDER"
                            ? "text-yellow-800"
                            : "text-red-800"
                        }`}
                      >
                        AI Recommendation:{" "}
                        {results.recommendation?.replace(/_/g, " ") || "N/A"}
                      </h4>
                    </div>
                  </div>
                )
              )}

              {/* Comparative Analysis */}
              {simulationResults.comparative_analysis && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    📊 Comparative Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        🏆 Best Overall Scenario
                      </h4>
                      <p className="text-lg font-bold text-green-600">
                        {simulationResults.comparative_analysis.best_scenario}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        💰 Highest ROI
                      </h4>
                      <p className="text-lg font-bold text-blue-600">
                        {simulationResults.comparative_analysis.highest_roi}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-800 mb-2">
                📊 No Results Available
              </h3>
              <p className="text-gray-600">
                Run a simulation first to see detailed results and AI
                recommendations.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DigitalTwin;
