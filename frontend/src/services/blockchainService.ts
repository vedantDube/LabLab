import { ethers } from "ethers";
import Web3 from "web3";

// Contract ABI for CarbonTracker
const CARBON_TRACKER_ABI = [
  // Events
  "event CarbonCreditMinted(uint256 indexed creditId, address indexed owner, uint256 amount, uint8 creditType)",
  "event CarbonCreditTraded(uint256 indexed creditId, address indexed from, address indexed to, uint256 amount, uint256 price)",
  "event CarbonCreditRetired(uint256 indexed creditId, address indexed owner, uint256 amount)",
  "event EmissionReported(uint256 indexed reportId, address indexed company, string facilityId, uint256 emissionAmount, uint256 timestamp)",
  "event EmissionVerified(uint256 indexed reportId, address indexed verifier, uint256 verificationScore, bool passed)",

  // Read functions
  "function carbonCredits(uint256) view returns (uint256 id, address owner, uint256 amount, uint256 pricePerTon, string certificationHash, string projectDetails, bool retired, uint256 vintage, uint8 creditType)",
  "function emissionReports(uint256) view returns (uint256 id, address company, string facilityId, uint256 emissionAmount, uint256 productionVolume, uint256 timestamp, bool verified, uint256 verificationScore, string ipfsHash, address verifier)",
  "function digitalTwins(string) view returns (string twinId, address owner, string facilityType, uint256 baselineEmissions, uint256 currentEmissions, uint256 lastUpdated, bool active, string dataHash)",
  "function getOwnedCredits(address owner) view returns (uint256[])",
  "function getCompanyReports(address company) view returns (uint256[])",
  "function getCompanyTwins(address company) view returns (string[])",
  "function getTotalCredits() view returns (uint256)",
  "function getTotalReports() view returns (uint256)",
  "function companyScores(address) view returns (uint256)",
  "function authorizedVerifiers(address) view returns (bool)",

  // Write functions
  "function mintCarbonCredit(uint256 amount, uint256 pricePerTon, string certificationHash, string projectDetails, uint256 vintage, uint8 creditType) returns (uint256)",
  "function tradeCarbonCredit(uint256 creditId, uint256 amount) payable",
  "function retireCarbonCredit(uint256 creditId)",
  "function reportEmissions(string facilityId, uint256 emissionAmount, uint256 productionVolume, string[] energySources, string ipfsHash) returns (uint256)",
  "function verifyEmissionReport(uint256 reportId, uint256 verificationScore, bool passed)",
  "function createDigitalTwin(string twinId, string facilityType, uint256 baselineEmissions, string dataHash)",
  "function updateDigitalTwin(string twinId, uint256 newEmissions)",
];

// Contract address (will be set after deployment)
const CARBON_TRACKER_ADDRESS = "0x1234567890123456789012345678901234567890"; // Placeholder

export interface CarbonCredit {
  id: number;
  owner: string;
  amount: number;
  pricePerTon: number;
  certificationHash: string;
  projectDetails: string;
  retired: boolean;
  vintage: number;
  creditType: CreditType;
}

export interface EmissionReport {
  id: number;
  company: string;
  facilityId: string;
  emissionAmount: number;
  productionVolume: number;
  timestamp: number;
  verified: boolean;
  verificationScore: number;
  ipfsHash: string;
  verifier: string;
}

export interface DigitalTwin {
  twinId: string;
  owner: string;
  facilityType: string;
  baselineEmissions: number;
  currentEmissions: number;
  lastUpdated: number;
  active: boolean;
  dataHash: string;
}

export interface TradeOrder {
  creditId: number;
  seller: string;
  amount: number;
  pricePerTon: number;
  totalPrice: number;
  projectName: string;
  projectType: string;
  vintage: number;
  certification: string;
}

export enum CreditType {
  RENEWABLE_ENERGY = 0,
  FOREST_CONSERVATION = 1,
  CARBON_CAPTURE = 2,
  ENERGY_EFFICIENCY = 3,
}

