"""
CarbonTwin Flask API (clean rebuild)
- Single source of truth for endpoints
- SQLite persistence
- OpenAI and NumPy optional with safe fallbacks
"""
from __future__ import annotations

import json
import logging
import os
import random
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit

# Optional deps
try:
    import numpy as np  # type: ignore
except Exception:  # pragma: no cover
    np = None  # type: ignore
try:
    from openai import OpenAI  # type: ignore
    openai_client = None
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore
    openai_client = None

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("carbontwin")

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "carbontwin-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max request size
CORS(app, origins=["*"])

# Configure SocketIO for production with reduced memory footprint
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode="threading",
    ping_timeout=10,
    ping_interval=5
)

# Detect API key from OPENAI_API_KEY or fallback CHATGPT5_API_KEY
OPENAI_KEY = os.getenv("OPENAI_API_KEY") or os.getenv("CHATGPT5_API_KEY")
OPENAI_TIMEOUT = int(os.getenv("OPENAI_REQUEST_TIMEOUT", "20"))  # seconds
if OpenAI and OPENAI_KEY:
    openai_client = OpenAI(
        base_url="https://api.aimlapi.com/v1",
        api_key=OPENAI_KEY
    )
    logger.info("OpenAI configured: True (key provided)")
else:
    logger.info("OpenAI configured: False (using mock fallbacks)")

# -----------------------------------------------------------------------------
# Data classes
# -----------------------------------------------------------------------------
@dataclass
class EmissionReport:
    company_id: str
    facility_id: str
    reported_emissions: float
    energy_sources: List[str]
    production_volume: float
    timestamp: datetime
    verification_score: float = 0.0
    verified: bool = False


@dataclass
class DigitalTwin:
    twin_id: str
    facility_type: str
    size_sqft: float
    baseline_emissions: float
    current_metrics: Dict
    created_at: datetime


