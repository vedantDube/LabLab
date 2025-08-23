import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DocumentChartBarIcon,
  SparklesIcon,
  WalletIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import blockchainService from "../services/blockchainService";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Mock data for analytics
interface AnalyticsData {
  carbonCreditsTraded: number;
  totalVolume: number;
  averagePrice: number;
  co2Offset: number;
  activeProjects: number;
  monthlyGrowth: number;
  marketTrends: Array<{
    month: string;
    volume: number;
    price: number;
    co2Offset: number;
  }>;
  topProjects: Array<{
    name: string;
    location: string;
    co2Reduced: number;
    creditsSold: number;
    revenue: number;
  }>;
  priceHistory: Array<{
    date: string;
    price: number;
    volume: number;
  }>;
  regionalData: Array<{
    region: string;
    percentage: number;
    color: string;
  }>;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("30d");
  const [selectedMetric, setSelectedMetric] = useState<
    "volume" | "price" | "co2"
  >("volume");

  // Wallet connection state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [accountBalance, setAccountBalance] = useState<string>("0");
  const [connectingWallet, setConnectingWallet] = useState(false);

  // Mock data - in real app this would come from your API
  const mockAnalyticsData: AnalyticsData = useMemo(
    () => ({
      carbonCreditsTraded: 45678,
      totalVolume: 1234567,
      averagePrice: 28.5,
      co2Offset: 89234,
      activeProjects: 156,
      monthlyGrowth: 12.5,
      marketTrends: [
        { month: "Jan", volume: 8000, price: 25.5, co2Offset: 7200 },
        { month: "Feb", volume: 12000, price: 26.2, co2Offset: 10800 },
        { month: "Mar", volume: 15000, price: 27.1, co2Offset: 13500 },
        { month: "Apr", volume: 18000, price: 28.0, co2Offset: 16200 },
        { month: "May", volume: 22000, price: 28.5, co2Offset: 19800 },
        { month: "Jun", volume: 25000, price: 29.2, co2Offset: 22500 },
      ],
      topProjects: [
        {
          name: "Amazon Rainforest Conservation",
          location: "Brazil",
          co2Reduced: 15000,
          creditsSold: 12000,
          revenue: 342000,
        },
        {
          name: "Solar Farm Initiative",
          location: "India",
          co2Reduced: 12000,
          creditsSold: 9500,
          revenue: 266000,
        },
        {
          name: "Wind Energy Project",
          location: "Denmark",
          co2Reduced: 8500,
          creditsSold: 7200,
          revenue: 216000,
        },
        {
          name: "Reforestation Program",
          location: "Indonesia",
          co2Reduced: 6800,
          creditsSold: 5400,
          revenue: 162000,
        },
      ],
      priceHistory: [
        { date: "2024-01", price: 25.5, volume: 8000 },
        { date: "2024-02", price: 26.2, volume: 12000 },
        { date: "2024-03", price: 27.1, volume: 15000 },
        { date: "2024-04", price: 28.0, volume: 18000 },
        { date: "2024-05", price: 28.5, volume: 22000 },
        { date: "2024-06", price: 29.2, volume: 25000 },
      ],
      regionalData: [
        { region: "North America", percentage: 35, color: "#10B981" },
        { region: "Europe", percentage: 28, color: "#3B82F6" },
        { region: "Asia", percentage: 22, color: "#F59E0B" },
        { region: "South America", percentage: 10, color: "#EF4444" },
        { region: "Africa", percentage: 5, color: "#8B5CF6" },
      ],
    }),
    []
  );

  const getAccountBalance = useCallback(async (address: string) => {
    try {
      if (window.ethereum) {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
        setAccountBalance(balanceInEth.toFixed(4));
      }
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }, []);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);

    // DON'T automatically check wallet connection - let user connect manually

