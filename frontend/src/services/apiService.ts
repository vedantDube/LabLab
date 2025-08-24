import axios from "axios";
import { io, Socket } from "socket.io-client";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Socket.IO connection
class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(API_BASE_URL);
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeTwin(twinId: string) {
    if (this.socket) {
      this.socket.emit("subscribe_twin", { twin_id: twinId });
    }
  }

  onUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on("twin_update", callback);
    }
  }
}

// API Service Class
class ApiService {
  private socketService = new SocketService();

  // Emission Reports
  async verifyEmission(emissionData: {
    company_id: string;
    facility_id: string;
    reported_emissions: number;
    energy_sources: string[];
    production_volume: number;
    time_period: string;
    supporting_data: string;
  }) {
    return await api.post("/api/verify-emission", emissionData);
  }

  // Digital Twin Management
  async createDigitalTwin(facilityData: {
    type: string;
    size_sqft: number;
    industry: string;
    energy_systems: string[];
    production_capacity: number;
    energy_kwh_month: number;
    current_emissions: number;
    equipment: string[];
    location: string;
  }) {
    return await api.post("/api/create-twin", facilityData);
  }

  async simulateScenarios(twinId: string, scenarios: any[]) {
    return await api.post(`/api/simulate/${twinId}`, { scenarios });
  }

  async getDashboardData(twinId: string) {
    return await api.get(`/api/dashboard/${twinId}`);
  }

  // Analytics and Reports
  async getSummaryReport() {
    return await api.get("/api/reports/summary");
  }

  async getEmissionReports(companyId?: string) {
    const params = companyId ? { company_id: companyId } : {};
    return await api.get("/api/reports/emissions", { params });
  }

  // Carbon Credits
  async getCarbonCredits() {
    return await api.get("/api/carbon-credits");
  }

  async tradeCarbonCredit(creditId: string, amount: number) {
    return await api.post("/api/carbon-credits/trade", {
      credit_id: creditId,
      amount,
    });
  }

  async createCarbonCredit(creditData: {
    amount: number;
    price_per_ton: number;
    certification_hash: string;
    project_details: string;
    vintage: number;
    credit_type: string;
  }) {
    return await api.post("/api/carbon-credits", creditData);
  }

  // Blockchain Integration
  async getBlockchainStatus() {
    return await api.get("/api/blockchain/status");
  }

  async deployContract() {
    return await api.post("/api/blockchain/deploy");
  }

  // Real-time Data
  connectSocket() {
    return this.socketService.connect();
  }

  disconnectSocket() {
    this.socketService.disconnect();
  }

  subscribeTwinUpdates(twinId: string) {
    this.socketService.subscribeTwin(twinId);
  }

  onTwinUpdate(callback: (data: any) => void) {
    this.socketService.onUpdate(callback);
  }

  // AI Analysis
  async getAiInsights(data: any) {
    return await api.post("/api/ai/insights", data);
  }

  async getChatGPT5Analysis(prompt: string, context: any) {
    return await api.post("/api/ai/chatgpt5", {
      prompt,
      context,
    });
  }

  // Optimization
  async getOptimizationRecommendations(twinId: string, constraints: any) {
    return await api.post(`/api/optimize/${twinId}`, constraints);
  }

  // Compliance and Reporting
  async generateComplianceReport(facilityId: string, period: string) {
    return await api.post("/api/reports/compliance", {
      facility_id: facilityId,
      period,
    });
  }

  async getESGMetrics(companyId: string) {
    return await api.get(`/api/esg/${companyId}`);
  }

  // Sustainability Scoring
  async getSupplierScore(supplierAddress: string) {
    return await api.get(`/api/supplier-score/${supplierAddress}`);
  }

  async updateSustainabilityScore(companyId: string, metrics: any) {
    return await api.post(`/api/sustainability-score/${companyId}`, metrics);
  }

  // Data Export
  async exportData(type: string, format: string, filters: any) {
    return await api.post("/api/export", {
      type,
      format,
      filters,
    });
  }

  // User Management
  async getProfile() {
    return await api.get("/api/profile");
  }

  async updateProfile(profileData: any) {
    return await api.put("/api/profile", profileData);
  }

  async getSettings() {
    return await api.get("/api/settings");
  }

  async updateSettings(settings: any) {
    return await api.put("/api/settings", settings);
  }

  // Notifications
  async getNotifications() {
    return await api.get("/api/notifications");
  }

  async markNotificationRead(notificationId: string) {
    return await api.put(`/api/notifications/${notificationId}/read`);
  }

  // System Health
  async getSystemHealth() {
    return await api.get("/api/health");
  }

  async getApiStatus() {
    return await api.get("/api/status");
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types for TypeScript
export interface EmissionReport {
  id: string;
  company_id: string;
  facility_id: string;
  reported_emissions: number;
  verification_score: number;
  verified: boolean;
  timestamp: string;
  ai_analysis: any;
}

export interface DigitalTwin {
  twin_id: string;
  facility_type: string;
  baseline_emissions: number;
  current_emissions: number;
  optimization_opportunities: any[];
  monitoring_setup: any;
}

export interface CarbonCredit {
  id: string;
  owner: string;
  amount: number;
  price_per_ton: number;
  certification_hash: string;
  retired: boolean;
  vintage: number;
}

export interface SimulationResult {
  scenario_name: string;
  carbon_impact: {
    annual_reduction_kg_co2: number;
    percentage_reduction: number;
  };
  financial_analysis: {
    implementation_cost: number;
    annual_savings: number;
    net_roi_percentage: number;
    payback_months: number;
  };
  risk_assessment: {
    overall_risk: "LOW" | "MEDIUM" | "HIGH";
    mitigation_strategies: string[];
  };
  recommendation:
    | "HIGHLY_RECOMMENDED"
    | "RECOMMENDED"
    | "CONSIDER"
    | "NOT_RECOMMENDED";
}

// Utility functions
export const formatEmissions = (emissions: number): string => {
  if (emissions >= 1000000) {
    return `${(emissions / 1000000).toFixed(2)}M kg CO2`;
  } else if (emissions >= 1000) {
    return `${(emissions / 1000).toFixed(2)}K kg CO2`;
  }
  return `${emissions.toFixed(2)} kg CO2`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export default apiService;
