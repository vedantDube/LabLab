import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiService } from "../services/apiService";
import toast from "react-hot-toast";

interface DashboardStats {
  platform_stats: {
    total_emission_reports: number;
    verified_reports: number;
    verification_rate: number;
    digital_twins_created: number;
    scenarios_simulated: number;
  };
  ai_insights: {
    chatgpt5_verifications: number;
    fraud_detection_rate: string;
    average_confidence_score: string;
    optimization_opportunities_identified: number;
  };
  environmental_impact: {
    total_emissions_tracked: string;
    potential_reductions_identified: string;
    carbon_credits_verified: string;
    compliance_reports_generated: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await apiService.getSummaryReport();
      setStats(data.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }> = ({ title, value, subtitle, icon, color }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 border-l-4 ${color} transition-colors duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-3xl sm:text-4xl ml-4 flex-shrink-0">{icon}</div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
          Welcome to CarbonTwin 🌍
        </h1>
        <p className="text-lg sm:text-xl opacity-90 mb-4 sm:mb-6">
          AI-Powered Carbon Management Platform combining blockchain
          transparency with digital twin simulation
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span>ChatGPT-5 AI Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            <span>Blockchain Connected</span>
          </div>
        </div>
      </motion.div>

      {/* Platform Statistics */}
      {stats && (
        <>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Platform Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Emission Reports"
                value={stats.platform_stats.total_emission_reports}
                subtitle={`${stats.platform_stats.verification_rate}% verified`}
                icon="📊"
                color="border-blue-500"
              />
              <StatCard
                title="Digital Twins"
                value={stats.platform_stats.digital_twins_created}
                subtitle="Active facilities"
                icon="🔗"
                color="border-green-500"
              />
              <StatCard
                title="Scenarios Simulated"
                value={stats.platform_stats.scenarios_simulated}
                subtitle="Optimization runs"
                icon="⚡"
                color="border-purple-500"
              />
              <StatCard
                title="AI Verifications"
                value={stats.ai_insights.chatgpt5_verifications}
                subtitle={`${stats.ai_insights.average_confidence_score} avg confidence`}
                icon="🤖"
                color="border-orange-500"
              />
            </div>
          </div>

          {/* AI Insights */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              AI Intelligence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Fraud Detection Rate"
                value={stats.ai_insights.fraud_detection_rate}
                subtitle="ChatGPT-5 powered"
                icon="🛡️"
                color="border-red-500"
              />
              <StatCard
                title="Confidence Score"
                value={stats.ai_insights.average_confidence_score}
                subtitle="Verification accuracy"
                icon="🎯"
                color="border-blue-500"
              />
              <StatCard
                title="Opportunities Found"
                value={stats.ai_insights.optimization_opportunities_identified}
                subtitle="Reduction strategies"
                icon="💡"
                color="border-yellow-500"
              />
            </div>
          </div>

          {/* Environmental Impact */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Environmental Impact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Emissions Tracked"
                value={stats.environmental_impact.total_emissions_tracked}
                subtitle="Total CO2 monitored"
                icon="🌡️"
                color="border-red-500"
              />
              <StatCard
                title="Potential Reductions"
                value={
                  stats.environmental_impact.potential_reductions_identified
                }
                subtitle="AI-identified savings"
                icon="📉"
                color="border-green-500"
              />
              <StatCard
                title="Carbon Credits"
                value={stats.environmental_impact.carbon_credits_verified}
                subtitle="Blockchain verified"
                icon="🏆"
                color="border-blue-500"
              />
              <StatCard
                title="Compliance Reports"
                value={stats.environmental_impact.compliance_reports_generated}
                subtitle="Generated this month"
                icon="📋"
                color="border-purple-500"
              />
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white p-6 rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-200"
            onClick={() => (window.location.href = "/emissions")}
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-bold text-lg">Report Emissions</h3>
            <p className="text-blue-100">Submit new emission data</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 text-white p-6 rounded-xl shadow-lg hover:bg-green-700 transition-colors duration-200"
            onClick={() => (window.location.href = "/digital-twin")}
          >
            <div className="text-3xl mb-2">🔗</div>
            <h3 className="font-bold text-lg">Create Digital Twin</h3>
            <p className="text-green-100">Model your facility</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 text-white p-6 rounded-xl shadow-lg hover:bg-purple-700 transition-colors duration-200"
            onClick={() => (window.location.href = "/marketplace")}
          >
            <div className="text-3xl mb-2">🏪</div>
            <h3 className="font-bold text-lg">Trade Credits</h3>
            <p className="text-purple-100">Carbon credit marketplace</p>
          </motion.button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recent Activity
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  AI
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  ChatGPT-5 verified emission report #1234
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  2 minutes ago • Verification score: 87%
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold">
                  DT
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Digital twin simulation completed
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  5 minutes ago • 23% reduction potential identified
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  BC
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Carbon credit transaction recorded on blockchain
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  12 minutes ago • 50 tons CO2 traded
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