    return () => clearTimeout(timer);
  }, [mockAnalyticsData]);

  const connectWallet = async () => {
    setConnectingWallet(true);
    try {
      const result = await blockchainService.connectWallet();
      if (result.success && result.address) {
        setWalletConnected(true);
        setWalletAddress(result.address);
        // Store user consent
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", result.address);
        await getAccountBalance(result.address);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error(result.error || "Failed to connect wallet");
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    blockchainService.disconnect();
    setWalletConnected(false);
    setWalletAddress("");
    setAccountBalance("0");
    // Clear stored consent
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    toast.success("Wallet disconnected");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change: number;
    icon: React.ElementType;
    prefix?: string;
    suffix?: string;
  }> = ({ title, value, change, icon: Icon, prefix = "", suffix = "" }) => (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-sm ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {Math.abs(change)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="p-3 bg-green-100 rounded-lg">
          <Icon className="h-6 w-6 text-green-600" />
        </div>
      </div>
    </motion.div>
  );

  const SimpleChart: React.FC<{
    data: Array<{
      month: string;
      volume: number;
      price: number;
      co2Offset: number;
    }>;
    metric: "volume" | "price" | "co2";
  }> = ({ data, metric }) => {
    const maxValue = Math.max(
      ...data.map((d) => {
        switch (metric) {
          case "volume":
            return d.volume;
          case "price":
            return d.price;
          case "co2":
            return d.co2Offset;
          default:
            return d.volume;
        }
      })
    );

    return (
      <div className="mt-4">
        <div className="flex items-end justify-between h-64 space-x-2">
          {data.map((item, index) => {
            const value =
              metric === "volume"
                ? item.volume
                : metric === "price"
                ? item.price
                : item.co2Offset;
            const height = (value / maxValue) * 100;

            return (
              <motion.div
                key={item.month}
                className="flex flex-col items-center flex-1"
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="bg-green-500 rounded-t-lg w-full mb-2 hover:bg-green-600 transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${item.month}: ${value.toLocaleString()}`}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {item.month}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <SparklesIcon className="h-6 w-6 text-green-500 animate-pulse" />
          <span className="text-lg text-gray-600 dark:text-gray-400">
            Loading analytics...
          </span>
        </motion.div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive insights into carbon credit trading performance
              </p>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {walletConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {formatAddress(walletAddress)}
                        </p>
                        <p className="text-xs text-green-600">
                          {accountBalance} ETH
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={connectingWallet}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <WalletIcon className="h-4 w-4" />
                  <span>
                    {connectingWallet ? "Connecting..." : "Connect Wallet"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Time Frame Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {(["7d", "30d", "90d", "1y"] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <MetricCard
            title="Carbon Credits Traded"
            value={analyticsData.carbonCreditsTraded}
            change={analyticsData.monthlyGrowth}
            icon={DocumentChartBarIcon}
          />
          <MetricCard
            title="Total Volume"
            value={analyticsData.totalVolume}
            change={8.3}
            icon={ChartBarIcon}
            prefix="$"
          />
          <MetricCard
            title="Average Price"
            value={analyticsData.averagePrice}
            change={5.2}
            icon={CurrencyDollarIcon}
            prefix="$"
            suffix="/ton"
          />
          <MetricCard
            title="CO₂ Offset"
            value={analyticsData.co2Offset}
            change={15.7}
            icon={GlobeAltIcon}
            suffix=" tons"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Market Trends Chart */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Market Trends
              </h3>
              <div className="flex space-x-2">
                {(["volume", "price", "co2"] as const).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedMetric === metric
                        ? "bg-green-100 text-green-700"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {metric === "co2"
                      ? "CO₂"
                      : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SimpleChart
              data={analyticsData.marketTrends}
              metric={selectedMetric}
            />
          </motion.div>

          {/* Regional Distribution */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Regional Distribution
            </h3>
            <div className="space-y-4">
              {analyticsData.regionalData.map((region, index) => (
                <motion.div
                  key={region.region}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: region.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {region.region}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {region.percentage}%
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Top Projects Table */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Performing Projects
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CO₂ Reduced
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credits Sold
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {analyticsData.topProjects.map((project, index) => (
                  <motion.tr
                    key={project.name}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {project.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {project.co2Reduced.toLocaleString()} tons
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {project.creditsSold.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ${project.revenue.toLocaleString()}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI Insights Section */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <SparklesIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI-Powered Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Market Prediction
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Based on current trends, carbon credit prices are expected to
                increase by 8-12% over the next quarter due to increased demand
                and regulatory changes.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Optimization Opportunity
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Consider diversifying into renewable energy projects in Asia,
                which show 15% higher returns compared to the current portfolio
                average.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;
