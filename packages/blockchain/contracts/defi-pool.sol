// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";


/**
 * @title PropertyDeFiPool
 * @dev DeFi pool for fractional property investment with rental yield distribution
 */
abstract contract PropertyDeFiPool is ERC20, ReentrancyGuard, Ownable, Pausable {
    using Math for uint256;
    
    enum PoolStatus { Active, Closed, Liquidated }
    
    struct PropertyAsset {
        string propertyId;
        uint256 value;
        uint256 acquisitionDate;
        string location;
        string county;
        bool verified;
        uint256 monthlyRental;
        uint256 expectedYield; // Annual percentage
    }
    
    struct InvestorInfo {
        uint256 totalInvested;
        uint256 sharesOwned;
        uint256 lastYieldClaim;
        uint256 totalYieldClaimed;
        bool kycCompleted;
        string jurisdiction;
    }
    
    struct YieldDistribution {
        uint256 totalAmount;
        uint256 distributionDate;
        uint256 perShareAmount;
        uint256 claimedAmount;
        string source; // "rental_income", "property_sale", "dividends"
    }
    
    // Pool configuration
    uint256 public constant MINIMUM_INVESTMENT = 10000; // 10,000 KES
    uint256 public constant MAXIMUM_INVESTMENT = 10000000; // 10M KES per investor
    uint256 public constant POOL_CAP = 100000000; // 100M KES total
    uint256 public constant MANAGEMENT_FEE_BPS = 200; // 2%
    uint256 public constant PERFORMANCE_FEE_BPS = 1000; // 10%
    
    // Pool state
    PoolStatus public poolStatus;
    uint256 public totalPoolValue;
    uint256 public totalRaisedAmount;
    uint256 public poolCreationDate;
    uint256 public lockupPeriod; // in seconds
    uint256 public targetAPY; // in basis points
    
    // Assets and investments
    PropertyAsset[] public properties;
    mapping(address => InvestorInfo) public investors;
    mapping(uint256 => YieldDistribution) public yieldDistributions;
    uint256 public yieldDistributionCount;
    
    // regulatory compliance
    bool public kenyaRegulated;
    string public regulatoryLicense;
    mapping(address => bool) public accreditedInvestors;
    
    // Events
    event InvestmentMade(address indexed investor, uint256 amount, uint256 shares);
    event PropertyAdded(string indexed propertyId, uint256 value, string location);
    event YieldDistributed(uint256 indexed distributionId, uint256 totalAmount);
    event YieldClaimed(address indexed investor, uint256 amount);
    event InvestmentWithdrawn(address indexed investor, uint256 amount, uint256 shares);
    event PoolStatusChanged(PoolStatus newStatus);
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _targetAPY,
        uint256 _lockupPeriod,
        string memory _regulatoryLicense
    ) ERC20(_name, _symbol) {
        poolStatus = PoolStatus.Active;
        poolCreationDate = block.timestamp;
        lockupPeriod = _lockupPeriod;
        targetAPY = _targetAPY;
        regulatoryLicense = _regulatoryLicense;
        kenyaRegulated = bytes(_regulatoryLicense).length > 0;
        yieldDistributionCount = 0;
    }
    
    /**
     * @dev Invest in the pool
     */
    function invest() public payable nonReentrant whenNotPaused {
        require(poolStatus == PoolStatus.Active, "Pool not active");
        require(msg.value >= MINIMUM_INVESTMENT, "Below minimum investment");
        require(msg.value <= MAXIMUM_INVESTMENT, "Exceeds maximum investment");
        require(totalRaisedAmount + msg.value <= POOL_CAP, "Exceeds pool cap");
        totalRaisedAmount += msg.value;
        
        InvestorInfo storage investor = investors[msg.sender];
        
        // KYC check for large investments
        if (msg.value > 100000 || investor.totalInvested + msg.value > 500000) {
            require(investor.kycCompleted, "KYC verification required");
        }
        
        // Calculate shares to mint (1:1 initially, then based on NAV)
        uint256 sharesToMint;
        if (totalSupply() == 0) {
            sharesToMint = msg.value;
        } else {
            sharesToMint = msg.value * totalSupply() / getNetAssetValue();
        }
        
        // Update investor info
        investor.totalInvested = investor.totalInvested + msg.value;
        investor.sharesOwned = investor.sharesOwned + sharesToMint;
        investor.lastYieldClaim = block.timestamp;
        
        // Update pool totals
        totalRaisedAmount = totalRaisedAmount + msg.value;
        totalPoolValue = totalPoolValue + msg.value;
        
        // Mint shares
        _mint(msg.sender, sharesToMint);
        
        emit InvestmentMade(msg.sender, msg.value, sharesToMint);
    }
    
    /**
     * @dev Add property to pool
     */
    function addProperty(
        string memory _propertyId,
        uint256 _value,
        string memory _location,
        string memory _county,
        uint256 _monthlyRental,
        uint256 _expectedYield
    ) public onlyOwner {
        require(_value > 0, "Property value must be positive");
        require(_expectedYield > 0, "Expected yield must be positive");
        
        properties.push(PropertyAsset({
            propertyId: _propertyId,
            value: _value,
            acquisitionDate: block.timestamp,
            location: _location,
            county: _county,
            verified: false,
            monthlyRental: _monthlyRental,
            expectedYield: _expectedYield
        }));
        
        totalPoolValue = totalPoolValue + _value;
        
        emit PropertyAdded(_propertyId, _value, _location);
    }
    
    /**
     * @dev Distribute yield to token holders
     */
    function distributeYield(uint256 _amount, string memory _source) 
        public 
        onlyOwner 
        nonReentrant 
    {
        require(_amount > 0, "Amount must be positive");
        require(totalSupply() > 0, "No shares outstanding");
        
        // Deduct management fee
        uint256 managementFee = _amount * MANAGEMENT_FEE_BPS / 10000;
        uint256 netAmount = _amount - managementFee;
        
        // Calculate per-share amount
        uint256 perShareAmount = netAmount * 1e18 / totalSupply();
        
        // Record distribution
        YieldDistribution storage distribution = yieldDistributions[yieldDistributionCount];
        distribution.totalAmount = netAmount;
        distribution.distributionDate = block.timestamp;
        distribution.perShareAmount = perShareAmount;
        distribution.claimedAmount = 0;
        distribution.source = _source;
        
        yieldDistributionCount++;
        
        // Transfer management fee to owner
        if (managementFee > 0) {
            payable(owner()).transfer(managementFee);
        }
        
        emit YieldDistributed(yieldDistributionCount - 1, netAmount);
    }
    
    /**
     * @dev Claim yield for investor
     */
    function claimYield() public nonReentrant {
        InvestorInfo storage investor = investors[msg.sender];
        require(investor.sharesOwned > 0, "No shares owned");
        
        uint256 totalClaimable = 0;
        
        // Calculate claimable yield from all distributions since last claim
        for (uint256 i = 0; i < yieldDistributionCount; i++) {
            YieldDistribution storage distribution = yieldDistributions[i];
            
            if (distribution.distributionDate > investor.lastYieldClaim) {
                uint256 shareAtDistribution = balanceOf(msg.sender);
                uint256 claimableFromDistribution = shareAtDistribution
                    * distribution.perShareAmount / 1e18;
                totalClaimable = totalClaimable + claimableFromDistribution;
            }
        }
        
        require(totalClaimable > 0, "No yield to claim");
        
        // Update investor records
        investor.lastYieldClaim = block.timestamp;
        investor.totalYieldClaimed = investor.totalYieldClaimed + totalClaimable;
        
        // Transfer yield
        payable(msg.sender).transfer(totalClaimable);
        
        emit YieldClaimed(msg.sender, totalClaimable);
    }
    
    /**
     * @dev Withdraw investment (subject to lockup)
     */
    function withdraw(uint256 _shares) public nonReentrant {
        require(_shares > 0, "Shares must be positive");
        require(balanceOf(msg.sender) >= _shares, "Insufficient shares");
        
        InvestorInfo storage investor = investors[msg.sender];
        
        // Check lockup period
        require(
            block.timestamp >= poolCreationDate + lockupPeriod ||
            poolStatus == PoolStatus.Liquidated,
            "Investment still locked"
        );
        
        // Calculate withdrawal amount based on NAV
        uint256 nav = getNetAssetValue();
        uint256 withdrawalAmount = _shares * nav / totalSupply();
        
        // Update investor info
        investor.sharesOwned = investor.sharesOwned - _shares;
        
        // Burn shares
        _burn(msg.sender, _shares);
        
        // Update pool value
        totalPoolValue = totalPoolValue - withdrawalAmount;
        
        // Transfer funds
        payable(msg.sender).transfer(withdrawalAmount);
        
        emit InvestmentWithdrawn(msg.sender, withdrawalAmount, _shares);
    }
    
    /**
     * @dev Complete KYC for investor
     */
    function completeKYC(address _investor, string memory _jurisdiction) 
        public 
        onlyOwner 
    {
        investors[_investor].kycCompleted = true;
        investors[_investor].jurisdiction = _jurisdiction;
    }
    
    /**
     * @dev Add accredited investor
     */
    function addAccreditedInvestor(address _investor) public onlyOwner {
        accreditedInvestors[_investor] = true;
    }
    
    /**
     * @dev Get Net Asset Value (NAV) of the pool
     */
    function getNetAssetValue() public view returns (uint256) {
        if (totalSupply() == 0) return 0;
        
        uint256 totalAssetValue = 0;
        
        // Sum up all property values
        for (uint256 i = 0; i < properties.length; i++) {
            totalAssetValue = totalAssetValue + properties[i].value;
        }
        
        // Add cash balance
        totalAssetValue = totalAssetValue + address(this).balance;
        
        return totalAssetValue;
    }
    
    /**
     * @dev Get pool statistics
     */
    function getPoolStats() public view returns (
        uint256 nav,
        uint256 totalProperties,
        uint256 totalInvestors,
        uint256 averageYield,
        uint256 totalYieldDistributed
    ) {
        nav = getNetAssetValue();
        totalProperties = properties.length;
        totalInvestors = totalSupply() > 0 ? 1 : 0; // Simplified
        
        // Calculate average yield
        if (properties.length > 0) {
            uint256 totalYield = 0;
            for (uint256 i = 0; i < properties.length; i++) {
                totalYield = totalYield + properties[i].expectedYield;
            }
            averageYield = totalYield / properties.length;
        }
        
        // Calculate total yield distributed
        for (uint256 i = 0; i < yieldDistributionCount; i++) {
            totalYieldDistributed = totalYieldDistributed + (
                yieldDistributions[i].totalAmount
            );
        }
    }
    
    /**
     * @dev Get claimable yield for investor
     */
    function getClaimableYield(address _investor) public view returns (uint256) {
        InvestorInfo storage investor = investors[_investor];
        if (investor.sharesOwned == 0) return 0;
        
        uint256 totalClaimable = 0;
        
        for (uint256 i = 0; i < yieldDistributionCount; i++) {
            YieldDistribution storage distribution = yieldDistributions[i];
            
            if (distribution.distributionDate > investor.lastYieldClaim) {
                uint256 shareAtDistribution = balanceOf(_investor);
                uint256 claimableFromDistribution = shareAtDistribution
                    * distribution.perShareAmount / 1e18;
                totalClaimable = totalClaimable + claimableFromDistribution;
            }
        }
        
        return totalClaimable;
    }
    
    /**
     * @dev Close pool (stop new investments)
     */
    function closePool() public onlyOwner {
        poolStatus = PoolStatus.Closed;
        emit PoolStatusChanged(PoolStatus.Closed);
    }
    
    /**
     * @dev Liquidate pool
     */
    function liquidatePool() public onlyOwner {
        poolStatus = PoolStatus.Liquidated;
        emit PoolStatusChanged(PoolStatus.Liquidated);
    }
    
    /**
     * @dev Emergency pause
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