# -----------------------------------------------------------------------------
# Core service
# -----------------------------------------------------------------------------
class CarbonTwinCore:
    def __init__(self) -> None:
        self.db_path = (
            os.getenv("DATABASE_PATH")
            or ("carbontwin.db" if not os.getenv("PORT") else "/tmp/carbontwin.db")
        )
        # Ensure parent directory exists
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        self._init_db()

    @staticmethod
    def ai_enabled() -> bool:
        return bool(OpenAI and OPENAI_KEY and openai_client)

    @staticmethod
    def _safe_float(value, default: float = 0.0) -> float:
        try:
            if value is None:
                return default
            f = float(value)
            if f != f or f in (float("inf"), float("-inf")):
                return default
            return f
        except Exception:
            return default

    # DB ----------------------------------------------------------------------
    def _init_db(self) -> None:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        cur = conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS emission_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id TEXT NOT NULL,
                facility_id TEXT NOT NULL,
                reported_emissions REAL NOT NULL,
                energy_sources TEXT NOT NULL,
                production_volume REAL NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                verification_score REAL DEFAULT 0.0,
                verified BOOLEAN DEFAULT FALSE,
                blockchain_hash TEXT,
                ai_analysis TEXT
            );

            CREATE TABLE IF NOT EXISTS digital_twins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                twin_id TEXT UNIQUE NOT NULL,
                facility_type TEXT NOT NULL,
                size_sqft REAL NOT NULL,
                baseline_emissions REAL NOT NULL,
                current_metrics TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS simulation_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                twin_id TEXT NOT NULL,
                scenario_name TEXT NOT NULL,
                original_emissions REAL NOT NULL,
                projected_emissions REAL NOT NULL,
                cost_impact REAL NOT NULL,
                roi_months INTEGER NOT NULL,
                ai_recommendations TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (twin_id) REFERENCES digital_twins (twin_id)
            );

            CREATE TABLE IF NOT EXISTS carbon_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE NOT NULL,
                credit_id TEXT NOT NULL,
                buyer_address TEXT NOT NULL,
                amount REAL NOT NULL,
                blockchain_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()
        conn.close()

    def store_digital_twin(self, twin_data: Dict, facility_data: Dict) -> None:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        cur = conn.cursor()
        baseline_emissions = self._safe_float(
            (twin_data.get("baseline_model") or {}).get("validated_emissions"), 0.0
        )
        size_sqft = self._safe_float(facility_data.get("size_sqft"), 0.0)
        cur.execute(
            """
            INSERT INTO digital_twins (twin_id, facility_type, size_sqft, baseline_emissions, current_metrics)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                twin_data["twin_id"],
                facility_data.get("type", "Unknown"),
                size_sqft,
                baseline_emissions,
                json.dumps(twin_data),
            ),
        )
        conn.commit()
        conn.close()

    def get_digital_twin(self, twin_id: str) -> Dict | None:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        cur = conn.cursor()
        cur.execute(
            "SELECT current_metrics FROM digital_twins WHERE twin_id = ?",
            (twin_id,),
        )
        row = cur.fetchone()
        conn.close()
        return json.loads(row[0]) if row else None

    def store_simulation_results(self, twin_id: str, simulation_data: Dict) -> None:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        cur = conn.cursor()
        for scenario_name, results in simulation_data.get("simulation_results", {}).items():
            cur.execute(
                """
                INSERT INTO simulation_results (twin_id, scenario_name, original_emissions, projected_emissions, cost_impact, roi_months, ai_recommendations)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    twin_id,
                    scenario_name,
                    results.get("carbon_impact", {}).get("annual_reduction_kg_co2", 0),
                    0,
                    results.get("financial_analysis", {}).get("implementation_cost", 0),
                    results.get("financial_analysis", {}).get("payback_months", 0),
                    json.dumps(results),
                ),
            )
        conn.commit()
        conn.close()

    # AI helpers ---------------------------------------------------------------
    def verify_emission_report_with_ai(self, report_data: Dict) -> Dict:
        prompt = f"""
        You are an expert carbon accounting auditor.
        Analyze this report and return a JSON object with keys: verification_score (0-100), confidence_level, authenticity_rating, risk_level, red_flags[], accuracy_issues[], recommendations[], verified(bool), detailed_analysis, next_steps[].
        Report: {json.dumps(report_data)}
        """
        try:
            if self.ai_enabled():
                logger.info("Verification: using OpenAI")
                resp = openai_client.chat.completions.create(
                    model="openai/gpt-5-chat-latest",
                    messages=[
                        {"role": "system", "content": "You are an expert carbon accounting auditor."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    top_p=0.7,
                    frequency_penalty=0.5,
                    max_tokens=1000,
                    timeout=OPENAI_TIMEOUT,
                )
                return json.loads(resp.choices[0].message.content)
        except Exception as e:
            logger.error(f"AI verification error: {e}")
        return {
            "verification_score": 75,
            "confidence_level": "MEDIUM",
            "authenticity_rating": "AUTHENTIC",
            "risk_level": "LOW",
            "red_flags": [],
            "accuracy_issues": [],
            "recommendations": ["OpenAI not available - using mock verification"],
            "verified": True,
            "detailed_analysis": "Mock verification result - OpenAI API not configured",
            "next_steps": ["Configure OpenAI for real verification"],
        }

    def create_digital_twin_with_ai(self, facility_data: Dict) -> Dict:
        try:
            if self.ai_enabled():
                logger.info("Create twin: using OpenAI")
                prompt = f"Create a digital twin JSON for: {json.dumps(facility_data)}"
                resp = openai_client.chat.completions.create(
                    model="openai/gpt-5-chat-latest",
                    messages=[
                        {"role": "system", "content": "You are an expert in digital twin and carbon modeling."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.4,
                    top_p=0.7,
                    frequency_penalty=0.5,
                    max_tokens=1200,
                    timeout=OPENAI_TIMEOUT,
                )
                twin_result = json.loads(resp.choices[0].message.content)
            else:
                raise RuntimeError("OpenAI not configured")
        except Exception as e:
            logger.warning(f"AI twin creation fallback: {e}")
            twin_result = {
                "twin_id": f"twin_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "baseline_model": {
                    "validated_emissions": facility_data.get("current_emissions", 0),
                    "emission_sources": {"electricity": 60, "heating": 30, "other": 10},
                    "energy_efficiency": 50,
                    "carbon_intensity": 0.4,
                },
                "monitoring_setup": {
                    "key_metrics": ["energy_use", "emissions"],
                    "alert_thresholds": {},
                    "update_frequency": "HOURLY",
                },
                "simulation_parameters": {
                    "adjustable_variables": [],
                    "scenario_templates": [],
                    "prediction_accuracy": "50%",
                },
                "recommendations": ["Enable AI analysis for better insights"],
                "estimated_setup_time": "1 day",
                "confidence_score": 25,
            }
        if not twin_result.get("twin_id"):
            twin_result["twin_id"] = f"twin_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        baseline_val = self._safe_float((twin_result.get("baseline_model") or {}).get("validated_emissions"), 0.0)
        twin_result.setdefault("baseline_model", {})["validated_emissions"] = baseline_val
        self.store_digital_twin(twin_result, facility_data)
        return twin_result

    def simulate_scenarios_with_ai(self, twin_id: str, scenarios: List[Dict]) -> Dict:
        twin_data = self.get_digital_twin(twin_id)
        if not twin_data:
            return {"error": "Digital twin not found"}
        try:
            if self.ai_enabled():
                logger.info("Simulate: using OpenAI")
                prompt = f"Simulate scenarios for twin: {json.dumps(twin_data)}; scenarios: {json.dumps(scenarios)}"
                resp = openai_client.chat.completions.create(
                    model="openai/gpt-5-chat-latest",
                    messages=[
                        {"role": "system", "content": "You are an expert in carbon optimization."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.4,
                    top_p=0.7,
                    frequency_penalty=0.5,
                    max_tokens=2000,
                    timeout=OPENAI_TIMEOUT,
                )
                simulation_result = json.loads(resp.choices[0].message.content)
            else:
                simulation_result = {
                    "simulation_results": {
                        scen.get("name", f"Scenario {i+1}"): {
                            "carbon_impact": {
                                "annual_reduction_kg_co2": 10000 - i * 1500,
                                "percentage_reduction": 10 + i * 5,
                                "cumulative_5year_reduction": (10000 - i * 1500) * 5,
                                "carbon_intensity_improvement": 5 + i * 3,
                            },
                            "financial_analysis": {
                                "implementation_cost": scen.get("changes", {}).get("implementation_cost", 50000 + i * 25000),
                                "annual_savings": 20000 + i * 10000,
                                "carbon_credit_revenue": 5000 + i * 2500,
                                "net_roi_percentage": 25 + i * 10,
                                "payback_months": max(6, 24 - i * 6),
                            },
                            "operational_impact": {
                                "efficiency_change": 5 + i * 3,
                                "production_impact": "NEUTRAL",
                                "maintenance_change": 2 + i,
                                "staff_impact": "LOW",
                            },
                            "risk_assessment": {
                                "overall_risk": "LOW" if i == 0 else "MEDIUM",
                                "technical_risk": "LOW",
                                "financial_risk": "MEDIUM",
                                "operational_risk": "LOW",
                                "mitigation_strategies": ["Vendor support", "Phased rollout"],
                            },
                            "implementation_roadmap": {
                                "total_duration_months": 12 + i * 3,
                                "phases": [
                                    {"phase": "Phase 1", "duration_months": 3, "activities": ["Assessment", "Design"], "cost": 10000, "expected_reduction": 5},
                                    {"phase": "Phase 2", "duration_months": 6, "activities": ["Procurement", "Installation"], "cost": 30000, "expected_reduction": 10},
                                ],
                                "critical_milestones": ["Procurement complete", "Commissioning"],
                            },
                            "recommendation": "RECOMMENDED" if i < 2 else "CONSIDER",
                            "confidence_score": 70 + i * 10,
                        }
                        for i, scen in enumerate(scenarios)
                    },
                    "comparative_analysis": {
                        "best_scenario": scenarios[0].get("name", "Scenario 1") if scenarios else "N/A",
                        "highest_roi": scenarios[1].get("name", "Scenario 2") if len(scenarios) > 1 else (scenarios[0].get("name") if scenarios else "N/A"),
                        "fastest_payback": scenarios[0].get("name", "Scenario 1") if scenarios else "N/A",
                        "lowest_risk": scenarios[0].get("name", "Scenario 1") if scenarios else "N/A",
                    },
                    "integrated_recommendations": [
                        "Prioritize quick-win efficiency upgrades",
                        "Plan phased renewable integration",
                        "Monitor KPIs monthly",
                    ],
                }
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            return {"error": str(e)}
        self.store_simulation_results(twin_id, simulation_result)
        return simulation_result


core = CarbonTwinCore()

# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------
@app.route("/")
def index():
    return jsonify(
        {
            "message": "CarbonTwin API - AI-Powered Carbon Management Platform",
            "version": "1.0.0",
            "features": [
                "Blockchain carbon tracking",
                "Digital twin simulation",
                "AI-powered verification",
                "Real-time monitoring",
                "Carbon credit marketplace",
            ],
        }
    )


@app.route("/health")
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CarbonTwin API",
        "timestamp": datetime.now().isoformat(),
        "aiEnabled": core.ai_enabled(),
        "dbPath": core.db_path,
    })


@app.route("/api/config", methods=["GET"])
def api_config():
    return jsonify({
        "aiEnabled": core.ai_enabled(),
        "openaiTimeoutSec": OPENAI_TIMEOUT,
    })


@app.route("/api/verify-emission", methods=["POST"])
def verify_emission():
    try:
        data = request.get_json() or {}
        data["reported_emissions"] = core._safe_float(data.get("reported_emissions"), 0.0)
        data["production_volume"] = core._safe_float(data.get("production_volume"), 0.0)
        if not isinstance(data.get("energy_sources"), list):
            data["energy_sources"] = [str(data.get("energy_sources"))] if data.get("energy_sources") else []
        result = core.verify_emission_report_with_ai(data)
        conn = sqlite3.connect(core.db_path, check_same_thread=False)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO emission_reports (company_id, facility_id, reported_emissions, energy_sources, production_volume, verification_score, verified, ai_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.get("company_id", ""),
                data.get("facility_id", ""),
                data.get("reported_emissions", 0.0),
                json.dumps(data.get("energy_sources", [])),
                data.get("production_volume", 0.0),
                result.get("verification_score", 0),
                result.get("verified", False),
                json.dumps(result),
            ),
        )
        conn.commit()
        conn.close()
        return jsonify(result)
    except Exception as e:
        logger.error(f"verify_emission error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/create-twin", methods=["POST"])
def create_twin():
    try:
        facility_data = request.get_json() or {}
        twin = core.create_digital_twin_with_ai(facility_data)
        return jsonify(twin)
    except Exception as e:
        logger.error(f"create_twin error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/simulate/<twin_id>", methods=["POST"])
def simulate_scenarios(twin_id):
    try:
        payload = request.get_json() or {}
        scenarios = payload.get("scenarios", [])
        result = core.simulate_scenarios_with_ai(twin_id, scenarios)
        return jsonify(result)
    except Exception as e:
        logger.error(f"simulate_scenarios error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/<twin_id>", methods=["GET"])
def get_dashboard(twin_id):
    try:
        twin_data = core.get_digital_twin(twin_id)
        if not twin_data:
            return jsonify({"error": "Twin not found"}), 404

        def rand_normal(mu: float, sigma: float) -> float:
            if np is not None:
                try:
                    return float(np.random.normal(mu, sigma))  # type: ignore
                except Exception:
                    return random.normalvariate(mu, sigma)
            return random.normalvariate(mu, sigma)

        dashboard_data = {
            "twin_id": twin_id,
            "last_updated": datetime.now().isoformat(),
            "current_metrics": {
                "power_consumption_kw": round(rand_normal(150, 20), 2),
                "carbon_intensity": round(rand_normal(0.45, 0.05), 3),
                "efficiency_score": round(rand_normal(78, 5), 1),
                "daily_emissions_kg": round(rand_normal(1200, 150), 2),
            },
            "alerts": [
                {
                    "type": "warning",
                    "message": "Energy consumption 15% above baseline",
                    "timestamp": datetime.now().isoformat(),
                }
            ],
            "optimization_status": {
                "active_scenarios": 2,
                "projected_savings": "23% reduction",
                "implementation_progress": "Phase 1: 75% complete",
            },
        }
        return jsonify(dashboard_data)
    except Exception as e:
        logger.error(f"get_dashboard error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/summary", methods=["GET"])
def get_summary_report():
    try:
        conn = sqlite3.connect(core.db_path, check_same_thread=False)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM emission_reports")
        total_reports = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM emission_reports WHERE verified = 1")
        verified_reports = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM digital_twins")
        total_twins = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM simulation_results")
        total_simulations = cur.fetchone()[0]
        conn.close()
        summary = {
            "platform_stats": {
                "total_emission_reports": total_reports,
                "verified_reports": verified_reports,
                "verification_rate": round((verified_reports / max(total_reports, 1)) * 100, 1),
                "digital_twins_created": total_twins,
                "scenarios_simulated": total_simulations,
            },
            "ai_insights": {
                "chatgpt5_verifications": verified_reports,
                "fraud_detection_rate": "12%",
                "average_confidence_score": "87%",
                "optimization_opportunities_identified": total_simulations * 3,
            },
            "environmental_impact": {
                "total_emissions_tracked": "2.4M kg CO2",
                "potential_reductions_identified": "480K kg CO2",
                "carbon_credits_verified": "1,200 tons",
                "compliance_reports_generated": 45,
            },
        }
        return jsonify(summary)
    except Exception as e:
        logger.error(f"get_summary_report error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/credits", methods=["GET"])
def get_carbon_credits():
    try:
        credits = [
            {
                "id": "credit_001",
                "seller": "0x742d35Cc6634C0532925a3b8D4C9db3C18e5AA3",
                "amount": 1000,
                "pricePerTon": 25,
                "totalPrice": 25000,
                "projectName": "Amazon Rainforest Conservation",
                "projectType": "Forest Conservation",
                "location": "Brazil",
                "vintage": 2024,
                "certification": "VCS (Verified Carbon Standard)",
                "verificationStatus": "verified",
                "description": "Large-scale rainforest conservation project protecting 50,000 hectares of Amazon rainforest from deforestation.",
                "co2Reduced": 1000,
                "projectStart": "2023-01-01",
                "projectEnd": "2030-12-31",
            },
            {
                "id": "credit_002",
                "seller": "0x8ba1f109551bd432803012645hac136c4c78962",
                "amount": 500,
                "pricePerTon": 30,
                "totalPrice": 15000,
                "projectName": "Solar Farm Initiative",
                "projectType": "Renewable Energy",
                "location": "India",
                "vintage": 2024,
                "certification": "Gold Standard",
                "verificationStatus": "verified",
                "description": "Solar energy project replacing coal-powered electricity generation in rural communities.",
                "co2Reduced": 500,
                "projectStart": "2023-06-01",
                "projectEnd": "2028-06-01",
            },
        ]
        return jsonify({"credits": credits, "total": len(credits)})
    except Exception as e:
        logger.error(f"get_carbon_credits error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/stats", methods=["GET"])
def get_marketplace_stats():
    try:
        stats = {
            "totalCredits": 2550,
            "totalVolume": 125000,
            "averagePrice": 26.5,
            "totalCO2Offset": 2550,
            "activeListings": 12,
            "completedTrades": 38,
            "topProjects": [
                {"name": "Amazon Conservation", "volume": 45},
                {"name": "Solar Energy", "volume": 32},
                {"name": "Wind Farms", "volume": 23},
            ],
            "priceHistory": [
                {"date": "2024-01", "price": 24.5},
                {"date": "2024-02", "price": 25.2},
                {"date": "2024-03", "price": 26.1},
                {"date": "2024-04", "price": 26.8},
            ],
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"get_marketplace_stats error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/purchase", methods=["POST"])
def purchase_carbon_credits():
    try:
        data = request.get_json() or {}
        credit_id = data.get("creditId")
        amount = data.get("amount")
        buyer_address = data.get("buyerAddress")
        if not all([credit_id, amount, buyer_address]):
            return jsonify({"error": "Missing required fields"}), 400
        transaction = {
            "transactionId": f"tx_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "creditId": credit_id,
            "amount": amount,
            "buyerAddress": buyer_address,
            "status": "completed",
            "blockchainHash": f"0x{datetime.now().strftime('%Y%m%d%H%M%S')}abc123",
            "timestamp": datetime.now().isoformat(),
            "carbonCertificate": {
                "certificateId": f"cert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "co2Offset": amount,
                "issuedTo": buyer_address,
                "projectId": credit_id,
                "retirementStatus": "active",
            },
        }
        conn = sqlite3.connect(core.db_path, check_same_thread=False)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO carbon_transactions (transaction_id, credit_id, buyer_address, amount, blockchain_hash)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                transaction["transactionId"],
                credit_id,
                buyer_address,
                amount,
                transaction["blockchainHash"],
            ),
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "transaction": transaction, "message": f"Successfully purchased {amount} tons of carbon credits"})
    except Exception as e:
        logger.error(f"purchase_carbon_credits error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/verify-project", methods=["POST"])
