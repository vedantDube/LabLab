// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CarbonTracker
 * @dev Smart contract for tracking carbon emissions and trading carbon credits
 * @author CarbonTwin Team
 */
contract CarbonTracker is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _emissionReportIds;
    Counters.Counter private _carbonCreditIds;
    
    // Emission Report Structure
    struct EmissionReport {
        uint256 id;
        address company;
        string facilityId;
        uint256 emissionAmount; // in kg CO2
        uint256 productionVolume;
        string[] energySources;
        uint256 timestamp;
        bool verified;
        uint256 verificationScore; // 0-100
        string ipfsHash; // For storing detailed data
        address verifier;
    }
    
    // Carbon Credit Structure
    struct CarbonCredit {
        uint256 id;
        address owner;
        uint256 amount; // in tons CO2
        uint256 pricePerTon; // in wei
        string certificationHash;
        string projectDetails;
        bool retired;
        uint256 vintage; // Year of carbon reduction
        CreditType creditType;
    }
    
    // Digital Twin Structure
    struct DigitalTwin {
        string twinId;
        address owner;
        string facilityType;
        uint256 baselineEmissions;
        uint256 currentEmissions;
        uint256 lastUpdated;
        bool active;
        string dataHash; // IPFS hash for twin data
    }
    
    enum CreditType { RENEWABLE_ENERGY, FOREST_CONSERVATION, CARBON_CAPTURE, ENERGY_EFFICIENCY }
    
    // Mappings
    mapping(uint256 => EmissionReport) public emissionReports;
    mapping(uint256 => CarbonCredit) public carbonCredits;
    mapping(string => DigitalTwin) public digitalTwins;
    mapping(address => uint256[]) public companyReports;
    mapping(address => uint256[]) public ownedCredits;
    mapping(address => string[]) public companyTwins;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => uint256) public companyScores; // Sustainability score 0-100
    
    // Events
    event EmissionReported(
        uint256 indexed reportId,
        address indexed company,
        string facilityId,
        uint256 emissionAmount,
        uint256 timestamp
    );
    
    event EmissionVerified(
        uint256 indexed reportId,
        address indexed verifier,
        uint256 verificationScore,
        bool passed
    );
    
    event CarbonCreditMinted(
        uint256 indexed creditId,
        address indexed owner,
        uint256 amount,
        CreditType creditType
    );
    
    event CarbonCreditTraded(
        uint256 indexed creditId,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 price
    );
    
    event CarbonCreditRetired(
        uint256 indexed creditId,
        address indexed owner,
        uint256 amount
    );
    
    event DigitalTwinCreated(
        string indexed twinId,
        address indexed owner,
        string facilityType
    );
    
    event DigitalTwinUpdated(
        string indexed twinId,
        uint256 newEmissions,
        uint256 timestamp
    );
    
    // Modifiers
    modifier onlyVerifier() {
        require(authorizedVerifiers[msg.sender], "Not an authorized verifier");
        _;
    }
    
    modifier validReport(uint256 reportId) {
        require(reportId <= _emissionReportIds.current(), "Invalid report ID");
        _;
    }
    
    modifier validCredit(uint256 creditId) {
        require(creditId <= _carbonCreditIds.current(), "Invalid credit ID");
        require(!carbonCredits[creditId].retired, "Credit already retired");
        _;
    }
    
    constructor() {
        // Owner is automatically an authorized verifier
        authorizedVerifiers[msg.sender] = true;
    }
    
    /**
     * @dev Report carbon emissions for a facility
     * @param facilityId Unique identifier for the facility
     * @param emissionAmount Amount of CO2 emissions in kg
     * @param productionVolume Production volume for the period
     * @param energySources Array of energy source identifiers
     * @param ipfsHash IPFS hash containing detailed emission data
     */
    function reportEmissions(
        string memory facilityId,
        uint256 emissionAmount,
        uint256 productionVolume,
        string[] memory energySources,
        string memory ipfsHash
    ) external returns (uint256) {
        _emissionReportIds.increment();
        uint256 newReportId = _emissionReportIds.current();
        
        emissionReports[newReportId] = EmissionReport({
            id: newReportId,
            company: msg.sender,
            facilityId: facilityId,
            emissionAmount: emissionAmount,
            productionVolume: productionVolume,
            energySources: energySources,
            timestamp: block.timestamp,
            verified: false,
            verificationScore: 0,
            ipfsHash: ipfsHash,
            verifier: address(0)
        });
        
        companyReports[msg.sender].push(newReportId);
        
        emit EmissionReported(newReportId, msg.sender, facilityId, emissionAmount, block.timestamp);
        return newReportId;
    }
    
    /**
     * @dev Verify an emission report (only authorized verifiers)
     * @param reportId ID of the report to verify
     * @param verificationScore Score from 0-100 indicating verification confidence
     * @param passed Whether the report passes verification
     */
    function verifyEmissionReport(
        uint256 reportId,
        uint256 verificationScore,
        bool passed
    ) external onlyVerifier validReport(reportId) {
        require(verificationScore <= 100, "Score must be 0-100");
        require(!emissionReports[reportId].verified, "Report already verified");
        
        emissionReports[reportId].verified = true;
        emissionReports[reportId].verificationScore = verificationScore;
        emissionReports[reportId].verifier = msg.sender;
        
        // Update company sustainability score
        address company = emissionReports[reportId].company;
        if (passed) {
            companyScores[company] = (companyScores[company] + verificationScore) / 2;
        } else {
            companyScores[company] = companyScores[company] / 2; // Penalize failed verification
        }
        
        emit EmissionVerified(reportId, msg.sender, verificationScore, passed);
    }
    
    /**
     * @dev Create a digital twin for a facility
     * @param twinId Unique identifier for the digital twin
     * @param facilityType Type of facility (factory, office, etc.)
     * @param baselineEmissions Baseline emission amount in kg CO2
     * @param dataHash IPFS hash containing twin configuration data
     */
    function createDigitalTwin(
        string memory twinId,
        string memory facilityType,
        uint256 baselineEmissions,
        string memory dataHash
    ) external {
        require(bytes(digitalTwins[twinId].twinId).length == 0, "Twin ID already exists");
        
        digitalTwins[twinId] = DigitalTwin({
            twinId: twinId,
            owner: msg.sender,
            facilityType: facilityType,
            baselineEmissions: baselineEmissions,
            currentEmissions: baselineEmissions,
            lastUpdated: block.timestamp,
            active: true,
            dataHash: dataHash
        });
        
        companyTwins[msg.sender].push(twinId);
        
        emit DigitalTwinCreated(twinId, msg.sender, facilityType);
    }
    
    /**
     * @dev Update digital twin emissions
     * @param twinId ID of the digital twin to update
     * @param newEmissions New emission amount in kg CO2
     */
    function updateDigitalTwin(
        string memory twinId,
        uint256 newEmissions
    ) external {
        require(digitalTwins[twinId].owner == msg.sender, "Not twin owner");
        require(digitalTwins[twinId].active, "Twin not active");
        
        digitalTwins[twinId].currentEmissions = newEmissions;
        digitalTwins[twinId].lastUpdated = block.timestamp;
        
        emit DigitalTwinUpdated(twinId, newEmissions, block.timestamp);
    }
    
    /**
     * @dev Mint carbon credits
     * @param amount Amount of carbon credits in tons CO2
     * @param pricePerTon Price per ton in wei
     * @param certificationHash Hash of certification documents
     * @param projectDetails Description of the carbon reduction project
     * @param vintage Year of carbon reduction
     * @param creditType Type of carbon credit
     */
    function mintCarbonCredit(
        uint256 amount,
        uint256 pricePerTon,
        string memory certificationHash,
        string memory projectDetails,
        uint256 vintage,
        CreditType creditType
    ) external returns (uint256) {
        require(amount > 0, "Amount must be greater than 0");
        require(vintage >= 2020 && vintage <= block.timestamp / 365 days + 1970, "Invalid vintage year");
        
        _carbonCreditIds.increment();
        uint256 newCreditId = _carbonCreditIds.current();
        
        carbonCredits[newCreditId] = CarbonCredit({
            id: newCreditId,
            owner: msg.sender,
            amount: amount,
            pricePerTon: pricePerTon,
            certificationHash: certificationHash,
            projectDetails: projectDetails,
            retired: false,
            vintage: vintage,
            creditType: creditType
        });
        
        ownedCredits[msg.sender].push(newCreditId);
        
        emit CarbonCreditMinted(newCreditId, msg.sender, amount, creditType);
        return newCreditId;
    }
    
    /**
     * @dev Trade carbon credit
     * @param creditId ID of the credit to trade
     * @param amount Amount to trade (can be partial)
     */
    function tradeCarbonCredit(
        uint256 creditId,
        uint256 amount
    ) external payable nonReentrant validCredit(creditId) {
        CarbonCredit storage credit = carbonCredits[creditId];
        require(amount <= credit.amount, "Insufficient credit amount");
        require(msg.value >= credit.pricePerTon * amount, "Insufficient payment");
        require(credit.owner != msg.sender, "Cannot trade own credit");
        
        address previousOwner = credit.owner;
        uint256 totalPrice = credit.pricePerTon * amount;
        
        // Transfer payment to previous owner
        payable(previousOwner).transfer(totalPrice);
        
        // Handle partial vs full trade
        if (amount == credit.amount) {
            // Full trade - transfer ownership
            credit.owner = msg.sender;
            
            // Update ownership arrays
            _removeFromOwnedCredits(previousOwner, creditId);
            ownedCredits[msg.sender].push(creditId);
        } else {
            // Partial trade - create new credit for buyer
            credit.amount -= amount;
            
            _carbonCreditIds.increment();
            uint256 newCreditId = _carbonCreditIds.current();
            
            carbonCredits[newCreditId] = CarbonCredit({
                id: newCreditId,
                owner: msg.sender,
                amount: amount,
                pricePerTon: credit.pricePerTon,
                certificationHash: credit.certificationHash,
                projectDetails: credit.projectDetails,
                retired: false,
                vintage: credit.vintage,
                creditType: credit.creditType
            });
            
            ownedCredits[msg.sender].push(newCreditId);
        }
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit CarbonCreditTraded(creditId, previousOwner, msg.sender, amount, totalPrice);
    }
    
    /**
     * @dev Retire carbon credits (permanently remove from circulation)
     * @param creditId ID of the credit to retire
     */
    function retireCarbonCredit(uint256 creditId) external validCredit(creditId) {
        require(carbonCredits[creditId].owner == msg.sender, "Not credit owner");
        
        carbonCredits[creditId].retired = true;
        
        emit CarbonCreditRetired(creditId, msg.sender, carbonCredits[creditId].amount);
    }
    
    /**
     * @dev Add authorized verifier (only owner)
     * @param verifier Address to authorize as verifier
     */
    function addVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
    }
    
    /**
     * @dev Remove authorized verifier (only owner)
     * @param verifier Address to remove from verifiers
     */
    function removeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
    }
    
    /**
     * @dev Get company's emission reports
     * @param company Address of the company
     * @return Array of report IDs
     */
    function getCompanyReports(address company) external view returns (uint256[] memory) {
        return companyReports[company];
    }
    
    /**
     * @dev Get owned carbon credits
     * @param owner Address of the owner
     * @return Array of credit IDs
     */
    function getOwnedCredits(address owner) external view returns (uint256[] memory) {
        return ownedCredits[owner];
    }
    
    /**
     * @dev Get company's digital twins
     * @param company Address of the company
     * @return Array of twin IDs
     */
    function getCompanyTwins(address company) external view returns (string[] memory) {
        return companyTwins[company];
    }
    
    /**
     * @dev Get total emission reports count
     * @return Total number of reports
     */
    function getTotalReports() external view returns (uint256) {
        return _emissionReportIds.current();
    }
    
    /**
     * @dev Get total carbon credits count
     * @return Total number of credits
     */
    function getTotalCredits() external view returns (uint256) {
        return _carbonCreditIds.current();
    }
    
    /**
     * @dev Internal function to remove credit from owned credits array
     * @param owner Owner address
     * @param creditId Credit ID to remove
     */
    function _removeFromOwnedCredits(address owner, uint256 creditId) internal {
        uint256[] storage credits = ownedCredits[owner];
        for (uint256 i = 0; i < credits.length; i++) {
            if (credits[i] == creditId) {
                credits[i] = credits[credits.length - 1];
                credits.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        // Implementation for emergency pause
    }
    
    /**
     * @dev Get contract version
     * @return Contract version string
     */
    function getVersion() external pure returns (string memory) {
        return "CarbonTracker v1.0.0";
    }
}