class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private web3: Web3 | null = null;
  private isConnected = false;

  constructor() {
    this.initializeWeb3();
    // Ensure we start with a clean state
    this.disconnect();
  }

  private async initializeWeb3() {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      this.web3 = new Web3((window as any).ethereum);
    }
  }

  async connectWallet(): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> {
    console.log("BlockchainService.connectWallet() called"); // Debug log
    try {
      if (!window.ethereum) {
        return {
          success: false,
          error: "MetaMask not detected. Please install MetaMask.",
        };
      }

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Initialize contract
      this.contract = new ethers.Contract(
        CARBON_TRACKER_ADDRESS,
        CARBON_TRACKER_ABI,
        this.signer
      );

      const address = await this.signer.getAddress();
      this.isConnected = true;

      // Listen for account changes
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
          // Clear stored connection consent when user disconnects from MetaMask
          localStorage.removeItem("walletConnected");
          localStorage.removeItem("walletAddress");
        }
        // DON'T automatically reconnect even if user consented before
        // They need to manually click connect again
      });

      // Listen for chain changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });

      return { success: true, address };
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      return { success: false, error: error.message };
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;

    // Remove event listeners to prevent automatic reconnection
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        // Only remove listeners if they exist
        if (window.ethereum.removeAllListeners) {
          window.ethereum.removeAllListeners("accountsChanged");
          window.ethereum.removeAllListeners("chainChanged");
        }
      } catch (error) {
        console.warn("Failed to remove event listeners:", error);
      }
    }
  }
  getConnection() {
    return {
      isConnected: this.isConnected,
      provider: this.provider,
      signer: this.signer,
      contract: this.contract,
    };
  }

  // Check if wallet is actually connected without prompting user
  async isWalletActuallyConnected(): Promise<boolean> {
    try {
      if (!window.ethereum) return false;

      // Check existing permissions without requesting new ones
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      return accounts.length > 0 && this.isConnected;
    } catch (error) {
      console.error("Failed to check wallet connection:", error);
      return false;
    }
  }

  // Carbon Credit Trading Functions
  async mintCarbonCredit(creditData: {
    amount: number;
    pricePerTon: number;
    certificationHash: string;
    projectDetails: string;
    vintage: number;
    creditType: CreditType;
  }): Promise<{
    success: boolean;
    creditId?: number;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const tx = await this.contract.mintCarbonCredit(
        creditData.amount,
        ethers.parseEther(creditData.pricePerTon.toString()),
        creditData.certificationHash,
        creditData.projectDetails,
        creditData.vintage,
        creditData.creditType
      );

      const receipt = await tx.wait();

      // Extract credit ID from logs
      const creditId = receipt.logs[0]?.args?.[0] || 0;

      return {
        success: true,
        creditId: Number(creditId),
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to mint carbon credit:", error);
      return { success: false, error: error.message };
    }
  }

  async tradeCarbonCredit(
    creditId: number,
    amount: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      // Get credit details to calculate payment
      const credit = await this.getCarbonCredit(creditId);
      if (!credit) {
        throw new Error("Credit not found");
      }

      const totalPrice = ethers.parseEther(
        (credit.pricePerTon * amount).toString()
      );

      const tx = await this.contract.tradeCarbonCredit(creditId, amount, {
        value: totalPrice,
      });

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to trade carbon credit:", error);
      return { success: false, error: error.message };
    }
  }

  async retireCarbonCredit(
    creditId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const tx = await this.contract.retireCarbonCredit(creditId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to retire carbon credit:", error);
      return { success: false, error: error.message };
    }
  }

  // Read Functions
  async getCarbonCredit(creditId: number): Promise<CarbonCredit | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const credit = await this.contract.carbonCredits(creditId);

      return {
        id: Number(credit.id),
        owner: credit.owner,
        amount: Number(credit.amount),
        pricePerTon: Number(ethers.formatEther(credit.pricePerTon)),
        certificationHash: credit.certificationHash,
        projectDetails: credit.projectDetails,
        retired: credit.retired,
        vintage: Number(credit.vintage),
        creditType: Number(credit.creditType) as CreditType,
      };
    } catch (error) {
      console.error("Failed to get carbon credit:", error);
      return null;
    }
  }

  async getOwnedCredits(address: string): Promise<CarbonCredit[]> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const creditIds = await this.contract.getOwnedCredits(address);
      const credits: CarbonCredit[] = [];

      for (const creditId of creditIds) {
        const credit = await this.getCarbonCredit(Number(creditId));
        if (credit) {
          credits.push(credit);
        }
      }

      return credits;
    } catch (error) {
      console.error("Failed to get owned credits:", error);
      return [];
    }
  }

  async getAllAvailableCredits(): Promise<TradeOrder[]> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const totalCredits = await this.contract.getTotalCredits();
      const tradeOrders: TradeOrder[] = [];

      for (let i = 1; i <= Number(totalCredits); i++) {
        const credit = await this.getCarbonCredit(i);
        if (credit && !credit.retired && credit.amount > 0) {
          tradeOrders.push({
            creditId: credit.id,
            seller: credit.owner,
            amount: credit.amount,
            pricePerTon: credit.pricePerTon,
            totalPrice: credit.amount * credit.pricePerTon,
            projectName: this.extractProjectName(credit.projectDetails),
            projectType: this.getCreditTypeName(credit.creditType),
            vintage: credit.vintage,
            certification: credit.certificationHash,
          });
        }
      }

      return tradeOrders;
    } catch (error) {
      console.error("Failed to get available credits:", error);
      return [];
    }
  }

  // Emission Reporting Functions
  async reportEmissions(reportData: {
    facilityId: string;
    emissionAmount: number;
    productionVolume: number;
    energySources: string[];
    ipfsHash: string;
  }): Promise<{
    success: boolean;
    reportId?: number;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const tx = await this.contract.reportEmissions(
        reportData.facilityId,
        reportData.emissionAmount,
        reportData.productionVolume,
        reportData.energySources,
        reportData.ipfsHash
      );

      const receipt = await tx.wait();

      // Extract report ID from logs
      const reportId = receipt.logs[0]?.args?.[0] || 0;

      return {
        success: true,
        reportId: Number(reportId),
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to report emissions:", error);
      return { success: false, error: error.message };
    }
  }

  async getEmissionReport(reportId: number): Promise<EmissionReport | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const report = await this.contract.emissionReports(reportId);

      return {
        id: Number(report.id),
        company: report.company,
        facilityId: report.facilityId,
        emissionAmount: Number(report.emissionAmount),
        productionVolume: Number(report.productionVolume),
        timestamp: Number(report.timestamp),
        verified: report.verified,
        verificationScore: Number(report.verificationScore),
        ipfsHash: report.ipfsHash,
        verifier: report.verifier,
      };
    } catch (error) {
      console.error("Failed to get emission report:", error);
      return null;
    }
  }

  async getCompanyReports(address: string): Promise<EmissionReport[]> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const reportIds = await this.contract.getCompanyReports(address);
      const reports: EmissionReport[] = [];

      for (const reportId of reportIds) {
        const report = await this.getEmissionReport(Number(reportId));
        if (report) {
          reports.push(report);
        }
      }

      return reports;
    } catch (error) {
      console.error("Failed to get company reports:", error);
      return [];
    }
  }

  // Digital Twin Functions
  async createDigitalTwin(twinData: {
    twinId: string;
    facilityType: string;
    baselineEmissions: number;
    dataHash: string;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const tx = await this.contract.createDigitalTwin(
        twinData.twinId,
        twinData.facilityType,
        twinData.baselineEmissions,
        twinData.dataHash
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to create digital twin:", error);
      return { success: false, error: error.message };
    }
  }

  async updateDigitalTwin(
    twinId: string,
    newEmissions: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const tx = await this.contract.updateDigitalTwin(twinId, newEmissions);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("Failed to update digital twin:", error);
      return { success: false, error: error.message };
    }
  }

  async getDigitalTwin(twinId: string): Promise<DigitalTwin | null> {
    try {
      if (!this.contract) {
        throw new Error("Contract not connected");
      }

      const twin = await this.contract.digitalTwins(twinId);

      return {
        twinId: twin.twinId,
        owner: twin.owner,
        facilityType: twin.facilityType,
        baselineEmissions: Number(twin.baselineEmissions),
        currentEmissions: Number(twin.currentEmissions),
        lastUpdated: Number(twin.lastUpdated),
        active: twin.active,
        dataHash: twin.dataHash,
      };
    } catch (error) {
      console.error("Failed to get digital twin:", error);
      return null;
    }
  }

  // Utility Functions
  async getCompanyScore(address: string): Promise<number> {
    try {
      if (!this.contract) {
        return 0;
      }

      const score = await this.contract.companyScores(address);
      return Number(score);
    } catch (error) {
      console.error("Failed to get company score:", error);
      return 0;
    }
  }

  async isAuthorizedVerifier(address: string): Promise<boolean> {
    try {
      if (!this.contract) {
        return false;
      }

      return await this.contract.authorizedVerifiers(address);
    } catch (error) {
      console.error("Failed to check verifier status:", error);
      return false;
    }
  }

  // Event Listeners
  subscribeToEvents() {
    if (!this.contract) return;

    this.contract.on(
      "CarbonCreditMinted",
      (creditId, owner, amount, creditType) => {
        console.log("Carbon Credit Minted:", {
          creditId,
          owner,
          amount,
          creditType,
        });
        // Emit custom event for UI updates
        window.dispatchEvent(
          new CustomEvent("carbonCreditMinted", {
            detail: { creditId, owner, amount, creditType },
          })
        );
      }
    );

    this.contract.on(
      "CarbonCreditTraded",
      (creditId, from, to, amount, price) => {
        console.log("Carbon Credit Traded:", {
          creditId,
          from,
          to,
          amount,
          price,
        });
        window.dispatchEvent(
          new CustomEvent("carbonCreditTraded", {
            detail: { creditId, from, to, amount, price },
          })
        );
      }
    );

    this.contract.on(
      "EmissionReported",
      (reportId, company, facilityId, emissionAmount, timestamp) => {
        console.log("Emission Reported:", {
          reportId,
          company,
          facilityId,
          emissionAmount,
          timestamp,
        });
        window.dispatchEvent(
          new CustomEvent("emissionReported", {
            detail: {
              reportId,
              company,
              facilityId,
              emissionAmount,
              timestamp,
            },
          })
        );
      }
    );
  }

  // Helper Functions
  private extractProjectName(projectDetails: string): string {
    // Extract project name from project details
    try {
      const parsed = JSON.parse(projectDetails);
      return parsed.name || "Unknown Project";
    } catch {
      return (
        projectDetails.substring(0, 50) +
        (projectDetails.length > 50 ? "..." : "")
      );
    }
  }

  private getCreditTypeName(creditType: CreditType): string {
    switch (creditType) {
      case CreditType.RENEWABLE_ENERGY:
        return "Renewable Energy";
      case CreditType.FOREST_CONSERVATION:
        return "Forest Conservation";
      case CreditType.CARBON_CAPTURE:
        return "Carbon Capture";
      case CreditType.ENERGY_EFFICIENCY:
        return "Energy Efficiency";
      default:
        return "Unknown";
    }
  }

  // Network and Transaction Utilities
  async getCurrentNetwork(): Promise<{ chainId: number; networkName: string }> {
    try {
      if (!this.provider) {
        throw new Error("Provider not connected");
      }

      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      const networkNames: { [key: number]: string } = {
        1: "Ethereum Mainnet",
        5: "Goerli Testnet",
        11155111: "Sepolia Testnet",
        137: "Polygon Mainnet",
        80001: "Polygon Mumbai Testnet",
        1337: "Local Development",
      };

      return {
        chainId,
        networkName: networkNames[chainId] || `Unknown Network (${chainId})`,
      };
    } catch (error) {
      console.error("Failed to get network:", error);
      return { chainId: 0, networkName: "Unknown" };
    }
  }

  async getGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        return "0";
      }

      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, "gwei");
    } catch (error) {
      console.error("Failed to get gas price:", error);
      return "0";
    }
  }

  async getAccountBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        return "0";
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Failed to get account balance:", error);
      return "0";
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;

// Global type declarations
declare global {
  interface Window {
    ethereum?: any;
  }
}
