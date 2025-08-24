import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  WalletIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import blockchainService, { TradeOrder, CreditType } from '../services/blockchainService';
// import apiService from '../services/apiService';

interface CarbonCredit {
  id: string;
  seller: string;
  amount: number;
  pricePerTon: number;
  totalPrice: number;
  projectName: string;
  projectType: string;
  location: string;
  vintage: number;
  certification: string;
  verificationStatus: "verified" | "pending" | "rejected";
  description: string;
  imageUrl?: string;
  co2Reduced: number;
  projectStart: string;
  projectEnd: string;
}

interface MarketplaceStats {
  totalCredits: number;
  totalVolume: number;
  averagePrice: number;
  totalCO2Offset: number;
  activeListings: number;
  completedTrades: number;
}

const CarbonMarketplace: React.FC = () => {
  const [credits, setCredits] = useState<CarbonCredit[]>([]);
  const [blockchainCredits, setBlockchainCredits] = useState<TradeOrder[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("price");
  const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(
    null
  );
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(1);
  
  // Blockchain state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [accountBalance, setAccountBalance] = useState<string>("0");
  const [networkInfo, setNetworkInfo] = useState<{ chainId: number; networkName: string }>({ chainId: 0, networkName: 'Unknown' });
  const [showMintModal, setShowMintModal] = useState(false);
  const [isBlockchainMode, setIsBlockchainMode] = useState(false);

  // Mock data for demonstration
  const mockCredits = useMemo(
    () => [
      {
        id: "1",
        seller: "0x742d35Cc6634C0532925a3b8D4C9db3C18e5AA3",
        amount: 1000,
        pricePerTon: 25,
        totalPrice: 25000,
        projectName: "Amazon Rainforest Conservation",
        projectType: "Forest Conservation",
        location: "Brazil",
        vintage: 2024,
        certification: "VCS (Verified Carbon Standard)",
        verificationStatus: "verified" as const,
        description:
          "Large-scale rainforest conservation project protecting 50,000 hectares of Amazon rainforest from deforestation.",
        imageUrl: "/api/placeholder/400/200",
        co2Reduced: 1000,
        projectStart: "2023-01-01",
        projectEnd: "2030-12-31",
      },
      {
        id: "2",
        seller: "0x8ba1f109551bd432803012645hac136c4c78962",
        amount: 500,
        pricePerTon: 30,
        totalPrice: 15000,
        projectName: "Solar Farm Initiative",
        projectType: "Renewable Energy",
        location: "India",
        vintage: 2024,
        certification: "Gold Standard",
        verificationStatus: "verified" as const,
        description:
          "Solar energy project replacing coal-powered electricity generation in rural communities.",
        imageUrl: "/api/placeholder/400/200",
        co2Reduced: 500,
        projectStart: "2023-06-01",
        projectEnd: "2028-06-01",
      },
      {
        id: "3",
        seller: "0x123d35Cc6634C0532925a3b8D4C9db3C18e5BB4",
        amount: 750,
        pricePerTon: 22,
        totalPrice: 16500,
        projectName: "Methane Capture Facility",
        projectType: "Waste Management",
        location: "USA",
        vintage: 2024,
        certification: "Climate Action Reserve",
        verificationStatus: "verified" as const,
        description:
          "Advanced methane capture system at landfill sites preventing emissions and generating clean energy.",
        imageUrl: "/api/placeholder/400/200",
        co2Reduced: 750,
        projectStart: "2023-03-01",
        projectEnd: "2033-03-01",
      },
      {
        id: "4",
        seller: "0x456d35Cc6634C0532925a3b8D4C9db3C18e5CC5",
        amount: 300,
        pricePerTon: 35,
        totalPrice: 10500,
        projectName: "Reforestation Kenya",
        projectType: "Afforestation",
        location: "Kenya",
        vintage: 2024,
        certification: "Plan Vivo",
        verificationStatus: "pending" as const,
        description:
          "Community-led reforestation project planting native trees and supporting local livelihoods.",
        imageUrl: "/api/placeholder/400/200",
        co2Reduced: 300,
        projectStart: "2024-01-01",
        projectEnd: "2029-01-01",
      },
    ],
    []
  );

  const mockStats = useMemo(
    () => ({
      totalCredits: 2550,
      totalVolume: 125000,
      averagePrice: 26.5,
      totalCO2Offset: 2550,
      activeListings: 12,
      completedTrades: 38,
    }),
    []
  );

  const checkWalletConnection = useCallback(async () => {
    const connection = blockchainService.getConnection();
    if (connection.isConnected && connection.signer) {
      try {
        const address = await connection.signer.getAddress();
        setWalletConnected(true);
        setWalletAddress(address);
        updateWalletInfo(address);
      } catch (error) {
        console.error('Failed to get wallet info:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Initialize with mock data
    setCredits(mockCredits);
    setStats(mockStats);
    
    // Check if wallet is already connected
    checkWalletConnection();
    setLoading(false);
  }, [mockCredits, mockStats, checkWalletConnection]);

  const connectWallet = async () => {
    try {
      const result = await blockchainService.connectWallet();
      if (result.success && result.address) {
        setWalletConnected(true);
        setWalletAddress(result.address);
        updateWalletInfo(result.address);
        toast.success('Wallet connected successfully!');
        
        // Load blockchain credits
        loadBlockchainCredits();
        
        // Subscribe to blockchain events
        blockchainService.subscribeToEvents();
      } else {
        toast.error(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      toast.error('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    }
  };

  const updateWalletInfo = async (address: string) => {
    try {
      const [balance, network] = await Promise.all([
        blockchainService.getAccountBalance(address),
        blockchainService.getCurrentNetwork()
      ]);
      
      setAccountBalance(balance);
      setNetworkInfo(network);
    } catch (error) {
      console.error('Failed to update wallet info:', error);
    }
  };

  const loadBlockchainCredits = async () => {
    try {
      const credits = await blockchainService.getAllAvailableCredits();
      setBlockchainCredits(credits);
    } catch (error) {
      console.error('Failed to load blockchain credits:', error);
      toast.error('Failed to load blockchain credits');
    }
  };

  const filteredCredits = credits
    .filter((credit) => {
      const matchesSearch =
        credit.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        credit.projectType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        credit.projectType.toLowerCase().includes(filterType);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.pricePerTon - b.pricePerTon;
        case "amount":
          return b.amount - a.amount;
        case "vintage":
          return b.vintage - a.vintage;
        default:
          return 0;
      }
    });

  const handlePurchase = async (credit: CarbonCredit) => {
    setSelectedCredit(credit);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedCredit) return;

    try {
      if (isBlockchainMode && walletConnected) {
        // Blockchain purchase
        const result = await blockchainService.tradeCarbonCredit(
          parseInt(selectedCredit.id),
          purchaseAmount
        );
        
        if (result.success) {
          toast.success(`Successfully purchased ${purchaseAmount} tons of carbon credits on blockchain!`);
          // Reload blockchain credits
          loadBlockchainCredits();
        } else {
          toast.error(result.error || 'Blockchain transaction failed');
          return;
        }
      } else {
        // Mock purchase for demo
        toast.success(`Successfully purchased ${purchaseAmount} tons of carbon credits!`);
      }

      setShowPurchaseModal(false);
      setSelectedCredit(null);
      setPurchaseAmount(1);

      // Update the credit amount in the list
      setCredits((prev) =>
        prev.map((credit) =>
          credit.id === selectedCredit.id
            ? { ...credit, amount: credit.amount - purchaseAmount }
            : credit
        )
      );
    } catch (error) {
      toast.error("Failed to purchase carbon credits");
      console.error("Purchase error:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <motion.h1
              className="text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Carbon Credit Marketplace
            </motion.h1>
            <p className="text-lg text-gray-600">
              Trade verified carbon credits on the blockchain with full transparency
              and traceability
            </p>
          </div>
          
          {/* Blockchain Controls */}
          <div className="flex flex-col items-end gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Demo Mode</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBlockchainMode}
                  onChange={(e) => setIsBlockchainMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-700">Blockchain</span>
            </div>
            
            {/* Wallet Connection */}
            {isBlockchainMode && (
              <div className="flex items-center gap-3">
                {walletConnected ? (
                  <div className="flex items-center gap-3 bg-green-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </span>
                    </div>
                    <div className="text-xs text-green-600">
                      {parseFloat(accountBalance).toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-green-600">
                      {networkInfo.networkName}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <WalletIcon className="h-5 w-5" />
                    Connect Wallet
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalCredits.toLocaleString()}
                </p>
              </div>
              <ShoppingCartIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Volume
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ${stats.totalVolume.toLocaleString()}
                </p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${stats.averagePrice}/ton
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CO2 Offset</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalCO2Offset.toLocaleString()}t
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Listings
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.activeListings}
                </p>
              </div>
              <InformationCircleIcon className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completed Trades
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.completedTrades}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-indigo-500" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, locations, types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="forest">Forest Conservation</option>
              <option value="renewable">Renewable Energy</option>
              <option value="waste">Waste Management</option>
              <option value="afforestation">Afforestation</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="price">Sort by Price</option>
              <option value="amount">Sort by Amount</option>
              <option value="vintage">Sort by Vintage</option>
            </select>

            {/* Mint Button for Blockchain Mode */}
            {isBlockchainMode && walletConnected && (
              <button
                onClick={() => setShowMintModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <LinkIcon className="h-5 w-5" />
                Mint Credits
              </button>
            )}
          </div>
        </div>
      </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Credits Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {filteredCredits.map((credit, index) => (
          <motion.div
            key={credit.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
              <div className="text-white text-center">
                <h3 className="text-xl font-bold mb-2">{credit.projectName}</h3>
                <p className="text-green-100">{credit.location}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {credit.projectType}
                </span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(credit.verificationStatus)}
                  <span className="text-sm text-gray-600 capitalize">
                    {credit.verificationStatus}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {credit.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Available:</span>
                  <span className="font-semibold">
                    {credit.amount} tons CO2
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price per ton:</span>
                  <span className="font-semibold">${credit.pricePerTon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vintage:</span>
                  <span className="font-semibold">{credit.vintage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Certification:</span>
                  <span className="font-semibold text-xs">
                    {credit.certification}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(credit)}
                disabled={credit.verificationStatus !== "verified"}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {credit.verificationStatus === "verified"
                  ? "Purchase Credits"
                  : "Not Available"}
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Purchase Modal */}
      {showPurchaseModal && selectedCredit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-xl font-bold mb-4">Purchase Carbon Credits</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Project: {selectedCredit.projectName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Price per ton: ${selectedCredit.pricePerTon}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Available: {selectedCredit.amount} tons
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to purchase (tons):
              </label>
              <input
                type="number"
                min="1"
                max={selectedCredit.amount}
                value={purchaseAmount}
                onChange={(e) =>
                  setPurchaseAmount(
                    Math.max(
                      1,
                      Math.min(
                        selectedCredit.amount,
                        parseInt(e.target.value) || 1
                      )
                    )
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />

              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total Cost:{" "}
                  <span className="font-bold text-green-600">
                    $
                    {(
                      purchaseAmount * selectedCredit.pricePerTon
                    ).toLocaleString()}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  CO2 Offset:{" "}
                  <span className="font-bold text-green-600">
                    {purchaseAmount} tons
                  </span>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                Confirm Purchase
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {filteredCredits.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No carbon credits found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default CarbonMarketplace;