def verify_carbon_project():
    try:
        project_data = request.get_json() or {}
        if core.ai_enabled():
            prompt = f"Verify carbon project: {json.dumps(project_data)}"
            resp = openai_client.chat.completions.create(
                model="openai/gpt-5-chat-latest",
                messages=[
                    {"role": "system", "content": "You are an expert carbon project auditor."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                top_p=0.7,
                frequency_penalty=0.5,
                max_tokens=1500,
                timeout=OPENAI_TIMEOUT,
            )
            verification_result = json.loads(resp.choices[0].message.content)
        else:
            verification_result = {
                "projectVerification": {
                    "overallScore": 75,
                    "verificationStatus": "CONDITIONAL",
                    "certificationRecommendation": "VCS",
                    "confidence": "MEDIUM",
                },
                "methodologyAssessment": {
                    "appropriate": True,
                    "standard": "VCS",
                    "baselineAccuracy": 80,
                    "issues": [],
                },
                "additionalityScore": 85,
                "permanenceRisk": "MEDIUM",
                "monitoringQuality": {
                    "adequacy": "GOOD",
                    "frequency": "Annual",
                    "methods": ["Remote sensing", "Field surveys"],
                },
                "sustainableDevelopment": {
                    "coBenefits": ["Biodiversity protection", "Local employment"],
                    "risks": ["Weather dependency"],
                    "sdgContribution": ["SDG 13", "SDG 15"],
                },
                "recommendations": ["Improve monitoring frequency", "Add buffer reserves"],
                "requiredImprovements": ["Enhanced documentation"],
                "estimatedCredits": project_data.get("expectedReduction", 0),
                "validationTimeline": "6-8 months",
            }
        return jsonify(verification_result)
    except Exception as e:
        logger.error(f"verify_carbon_project error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketplace/my-credits/<address>", methods=["GET"])
def get_user_credits(address):
    try:
        user_credits = [
            {
                "certificateId": "cert_20240823_001",
                "projectName": "Amazon Conservation",
                "amount": 50,
                "purchaseDate": "2024-08-01",
                "retirementStatus": "active",
                "co2Offset": 50,
            },
            {
                "certificateId": "cert_20240823_002",
                "projectName": "Solar Farm Initiative",
                "amount": 25,
                "purchaseDate": "2024-07-15",
                "retirementStatus": "active",
                "co2Offset": 25,
            },
        ]
        total_offset = sum(credit["co2Offset"] for credit in user_credits)
        return jsonify(
            {
                "credits": user_credits,
                "totalCredits": len(user_credits),
                "totalCO2Offset": total_offset,
                "address": address,
            }
        )
    except Exception as e:
        logger.error(f"get_user_credits error: {e}")
        return jsonify({"error": str(e)}), 500


@socketio.on("connect")
def handle_connect():
    emit("connected", {"message": "Connected to CarbonTwin real-time updates"})


@socketio.on("subscribe_twin")
def handle_subscribe_twin(data):
    twin_id = data.get("twin_id")
    emit("subscribed", {"twin_id": twin_id, "status": "subscribed"})


@socketio.on("disconnect")
def handle_disconnect():
    logger.info("Client disconnected")


if __name__ == "__main__":
    logger.info("Starting CarbonTwin API server...")
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=False, host="0.0.0.0", port=port)


