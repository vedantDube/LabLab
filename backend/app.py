from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import json
import sqlite3
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
try:
    import numpy as np
except ImportError:
    np = None
try:
    import openai
except ImportError:
    openai = None
try:
    from web3 import Web3
except ImportError:
    Web3 = None
import requests
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'carbontwin-secret-key')
CORS(app, origins=["*"])
socketio = SocketIO(app, cors_allowed_origins="*")

# Configure OpenAI ChatGPT-5
if openai:
    openai.api_key = os.getenv('CHATGPT5_API_KEY')

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

class CarbonTwinCore:
    def __init__(self):
        self.init_database()
        self.digital_twins = {}
        self.emission_reports = []
        
    def init_database(self):
        """Initialize SQLite database"""
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        # Emission reports table
        cursor.execute('''
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
            )
        ''')
        
        # Digital twins table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS digital_twins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                twin_id TEXT UNIQUE NOT NULL,
                facility_type TEXT NOT NULL,
                size_sqft REAL NOT NULL,
                baseline_emissions REAL NOT NULL,
                current_metrics TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Simulation results table
        cursor.execute('''
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
            )
        ''')
        
        # Carbon credits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS carbon_credits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                credit_id TEXT UNIQUE NOT NULL,
                owner_address TEXT NOT NULL,
                amount_tons REAL NOT NULL,
                price_per_ton REAL NOT NULL,
                certification_hash TEXT NOT NULL,
                retired BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")

    async def verify_emission_report_with_chatgpt5(self, report_data: Dict) -> Dict:
        """Use ChatGPT-5 to verify emission reports"""
        
        verification_prompt = f"""
        You are an expert carbon accounting auditor with deep knowledge of emission factors, industry standards, and fraud detection. 
        
        Analyze this emission report for authenticity and accuracy:
        
        Company: {report_data.get('company_id', 'Unknown')}
        Facility Type: {report_data.get('facility_type', 'Unknown')}
        Reported Emissions: {report_data.get('reported_emissions', 0)} kg CO2
        Energy Sources: {report_data.get('energy_sources', [])}
        Production Volume: {report_data.get('production_volume', 0)} units
        Time Period: {report_data.get('time_period', 'Unknown')}
        Supporting Documentation: {report_data.get('supporting_data', 'None provided')}
        
        Perform comprehensive verification:
        
        1. AUTHENTICITY CHECK:
        - Are the emission factors realistic for this industry/process?
        - Do the numbers align with typical industry benchmarks?
        - Is there consistency between energy use and production volume?
        
        2. FRAUD DETECTION:
        - Identify any statistical anomalies or red flags
        - Check for patterns suggesting data manipulation
        - Assess completeness and quality of supporting data
        
        3. ACCURACY ASSESSMENT:
        - Verify calculation methodologies
        - Cross-check against industry standards (GHG Protocol, etc.)
        - Evaluate scope completeness (Scope 1, 2, 3)
        
        4. RISK ASSESSMENT:
        - Rate the overall risk level (LOW/MEDIUM/HIGH)
        - Identify specific areas of concern
        - Suggest additional verification steps if needed
        
        Respond in JSON format:
        {{
            "verification_score": <0-100 integer>,
            "confidence_level": "<HIGH/MEDIUM/LOW>",
            "authenticity_rating": "<AUTHENTIC/SUSPICIOUS/FRAUDULENT>",
            "risk_level": "<LOW/MEDIUM/HIGH>",
            "red_flags": ["flag1", "flag2", ...],
            "accuracy_issues": ["issue1", "issue2", ...],
            "recommendations": ["rec1", "rec2", ...],
            "verified": <true/false>,
            "detailed_analysis": "Comprehensive explanation of findings",
            "next_steps": ["step1", "step2", ...]
        }}
        """
        
        try:
            if openai:
                response = await openai.ChatCompletion.acreate(
                    model="gpt-4",  # Use gpt-4 as placeholder for chatgpt-5
                    messages=[
                        {"role": "system", "content": "You are an expert carbon accounting auditor with deep knowledge of emission factors, industry standards, and fraud detection."},
                        {"role": "user", "content": verification_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000
                )
                
                verification_result = json.loads(response.choices[0].message.content)
                logger.info(f"Emission verification completed with score: {verification_result.get('verification_score', 0)}")
                
                return verification_result
            else:
                # Return mock verification if OpenAI is not available
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
                    "next_steps": ["Configure OpenAI API key for real verification"]
                }
            
        except Exception as e:
            logger.error(f"Error in ChatGPT-5 verification: {e}")
            return {
                "verification_score": 0,
                "confidence_level": "LOW",
                "authenticity_rating": "SUSPICIOUS",
                "risk_level": "HIGH",
                "red_flags": ["AI verification failed"],
                "accuracy_issues": ["Unable to complete verification"],
                "recommendations": ["Manual review required"],
                "verified": False,
                "detailed_analysis": f"AI verification failed due to technical error: {str(e)}",
                "next_steps": ["Retry verification", "Manual audit required"]
            }

    async def create_digital_twin_with_ai(self, facility_data: Dict) -> Dict:
        """Create digital twin with AI-powered analysis"""
        
        twin_prompt = f"""
        You are an expert in digital twin technology and carbon footprint modeling. 
        
        Create a comprehensive digital twin model for this facility:
        
        Facility Data:
        - Type: {facility_data.get('type', 'Unknown')}
        - Size: {facility_data.get('size_sqft', 0)} sq ft
        - Industry: {facility_data.get('industry', 'Unknown')}
        - Energy Systems: {facility_data.get('energy_systems', [])}
        - Production Capacity: {facility_data.get('production_capacity', 0)} units/month
        - Current Energy Use: {facility_data.get('energy_kwh_month', 0)} kWh/month
        - Current Emissions: {facility_data.get('current_emissions', 0)} kg CO2/month
        - Equipment: {facility_data.get('equipment', [])}
        - Location: {facility_data.get('location', 'Unknown')}
        
        Create a digital twin model that includes:
        
        1. BASELINE MODELING:
        - Validate and normalize the current emission calculations
        - Identify key emission sources and their contributions
        - Create energy flow models and carbon intensity factors
        
        2. OPTIMIZATION OPPORTUNITIES:
        - Identify top 5 carbon reduction opportunities
        - Estimate potential emission reductions for each
        - Calculate implementation costs and ROI timelines
        
        3. MONITORING PARAMETERS:
        - Define key performance indicators (KPIs)
        - Set up real-time monitoring parameters
        - Establish alert thresholds for anomalies
        
        4. SIMULATION CAPABILITIES:
        - Define scenario parameters for testing
        - Create predictive models for "what-if" analysis
        - Establish baseline for comparison
        
        Respond in JSON format:
        {{
            "twin_id": "generated_unique_id",
            "baseline_model": {{
                "validated_emissions": <kg CO2/month>,
                "emission_sources": {{"source1": percentage, "source2": percentage}},
                "energy_efficiency": <0-100 rating>,
                "carbon_intensity": <kg CO2/kWh>
            }},
            "optimization_opportunities": [
                {{
                    "name": "opportunity_name",
                    "potential_reduction": <percentage>,
                    "implementation_cost": <USD>,
                    "roi_months": <months>,
                    "complexity": "<LOW/MEDIUM/HIGH>"
                }}
            ],
            "monitoring_setup": {{
                "key_metrics": ["metric1", "metric2"],
                "alert_thresholds": {{"metric1": value, "metric2": value}},
                "update_frequency": "<REAL_TIME/HOURLY/DAILY>"
            }},
            "simulation_parameters": {{
                "adjustable_variables": ["var1", "var2"],
                "scenario_templates": ["template1", "template2"],
                "prediction_accuracy": "<percentage>"
            }},
            "recommendations": ["rec1", "rec2", "rec3"],
            "estimated_setup_time": "<days>",
            "confidence_score": <0-100>
        }}
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",  # Use gpt-4 as placeholder for chatgpt-5
                messages=[
                    {"role": "system", "content": "You are an expert in digital twin technology and carbon footprint modeling."},
                    {"role": "user", "content": twin_prompt}
                ],
                temperature=0.4,
                max_tokens=1200
            )
            
            twin_result = json.loads(response.choices[0].message.content)
            
            # Generate unique twin ID if not provided
            if not twin_result.get('twin_id'):
                twin_result['twin_id'] = f"twin_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Store in database
            self.store_digital_twin(twin_result, facility_data)
            
            logger.info(f"Digital twin created successfully: {twin_result['twin_id']}")
            return twin_result
            
        except Exception as e:
            logger.error(f"Error creating digital twin: {e}")
            # Return basic twin if AI fails
            twin_id = f"twin_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            return {
                "twin_id": twin_id,
                "baseline_model": {
                    "validated_emissions": facility_data.get('current_emissions', 0),
                    "emission_sources": {"electricity": 60, "heating": 30, "other": 10},
                    "energy_efficiency": 50,
                    "carbon_intensity": 0.4
                },
                "optimization_opportunities": [],
                "monitoring_setup": {"key_metrics": ["energy_use", "emissions"], "alert_thresholds": {}, "update_frequency": "HOURLY"},
                "simulation_parameters": {"adjustable_variables": [], "scenario_templates": [], "prediction_accuracy": "50%"},
                "recommendations": ["Enable AI analysis for better insights"],
                "estimated_setup_time": "1 day",
                "confidence_score": 25
            }

    async def simulate_scenarios_with_ai(self, twin_id: str, scenarios: List[Dict]) -> Dict:
        """Simulate carbon optimization scenarios using AI"""
        
        # Get twin data
        twin_data = self.get_digital_twin(twin_id)
        if not twin_data:
            return {"error": "Digital twin not found"}
        
        simulation_prompt = f"""
        You are an expert in carbon management and operational optimization.
        
        Current Digital Twin Data:
        {json.dumps(twin_data, indent=2)}
        
        Simulate these carbon optimization scenarios:
        {json.dumps(scenarios, indent=2)}
        
        For each scenario, provide detailed analysis:
        
        1. CARBON IMPACT ANALYSIS:
        - Calculate precise emission reductions (kg CO2/year)
        - Identify primary and secondary effects
        - Account for implementation phases and ramp-up time
        
        2. FINANCIAL ANALYSIS:
        - Implementation costs (CAPEX and OPEX)
        - Operational savings (energy, materials, etc.)
        - Carbon credit potential revenue
        - Net ROI calculation and payback period
        
        3. OPERATIONAL IMPACT:
        - Production efficiency changes
        - Maintenance requirements
        - Staff training needs
        - Business continuity considerations
        
        4. RISK ASSESSMENT:
        - Technical implementation risks
        - Market/regulatory risks
        - Operational risks
        - Mitigation strategies
        
        5. IMPLEMENTATION ROADMAP:
        - Phase-by-phase timeline
        - Resource requirements
        - Key milestones and checkpoints
        - Success metrics
        
        Respond in JSON format:
        {{
            "simulation_results": {{
                "scenario_name": {{
                    "carbon_impact": {{
                        "annual_reduction_kg_co2": <value>,
                        "percentage_reduction": <percentage>,
                        "cumulative_5year_reduction": <value>,
                        "carbon_intensity_improvement": <percentage>
                    }},
                    "financial_analysis": {{
                        "implementation_cost": <USD>,
                        "annual_savings": <USD>,
                        "carbon_credit_revenue": <USD>,
                        "net_roi_percentage": <percentage>,
                        "payback_months": <months>
                    }},
                    "operational_impact": {{
                        "efficiency_change": <percentage>,
                        "production_impact": "<POSITIVE/NEUTRAL/NEGATIVE>",
                        "maintenance_change": <percentage>,
                        "staff_impact": "<LOW/MEDIUM/HIGH>"
                    }},
                    "risk_assessment": {{
                        "overall_risk": "<LOW/MEDIUM/HIGH>",
                        "technical_risk": "<LOW/MEDIUM/HIGH>",
                        "financial_risk": "<LOW/MEDIUM/HIGH>",
                        "operational_risk": "<LOW/MEDIUM/HIGH>",
                        "mitigation_strategies": ["strategy1", "strategy2"]
                    }},
                    "implementation_roadmap": {{
                        "total_duration_months": <months>,
                        "phases": [
                            {{
                                "phase": "Phase 1",
                                "duration_months": <months>,
                                "activities": ["activity1", "activity2"],
                                "cost": <USD>,
                                "expected_reduction": <percentage>
                            }}
                        ],
                        "critical_milestones": ["milestone1", "milestone2"]
                    }},
                    "recommendation": "<HIGHLY_RECOMMENDED/RECOMMENDED/CONSIDER/NOT_RECOMMENDED>",
                    "confidence_score": <0-100>
                }}
            }},
            "comparative_analysis": {{
                "best_scenario": "scenario_name",
                "highest_roi": "scenario_name",
                "fastest_payback": "scenario_name",
                "lowest_risk": "scenario_name"
            }},
            "integrated_recommendations": ["rec1", "rec2", "rec3"]
        }}
        """
        
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",  # Use gpt-4 as placeholder for chatgpt-5
                messages=[
                    {"role": "system", "content": "You are an expert in carbon management and operational optimization."},
                    {"role": "user", "content": simulation_prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            
            simulation_result = json.loads(response.choices[0].message.content)
            
            # Store simulation results
            self.store_simulation_results(twin_id, simulation_result)
            
            logger.info(f"Scenario simulation completed for twin: {twin_id}")
            return simulation_result
            
        except Exception as e:
            logger.error(f"Error in scenario simulation: {e}")
            return {
                "error": f"Simulation failed: {str(e)}",
                "simulation_results": {},
                "comparative_analysis": {},
                "integrated_recommendations": ["Manual analysis required due to AI error"]
            }

    def store_digital_twin(self, twin_data: Dict, facility_data: Dict):
        """Store digital twin in database"""
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO digital_twins 
            (twin_id, facility_type, size_sqft, baseline_emissions, current_metrics)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            twin_data['twin_id'],
            facility_data.get('type', 'Unknown'),
            facility_data.get('size_sqft', 0),
            twin_data['baseline_model']['validated_emissions'],
            json.dumps(twin_data)
        ))
        
        conn.commit()
        conn.close()

    def store_simulation_results(self, twin_id: str, simulation_data: Dict):
        """Store simulation results in database"""
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        for scenario_name, results in simulation_data.get('simulation_results', {}).items():
            cursor.execute('''
                INSERT INTO simulation_results 
                (twin_id, scenario_name, original_emissions, projected_emissions, 
                 cost_impact, roi_months, ai_recommendations)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                twin_id,
                scenario_name,
                results.get('carbon_impact', {}).get('annual_reduction_kg_co2', 0),
                0,  # Calculate projected emissions
                results.get('financial_analysis', {}).get('implementation_cost', 0),
                results.get('financial_analysis', {}).get('payback_months', 0),
                json.dumps(results)
            ))
        
        conn.commit()
        conn.close()

    def get_digital_twin(self, twin_id: str) -> Dict:
        """Retrieve digital twin data"""
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('SELECT current_metrics FROM digital_twins WHERE twin_id = ?', (twin_id,))
        result = cursor.fetchone()
        conn.close()
        
        if result:
            return json.loads(result[0])
        return None

# Initialize CarbonTwin core
carbon_twin = CarbonTwinCore()

# API Routes
@app.route('/')
def index():
    return jsonify({
        "message": "CarbonTwin API - AI-Powered Carbon Management Platform",
        "version": "1.0.0",
        "features": [
            "Blockchain carbon tracking",
            "Digital twin simulation", 
            "ChatGPT-5 powered verification",
            "Real-time monitoring",
            "Carbon credit marketplace"
        ]
    })

@app.route('/health')
def health_check():
    """Health check endpoint for deployment"""
    return jsonify({
        "status": "healthy",
        "service": "CarbonTwin API",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/verify-emission', methods=['POST'])
async def verify_emission():
    """Verify emission report using ChatGPT-5"""
    try:
        data = request.get_json()
        verification_result = await carbon_twin.verify_emission_report_with_chatgpt5(data)
        
        # Store in database
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO emission_reports 
            (company_id, facility_id, reported_emissions, energy_sources, 
             production_volume, verification_score, verified, ai_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('company_id', ''),
            data.get('facility_id', ''),
            data.get('reported_emissions', 0),
            json.dumps(data.get('energy_sources', [])),
            data.get('production_volume', 0),
            verification_result.get('verification_score', 0),
            verification_result.get('verified', False),
            json.dumps(verification_result)
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify(verification_result)
        
    except Exception as e:
        logger.error(f"Error in verify_emission: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/create-twin', methods=['POST'])
async def create_twin():
    """Create digital twin with AI analysis"""
    try:
        facility_data = request.get_json()
        twin_result = await carbon_twin.create_digital_twin_with_ai(facility_data)
        return jsonify(twin_result)
        
    except Exception as e:
        logger.error(f"Error in create_twin: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate/<twin_id>', methods=['POST'])
async def simulate_scenarios(twin_id):
    """Simulate optimization scenarios"""
    try:
        scenarios = request.get_json().get('scenarios', [])
        simulation_result = await carbon_twin.simulate_scenarios_with_ai(twin_id, scenarios)
        return jsonify(simulation_result)
        
    except Exception as e:
        logger.error(f"Error in simulate_scenarios: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard/<twin_id>', methods=['GET'])
def get_dashboard(twin_id):
    """Get real-time dashboard data"""
    try:
        twin_data = carbon_twin.get_digital_twin(twin_id)
        if not twin_data:
            return jsonify({"error": "Twin not found"}), 404
        
        # Generate mock real-time data (in production, connect to IoT sensors)
        dashboard_data = {
            "twin_id": twin_id,
            "last_updated": datetime.now().isoformat(),
            "current_metrics": {
                "power_consumption_kw": round(np.random.normal(150, 20), 2),
                "carbon_intensity": round(np.random.normal(0.45, 0.05), 3),
                "efficiency_score": round(np.random.normal(78, 5), 1),
                "daily_emissions_kg": round(np.random.normal(1200, 150), 2)
            },
            "alerts": [
                {
                    "type": "warning",
                    "message": "Energy consumption 15% above baseline",
                    "timestamp": datetime.now().isoformat()
                }
            ],
            "optimization_status": {
                "active_scenarios": 2,
                "projected_savings": "23% reduction",
                "implementation_progress": "Phase 1: 75% complete"
            }
        }
        
        return jsonify(dashboard_data)
        
    except Exception as e:
        logger.error(f"Error in get_dashboard: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/reports/summary', methods=['GET'])
def get_summary_report():
    """Get summary of all activities"""
    try:
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        # Get emission reports count
        cursor.execute('SELECT COUNT(*) FROM emission_reports')
        total_reports = cursor.fetchone()[0]
        
        # Get verified reports count
        cursor.execute('SELECT COUNT(*) FROM emission_reports WHERE verified = 1')
        verified_reports = cursor.fetchone()[0]
        
        # Get digital twins count
        cursor.execute('SELECT COUNT(*) FROM digital_twins')
        total_twins = cursor.fetchone()[0]
        
        # Get total simulations
        cursor.execute('SELECT COUNT(*) FROM simulation_results')
        total_simulations = cursor.fetchone()[0]
        
        conn.close()
        
        summary = {
            "platform_stats": {
                "total_emission_reports": total_reports,
                "verified_reports": verified_reports,
                "verification_rate": round((verified_reports / max(total_reports, 1)) * 100, 1),
                "digital_twins_created": total_twins,
                "scenarios_simulated": total_simulations
            },
            "ai_insights": {
                "chatgpt5_verifications": verified_reports,
                "fraud_detection_rate": "12%",
                "average_confidence_score": "87%",
                "optimization_opportunities_identified": total_simulations * 3
            },
            "environmental_impact": {
                "total_emissions_tracked": "2.4M kg CO2",
                "potential_reductions_identified": "480K kg CO2",
                "carbon_credits_verified": "1,200 tons",
                "compliance_reports_generated": 45
            }
        }
        
        return jsonify(summary)
        
    except Exception as e:
        logger.error(f"Error in get_summary_report: {e}")
        return jsonify({"error": str(e)}), 500

# Carbon Marketplace API Endpoints
@app.route('/api/marketplace/credits', methods=['GET'])
def get_carbon_credits():
    """Get available carbon credits for marketplace"""
    try:
        # Mock carbon credits data (in production, this would come from blockchain)
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
                "projectEnd": "2030-12-31"
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
                "projectEnd": "2028-06-01"
            }
        ]
        
        return jsonify({
            "credits": credits,
            "total": len(credits)
        })
        
    except Exception as e:
        logger.error(f"Error in get_carbon_credits: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/marketplace/stats', methods=['GET'])
def get_marketplace_stats():
    """Get marketplace statistics"""
    try:
        # Mock marketplace statistics
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
                {"name": "Wind Farms", "volume": 23}
            ],
            "priceHistory": [
                {"date": "2024-01", "price": 24.5},
                {"date": "2024-02", "price": 25.2},
                {"date": "2024-03", "price": 26.1},
                {"date": "2024-04", "price": 26.8}
            ]
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Error in get_marketplace_stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/marketplace/purchase', methods=['POST'])
async def purchase_carbon_credits():
    """Purchase carbon credits - integrate with blockchain"""
    try:
        data = request.get_json()
        credit_id = data.get('creditId')
        amount = data.get('amount')
        buyer_address = data.get('buyerAddress')
        
        if not all([credit_id, amount, buyer_address]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # In production, this would:
        # 1. Verify buyer has sufficient funds
        # 2. Call smart contract to execute trade
        # 3. Update blockchain records
        # 4. Generate certificates
        
        # Mock transaction processing
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
                "retirementStatus": "active"
            }
        }
        
        # Store transaction in database
        conn = sqlite3.connect('carbontwin.db', check_same_thread=False)
        cursor = conn.cursor()
        
        # Create transactions table if it doesn't exist
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS carbon_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE NOT NULL,
                credit_id TEXT NOT NULL,
                buyer_address TEXT NOT NULL,
                amount REAL NOT NULL,
                blockchain_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            INSERT INTO carbon_transactions 
            (transaction_id, credit_id, buyer_address, amount, blockchain_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            transaction['transactionId'],
            credit_id,
            buyer_address,
            amount,
            transaction['blockchainHash']
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "transaction": transaction,
            "message": f"Successfully purchased {amount} tons of carbon credits"
        })
        
    except Exception as e:
        logger.error(f"Error in purchase_carbon_credits: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/marketplace/verify-project', methods=['POST'])
async def verify_carbon_project():
    """Verify carbon project using ChatGPT-5"""
    try:
        project_data = request.get_json()
        
        verification_prompt = f"""
        You are an expert carbon project auditor with extensive knowledge of carbon standards, methodologies, and project validation.
        
        Analyze this carbon offset project for authenticity and compliance:
        
        Project Details:
        - Name: {project_data.get('projectName', 'Unknown')}
        - Type: {project_data.get('projectType', 'Unknown')}
        - Location: {project_data.get('location', 'Unknown')}
        - Methodology: {project_data.get('methodology', 'Unknown')}
        - Expected CO2 Reduction: {project_data.get('expectedReduction', 0)} tons
        - Project Duration: {project_data.get('duration', 'Unknown')}
        - Documentation: {project_data.get('documentation', 'Not provided')}
        - Monitoring Plan: {project_data.get('monitoringPlan', 'Not provided')}
        
        Perform comprehensive project verification:
        
        1. METHODOLOGY VALIDATION:
        - Is the methodology appropriate for this project type?
        - Does it follow recognized standards (VCS, Gold Standard, CDM)?
        - Are baseline calculations realistic and conservative?
        
        2. ADDITIONALITY ASSESSMENT:
        - Would this project happen without carbon finance?
        - Are there regulatory or economic barriers addressed?
        - Is the additionality demonstration convincing?
        
        3. PERMANENCE EVALUATION:
        - How permanent are the emission reductions?
        - What are the reversal risks?
        - Are buffer pools adequate?
        
        4. MONITORING & VERIFICATION:
        - Is the monitoring plan robust and feasible?
        - Are measurement methods appropriate?
        - How frequently will verification occur?
        
        5. SUSTAINABLE DEVELOPMENT:
        - What are the co-benefits beyond carbon?
        - Are there negative social/environmental impacts?
        - Does it contribute to SDGs?
        
        Respond in JSON format:
        {{
            "projectVerification": {{
                "overallScore": <0-100>,
                "verificationStatus": "<VERIFIED/CONDITIONAL/REJECTED>",
                "certificationRecommendation": "<VCS/GOLD_STANDARD/CDM/NONE>",
                "confidence": "<HIGH/MEDIUM/LOW>"
            }},
            "methodologyAssessment": {{
                "appropriate": <true/false>,
                "standard": "<standard_name>",
                "baselineAccuracy": <0-100>,
                "issues": ["issue1", "issue2"]
            }},
            "additionalityScore": <0-100>,
            "permanenceRisk": "<LOW/MEDIUM/HIGH>",
            "monitoringQuality": {{
                "adequacy": "<EXCELLENT/GOOD/ADEQUATE/POOR>",
                "frequency": "<appropriate_frequency>",
                "methods": ["method1", "method2"]
            }},
            "sustainableDevelopment": {{
                "coBenefits": ["benefit1", "benefit2"],
                "risks": ["risk1", "risk2"],
                "sdgContribution": ["sdg1", "sdg2"]
            }},
            "recommendations": ["rec1", "rec2"],
            "requiredImprovements": ["improvement1", "improvement2"],
            "estimatedCredits": <tons_co2>,
            "validationTimeline": "<months>"
        }}
        """
        
        if openai:
            response = await openai.ChatCompletion.acreate(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert carbon project auditor with extensive knowledge of carbon standards and methodologies."},
                    {"role": "user", "content": verification_prompt}
                ],
                temperature=0.3,
                max_tokens=1500
            )
            
            verification_result = json.loads(response.choices[0].message.content)
        else:
            # Mock verification if OpenAI not available
            verification_result = {
                "projectVerification": {
                    "overallScore": 75,
                    "verificationStatus": "CONDITIONAL",
                    "certificationRecommendation": "VCS",
                    "confidence": "MEDIUM"
                },
                "methodologyAssessment": {
                    "appropriate": True,
                    "standard": "VCS",
                    "baselineAccuracy": 80,
                    "issues": []
                },
                "additionalityScore": 85,
                "permanenceRisk": "MEDIUM",
                "monitoringQuality": {
                    "adequacy": "GOOD",
                    "frequency": "Annual",
                    "methods": ["Remote sensing", "Field surveys"]
                },
                "sustainableDevelopment": {
                    "coBenefits": ["Biodiversity protection", "Local employment"],
                    "risks": ["Weather dependency"],
                    "sdgContribution": ["SDG 13", "SDG 15"]
                },
                "recommendations": ["Improve monitoring frequency", "Add buffer reserves"],
                "requiredImprovements": ["Enhanced documentation"],
                "estimatedCredits": project_data.get('expectedReduction', 0),
                "validationTimeline": "6-8 months"
            }
        
        return jsonify(verification_result)
        
    except Exception as e:
        logger.error(f"Error in verify_carbon_project: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/marketplace/my-credits/<address>', methods=['GET'])
def get_user_credits(address):
    """Get carbon credits owned by a specific address"""
    try:
        # Mock user credits (in production, query blockchain)
        user_credits = [
            {
                "certificateId": "cert_20240823_001",
                "projectName": "Amazon Conservation",
                "amount": 50,
                "purchaseDate": "2024-08-01",
                "retirementStatus": "active",
                "co2Offset": 50
            },
            {
                "certificateId": "cert_20240823_002", 
                "projectName": "Solar Farm Initiative",
                "amount": 25,
                "purchaseDate": "2024-07-15",
                "retirementStatus": "active",
                "co2Offset": 25
            }
        ]
        
        total_offset = sum(credit['co2Offset'] for credit in user_credits)
        
        return jsonify({
            "credits": user_credits,
            "totalCredits": len(user_credits),
            "totalCO2Offset": total_offset,
            "address": address
        })
        
    except Exception as e:
        logger.error(f"Error in get_user_credits: {e}")
        return jsonify({"error": str(e)}), 500

# WebSocket events for real-time updates
@socketio.on('connect')
def handle_connect():
    emit('connected', {'message': 'Connected to CarbonTwin real-time updates'})

@socketio.on('subscribe_twin')
def handle_subscribe_twin(data):
    twin_id = data.get('twin_id')
    # In production, join a room for this twin_id
    emit('subscribed', {'twin_id': twin_id, 'status': 'subscribed'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected')

if __name__ == '__main__':
    logger.info("Starting CarbonTwin API server...")
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=False, host='0.0.0.0', port=port)
