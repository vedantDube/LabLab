import React, { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/apiService";
import toast from "react-hot-toast";

const EmissionTracker: React.FC = () => {
  const [formData, setFormData] = useState({
    company_id: "",
    facility_id: "",
    reported_emissions: "",
    energy_sources: [] as string[],
    production_volume: "",
    time_period: "",
    supporting_data: "",
  });

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const energyOptions = [
    "Grid Electricity",
    "Natural Gas",
    "Solar Power",
    "Wind Power",
    "Coal",
    "Nuclear",
    "Hydroelectric",
    "Biomass",
    "Geothermal",
    "Other",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEnergySourceChange = (source: string) => {
    setFormData((prev) => ({
      ...prev,
      energy_sources: prev.energy_sources.includes(source)
        ? prev.energy_sources.filter((s) => s !== source)
        : [...prev.energy_sources, source],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.company_id ||
      !formData.facility_id ||
      !formData.reported_emissions
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.verifyEmission({
        ...formData,
        reported_emissions: parseFloat(formData.reported_emissions),
        production_volume: parseFloat(formData.production_volume),
      });

      setVerificationResult(result);
      toast.success("Emission report submitted for AI verification!");
    } catch (error) {
      toast.error("Failed to submit emission report");
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🌍 Emission Tracker & AI Verification
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Submit emission reports for ChatGPT-5 powered verification and
          blockchain recording
        </p>
      </motion.div>

      {/* Emission Report Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Submit Emission Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company ID *
              </label>
              <input
                type="text"
                name="company_id"
                value={formData.company_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter company identifier"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Facility ID *
              </label>
              <input
                type="text"
                name="facility_id"
                value={formData.facility_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter facility identifier"
                required
              />
            </div>
          </div>

          {/* Emission Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reported Emissions (kg CO2) *
              </label>
              <input
                type="number"
                name="reported_emissions"
                value={formData.reported_emissions}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter total emissions in kg CO2"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Production Volume
              </label>
              <input
                type="number"
                name="production_volume"
                value={formData.production_volume}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter production volume"
                step="0.01"
              />
            </div>
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reporting Period
            </label>
            <select
              name="time_period"
              value={formData.time_period}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select reporting period</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* Energy Sources */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Energy Sources
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {energyOptions.map((source) => (
                <label
                  key={source}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.energy_sources.includes(source)}
                    onChange={() => handleEnergySourceChange(source)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {source}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Supporting Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supporting Data & Documentation
            </label>
            <textarea
              name="supporting_data"
              value={formData.supporting_data}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide additional context, methodology, or references to supporting documents..."
            />
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
                  <span>Verifying with ChatGPT-5...</span>
                </div>
              ) : (
                "Submit for AI Verification"
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Verification Results */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            🤖 ChatGPT-5 Verification Results
          </h2>

          <div className="space-y-6">
            {/* Verification Score */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Verification Score
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI confidence in report authenticity
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-3xl font-bold ${
                    verificationResult.verification_score >= 80
                      ? "text-green-600"
                      : verificationResult.verification_score >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {verificationResult.verification_score}/100
                </div>
                <div
                  className={`text-sm font-medium ${
                    verificationResult.confidence_level === "HIGH"
                      ? "text-green-600"
                      : verificationResult.confidence_level === "MEDIUM"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {verificationResult.confidence_level} Confidence
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div
              className={`p-4 rounded-lg ${
                verificationResult.verified
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-2xl">
                  {verificationResult.verified ? "✅" : "❌"}
                </span>
                <div>
                  <h3
                    className={`font-medium ${
                      verificationResult.verified
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {verificationResult.verified
                      ? "Report Verified"
                      : "Verification Failed"}
                  </h3>
                  <p
                    className={`text-sm ${
                      verificationResult.verified
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {verificationResult.verified
                      ? "Report passes AI authenticity checks"
                      : "Report requires manual review or additional documentation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Red Flags */}
            {verificationResult.red_flags &&
              verificationResult.red_flags.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    ⚠️ Identified Issues
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.red_flags.map(
                      (flag: string, index: number) => (
                        <li key={index} className="text-sm text-yellow-700">
                          {flag}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* Recommendations */}
            {verificationResult.recommendations &&
              verificationResult.recommendations.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">
                    💡 AI Recommendations
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.recommendations.map(
                      (rec: string, index: number) => (
                        <li key={index} className="text-sm text-blue-700">
                          {rec}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* Detailed Analysis */}
            {verificationResult.detailed_analysis && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 dark:text-white mb-2">
                  📊 Detailed Analysis
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {verificationResult.detailed_analysis}
                </p>
              </div>
            )}

            {/* Next Steps */}
            {verificationResult.next_steps &&
              verificationResult.next_steps.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">
                    🎯 Next Steps
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.next_steps.map(
                      (step: string, index: number) => (
                        <li key={index} className="text-sm text-purple-700">
                          {step}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        </motion.div>
      )}

      {/* Information Panel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
      >
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
          🔒 How Our AI Verification Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
              ChatGPT-5 Analysis
            </h4>
            <ul className="space-y-1">
              <li>• Emission factor validation</li>
              <li>• Industry benchmark comparison</li>
              <li>• Statistical anomaly detection</li>
              <li>• Methodology assessment</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
              Blockchain Recording
            </h4>
            <ul className="space-y-1">
              <li>• Immutable audit trail</li>
              <li>• Timestamp verification</li>
              <li>• Smart contract validation</li>
              <li>• Transparency assurance</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmissionTracker;
