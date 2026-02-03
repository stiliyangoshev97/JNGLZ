// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @author JNGLZ.FUN
 * @notice Decentralized prediction market with bonding curve pricing and Street Consensus resolution
 * @dev Uses linear constant sum bonding curve: P(YES) + P(NO) = UNIT_PRICE (0.01 BNB)
 *      Virtual liquidity is configurable per market via Heat Levels
 *      Street Consensus: Bettors vote on outcomes, weighted by share ownership
 *      3-of-3 MultiSig for all governance actions
 * @custom:version 3.8.3 - TieFinalized event for subgraph sync
 */
contract PredictionMarket is ReentrancyGuard {
    // ============ Constants ============

    /// @notice Fixed unit price for shares (P_YES + P_NO always equals this)
    uint256 public constant UNIT_PRICE = 0.01 ether;

    /// @notice Maximum platform fee (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Maximum creator fee (2%)
    uint256 public constant MAX_CREATOR_FEE_BPS = 200;

    /// @notice Maximum resolution fee (1%)
    uint256 public constant MAX_RESOLUTION_FEE_BPS = 100;

    /// @notice Maximum proposer reward (2% of pool)
    uint256 public constant MAX_PROPOSER_REWARD_BPS = 200;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice MultiSig action expiry time
    uint256 public constant ACTION_EXPIRY = 1 hours;

    /// @notice Minimum bet bounds
    uint256 public constant MIN_BET_LOWER = 0.001 ether;
    uint256 public constant MIN_BET_UPPER = 0.1 ether;

    /// @notice Minimum bond floor bounds
    uint256 public constant MIN_BOND_FLOOR_LOWER = 0.005 ether;
    uint256 public constant MIN_BOND_FLOOR_UPPER = 0.1 ether;

    /// @notice Dynamic bond BPS bounds (0.5% to 5%)
    uint256 public constant DYNAMIC_BOND_BPS_LOWER = 50;
    uint256 public constant DYNAMIC_BOND_BPS_UPPER = 500;

    /// @notice Bond winner share bounds (20% to 80%)
    uint256 public constant BOND_WINNER_SHARE_LOWER = 2000;
    uint256 public constant BOND_WINNER_SHARE_UPPER = 8000;

    /// @notice Emergency refund delay after expiry (24 hours)
    uint256 public constant EMERGENCY_REFUND_DELAY = 24 hours;

    /// @notice Resolution cutoff buffer before emergency refund (2 hours)
    /// @dev Only PROPOSALS are blocked when less than 2 hours remain before emergency refund
    ///      Disputes are allowed anytime within their 30-min window (v3.6.1 fix)
    ///      This prevents race conditions while ensuring legitimate disputes aren't blocked
    ///      Effective proposal window: 0-22 hours after expiry
    uint256 public constant RESOLUTION_CUTOFF_BUFFER = 2 hours;

    /// @notice Maximum market creation fee (0.1 BNB)
    uint256 public constant MAX_MARKET_CREATION_FEE = 0.1 ether;

    /// @notice Heat level bounds for governance (1 to 15000 base units * 1e18)
    /// @dev Increased in v3.5.0 to support CORE tier (10000e18)
    uint256 public constant MIN_HEAT_LEVEL = 1 * 1e18;
    uint256 public constant MAX_HEAT_LEVEL = 15000 * 1e18;

    // ============ Street Consensus Constants ============

    /// @notice Creator priority window - only creator can propose (10 minutes)
    uint256 public constant CREATOR_PRIORITY_WINDOW = 10 minutes;

    /// @notice Dispute window - time to dispute a proposal (30 minutes)
    uint256 public constant DISPUTE_WINDOW = 30 minutes;

    /// @notice Voting window - time for voting after dispute (1 hour)
    uint256 public constant VOTING_WINDOW = 1 hours;

    // ============ Enums ============

    enum MarketStatus {
        Active, // Trading open
        Expired, // Past expiry, awaiting proposal
        Proposed, // Outcome proposed, in dispute window
        Disputed, // Disputed, voting in progress
        Resolved // Final outcome set
    }

    /// @notice Heat levels for market volatility (v3.5.0: 5 tiers)
    /// @dev Virtual liquidity values increased 10x for better price stability
    enum HeatLevel {
        CRACK, // ☢️ Degen Flash - 50 virtual liquidity - high volatility
        HIGH, // 🔥 Street Fight - 200 virtual liquidity - balanced (DEFAULT)
        PRO, // 🧊 Whale Pond - 500 virtual liquidity - low slippage
        APEX, // 🏛️ Institution - 2000 virtual liquidity - professional
        CORE // 🌌 Deep Space - 10000 virtual liquidity - maximum depth
    }

    // v3.8.1: Fee types for combined proposeSetFee function
    enum FeeType {
        Platform, // Platform fee (max 5%)
        Creator, // Creator fee (max 2%)
        Resolution, // Resolution fee (max 1%)
        MarketCreation // Market creation fee (max 0.1 BNB)
    }

    enum ActionType {
        SetFee, // v3.8.1: Combined fee setting (Platform, Creator, Resolution, MarketCreation)
        SetMinBet,
        SetTreasury,
        Pause,
        Unpause,
        SetMinBondFloor,
        SetDynamicBondBps,
        SetBondWinnerShare,
        SetHeatLevel, // v3.8.1: Combined heat level setting (CRACK, HIGH, PRO, APEX, CORE)
        SetProposerReward, // v3.3.0: Set proposer reward percentage
        ReplaceSigner // v3.4.1: Emergency signer replacement (2-of-3)
    }

    // ============ Structs ============

    struct Market {
        string question;
        string evidenceLink;
        string resolutionRules;
        string imageUrl; // Market thumbnail/banner image (IPFS/HTTP URL)
        address creator;
        uint256 expiryTimestamp;
        uint256 yesSupply; // Total YES shares minted
        uint256 noSupply; // Total NO shares minted
        uint256 poolBalance; // Total BNB in pool
        uint256 virtualLiquidity; // NEW: Per-market virtual liquidity (set at creation, immutable)
        HeatLevel heatLevel; // NEW: Heat level enum for display
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        // Street Consensus fields
        address proposer;
        bool proposedOutcome;
        uint256 proposalTime;
        uint256 proposalBond;
        address disputer;
        uint256 disputeTime;
        uint256 disputeBond;
        uint256 yesVotes; // Total vote weight for YES
        uint256 noVotes; // Total vote weight for NO
        uint256 juryFeesPool; // v3.7.0: Total jury fees pool for Pull Pattern claiming
    }

    struct PendingAction {
        ActionType actionType;
        bytes data;
        uint256 confirmations;
        uint256 createdAt;
        bool executed;
        mapping(address => bool) hasConfirmed;
    }

    struct Position {
        uint256 yesShares;
        uint256 noShares;
        bool claimed;
        bool emergencyRefunded;
        bool hasVoted;
        bool votedOutcome;
        bool juryFeesClaimed; // v3.7.0: Track if jury fees have been claimed
    }

    // ============ State Variables ============

    // MultiSig
    address[3] public signers;
    uint256 public actionNonce;
    mapping(uint256 => PendingAction) public pendingActions;

    // Configurable parameters
    uint256 public platformFeeBps = 100; // 1% default
    uint256 public creatorFeeBps = 50; // 0.5% default
    uint256 public resolutionFeeBps = 30; // 0.3% default
    uint256 public minBet = 0.005 ether;
    uint256 public minBondFloor = 0.005 ether;
    uint256 public dynamicBondBps = 100; // 1% of pool
    uint256 public bondWinnerShareBps = 5000; // 50% to winner
    uint256 public proposerRewardBps = 50; // 0.5% of pool to proposer (v3.3.0)
    address public treasury;

    // Market creation fee (defaults to 0 = free market creation)
    uint256 public marketCreationFee = 0;

    // Heat Level virtual liquidity settings (configurable by MultiSig, affects NEW markets only)
    // v3.5.0: Increased 10x for better price stability
    uint256 public heatLevelCrack = 50 * 1e18; // ☢️ CRACK: High volatility (was 5)
    uint256 public heatLevelHigh = 200 * 1e18; // 🔥 HIGH: Balanced (was 20)
    uint256 public heatLevelPro = 500 * 1e18; // 🧊 PRO: Low slippage (was 50)
    uint256 public heatLevelApex = 2000 * 1e18; // 🏛️ APEX: Institution (NEW)
    uint256 public heatLevelCore = 10000 * 1e18; // 🌌 CORE: Deep Space (NEW)

    // Pause state
    bool public paused;

    // Markets
    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;

    // ============ Pull Pattern State (v3.4.0) ============

    /// @notice Pending withdrawals for bonds and jury fees (Pull Pattern)
    mapping(address => uint256) public pendingWithdrawals;

    /// @notice Pending creator fees from trades (Pull Pattern)
    mapping(address => uint256) public pendingCreatorFees;

    /// @notice Total pending withdrawals across all users (v3.4.1 - for sweep protection)
    uint256 public totalPendingWithdrawals;

    /// @notice Total pending creator fees across all users (v3.4.1 - for sweep protection)
    uint256 public totalPendingCreatorFees;

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint256 expiryTimestamp,
        HeatLevel heatLevel,
        uint256 virtualLiquidity
    );

    event Trade(
        uint256 indexed marketId,
        address indexed trader,
        bool isYes,
        bool isBuy,
        uint256 shares,
        uint256 bnbAmount
    );

    event OutcomeProposed(
        uint256 indexed marketId,
        address indexed proposer,
        bool outcome,
        uint256 bond
    );

    event ProposalDisputed(
        uint256 indexed marketId,
        address indexed disputer,
        uint256 bond
    );

    event VoteCast(
        uint256 indexed marketId,
        address indexed voter,
        bool outcome,
        uint256 weight
    );

    event MarketResolved(
        uint256 indexed marketId,
        bool outcome,
        bool wasDisputed
    );

    event MarketResolutionFailed(uint256 indexed marketId, string reason);

    event TieFinalized(uint256 indexed marketId);

    event Claimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event BondDistributed(
        uint256 indexed marketId,
        address indexed winner,
        uint256 winnerAmount,
        uint256 voterPoolAmount
    );

    event ProposerRewardPaid(
        uint256 indexed marketId,
        address indexed proposer,
        uint256 amount
    );

    event EmergencyRefunded(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event ActionProposed(
        uint256 indexed actionId,
        ActionType actionType,
        address indexed proposer
    );

    event ActionConfirmed(uint256 indexed actionId, address indexed confirmer);

    event ActionExecuted(uint256 indexed actionId, ActionType actionType);

    event Paused(address indexed by);
    event Unpaused(address indexed by);

    event SignerReplaced(
        address indexed oldSigner,
        address indexed newSigner,
        uint256 indexed actionId
    );

    // ============ Pull Pattern Events (v3.4.0) ============

    event WithdrawalCredited(
        address indexed user,
        uint256 amount,
        string reason
    );

    event WithdrawalClaimed(address indexed user, uint256 amount);

    event CreatorFeesCredited(
        address indexed creator,
        uint256 indexed marketId,
        uint256 amount
    );

    event CreatorFeesClaimed(address indexed creator, uint256 amount);

    // ============ v3.7.0 Events (Jury Fees Pull Pattern) ============

    event JuryFeesPoolCreated(uint256 indexed marketId, uint256 amount);

    event JuryFeesClaimed(
        uint256 indexed marketId,
        address indexed voter,
        uint256 amount
    );

    // ============ Errors ============

    error NotSigner();
    error InvalidAddress();
    error InvalidFee();
    error InvalidMinBet();
    error InvalidMinBondFloor();
    error InvalidDynamicBondBps();
    error InvalidBondWinnerShare();
    error InvalidMarketCreationFee();
    error InvalidProposerReward();
    error ActionExpired();
    error ActionAlreadyExecuted();
    error AlreadyConfirmed();
    error NotEnoughConfirmations();
    error ContractPaused();
    error ContractNotPaused();
    error MarketNotActive();
    error MarketNotExpired();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error BelowMinBet();
    error SlippageExceeded();
    error InsufficientShares();
    error NothingToClaim();
    error AlreadyClaimed();
    error InvalidExpiryTimestamp();
    error EmptyQuestion();
    error TransferFailed();
    error InsufficientPoolBalance();
    error EmergencyRefundTooEarly();
    error NoPosition();
    error AlreadyEmergencyRefunded();
    // Street Consensus errors
    error CreatorPriorityActive();
    error AlreadyProposed();
    error NotProposed();
    error AlreadyDisputed();
    error DisputeWindowExpired();
    error VotingNotActive();
    error AlreadyVoted();
    error VotingNotEnded();
    error NoSharesForVoting();
    error InsufficientBond();
    error MarketStuck();
    error InsufficientCreationFee();
    // v3.4.0 errors
    error NoTradesToResolve();
    error NothingToWithdraw();
    // v3.4.1 errors
    error InvalidSignerReplacement();
    error SignerNotFound();
    // v3.6.0 errors (emergency refund vulnerability fix)
    error ProposalWindowClosed();
    error DisputeWindowClosed();
    // v3.6.2 errors (one-sided market + emergency refund bypass fix)
    error OneSidedMarket();
    error ResolutionInProgress();
    // v3.7.0 errors (jury fees Pull Pattern)
    error DidNotVote();
    error VotedForLosingOutcome();
    error JuryFeesAlreadyClaimed();
    error NoJuryFeesPool();

    // ============ Modifiers ============

    modifier onlySigner() {
        if (!_isSigner(msg.sender)) revert NotSigner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier whenPaused() {
        if (!paused) revert ContractNotPaused();
        _;
    }

    // ============ Constructor ============

    constructor(address[3] memory _signers, address _treasury) {
        for (uint256 i = 0; i < 3; i++) {
            if (_signers[i] == address(0)) revert InvalidAddress();
            // Check for duplicate signers
            for (uint256 j = 0; j < i; j++) {
                if (_signers[i] == _signers[j]) revert InvalidAddress();
            }
            signers[i] = _signers[i];
        }

        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
    }

    // ============ Market Creation ============

    /**
     * @notice Create a new prediction market
     * @param question The prediction question
     * @param evidenceLink URL to source of truth for resolution (can be empty for degen markets)
     * @param resolutionRules Clear rules for how to resolve
     * @param imageUrl URL to market image/thumbnail (IPFS or HTTP, can be empty)
     * @param expiryTimestamp When trading ends
     * @param heatLevel The heat level for market volatility
     * @dev Requires msg.value >= marketCreationFee (defaults to 0 = free)
     */
    function createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
        uint256 expiryTimestamp,
        HeatLevel heatLevel
    ) external payable nonReentrant whenNotPaused returns (uint256 marketId) {
        if (msg.value < marketCreationFee) revert InsufficientCreationFee();

        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            imageUrl,
            expiryTimestamp,
            heatLevel
        );

        // Send creation fee to treasury
        if (msg.value > 0) {
            (bool success, ) = treasury.call{value: msg.value}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @notice Create a new prediction market AND place the first bet atomically
     * @dev This guarantees the creator is the first buyer - impossible to front-run
     *      msg.value must cover both marketCreationFee + minBet
     */
    function createMarketAndBuy(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
        uint256 expiryTimestamp,
        HeatLevel heatLevel,
        bool buyYesSide,
        uint256 minSharesOut
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 marketId, uint256 sharesOut)
    {
        // Check creation fee and calculate bet amount
        if (msg.value < marketCreationFee) revert InsufficientCreationFee();
        uint256 betAmount = msg.value - marketCreationFee;
        if (betAmount < minBet) revert BelowMinBet();

        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            imageUrl,
            expiryTimestamp,
            heatLevel
        );

        Market storage market = markets[marketId];

        // Calculate both platform fee AND creator fee (Bug #1 fix: was missing creator fee)
        uint256 platformFee = (betAmount * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (betAmount * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        uint256 amountAfterFee = betAmount - totalFee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            buyYesSide,
            market.virtualLiquidity
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        if (buyYesSide) {
            market.yesSupply += sharesOut;
            positions[marketId][msg.sender].yesShares += sharesOut;
        } else {
            market.noSupply += sharesOut;
            positions[marketId][msg.sender].noShares += sharesOut;
        }
        market.poolBalance += amountAfterFee;

        // Send creation fee + platform fee to treasury (Bug #1 fix: renamed from 'fee' to 'platformFee')
        uint256 treasuryAmount = marketCreationFee + platformFee;
        if (treasuryAmount > 0) {
            (bool success, ) = treasury.call{value: treasuryAmount}("");
            if (!success) revert TransferFailed();
        }

        // Creator fee: Pull pattern (Bug #1 fix: was missing entirely)
        // Note: In createMarketAndBuy, the creator IS msg.sender, so they pay fee to themselves
        // This is consistent with regular buyYes/buyNo behavior
        if (creatorFee > 0) {
            pendingCreatorFees[market.creator] += creatorFee;
            totalPendingCreatorFees += creatorFee;
            emit CreatorFeesCredited(market.creator, marketId, creatorFee);
        }

        // v3.8.2: Emit net BNB (after fees) for consistency with sell events
        emit Trade(
            marketId,
            msg.sender,
            buyYesSide,
            true,
            sharesOut,
            amountAfterFee
        );
    }

    function _createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
        uint256 expiryTimestamp,
        HeatLevel heatLevel
    ) internal returns (uint256 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        // evidenceLink can be empty for degen markets
        // imageUrl can be empty (optional)
        if (expiryTimestamp <= block.timestamp) revert InvalidExpiryTimestamp();

        marketId = marketCount++;

        Market storage market = markets[marketId];
        market.question = question;
        market.evidenceLink = evidenceLink;
        market.resolutionRules = resolutionRules;
        market.imageUrl = imageUrl;
        market.creator = msg.sender;
        market.expiryTimestamp = expiryTimestamp;
        market.heatLevel = heatLevel;

        // Set virtual liquidity based on heat level (v3.5.0: 5 tiers)
        if (heatLevel == HeatLevel.CRACK) {
            market.virtualLiquidity = heatLevelCrack;
        } else if (heatLevel == HeatLevel.HIGH) {
            market.virtualLiquidity = heatLevelHigh;
        } else if (heatLevel == HeatLevel.PRO) {
            market.virtualLiquidity = heatLevelPro;
        } else if (heatLevel == HeatLevel.APEX) {
            market.virtualLiquidity = heatLevelApex;
        } else if (heatLevel == HeatLevel.CORE) {
            market.virtualLiquidity = heatLevelCore;
        }

        emit MarketCreated(
            marketId,
            msg.sender,
            question,
            expiryTimestamp,
            heatLevel,
            market.virtualLiquidity
        );
    }

    // ============ Trading Functions ============

    /**
     * @notice Buy YES shares
     */
    function buyYes(
        uint256 marketId,
        uint256 minSharesOut
    ) external payable nonReentrant whenNotPaused returns (uint256 sharesOut) {
        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        uint256 platformFee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (msg.value * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        uint256 amountAfterFee = msg.value - totalFee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            true,
            market.virtualLiquidity
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        market.yesSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].yesShares += sharesOut;

        // Platform fee: Push to treasury (we control it)
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Creator fee: Pull pattern (v3.4.0) - credit to pending, creator withdraws later
        if (creatorFee > 0) {
            pendingCreatorFees[market.creator] += creatorFee;
            totalPendingCreatorFees += creatorFee;
            emit CreatorFeesCredited(market.creator, marketId, creatorFee);
        }

        // v3.8.2: Emit net BNB (after fees) for consistency with sell events
        emit Trade(marketId, msg.sender, true, true, sharesOut, amountAfterFee);
    }

    /**
     * @notice Buy NO shares
     */
    function buyNo(
        uint256 marketId,
        uint256 minSharesOut
    ) external payable nonReentrant whenNotPaused returns (uint256 sharesOut) {
        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        uint256 platformFee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (msg.value * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        uint256 amountAfterFee = msg.value - totalFee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            false,
            market.virtualLiquidity
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        market.noSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].noShares += sharesOut;

        // Platform fee: Push to treasury (we control it)
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Creator fee: Pull pattern (v3.4.0) - credit to pending, creator withdraws later
        if (creatorFee > 0) {
            pendingCreatorFees[market.creator] += creatorFee;
            totalPendingCreatorFees += creatorFee;
            emit CreatorFeesCredited(market.creator, marketId, creatorFee);
        }

        // v3.8.2: Emit net BNB (after fees) for consistency with sell events
        emit Trade(
            marketId,
            msg.sender,
            false,
            true,
            sharesOut,
            amountAfterFee
        );
    }

    /**
     * @notice Sell YES shares
     */
    function sellYes(
        uint256 marketId,
        uint256 shares,
        uint256 minBnbOut
    ) external nonReentrant whenNotPaused returns (uint256 bnbOut) {
        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        Position storage position = positions[marketId][msg.sender];
        if (position.yesShares < shares) revert InsufficientShares();

        uint256 grossBnbOut = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            shares,
            true,
            market.virtualLiquidity
        );

        if (grossBnbOut > market.poolBalance) revert InsufficientPoolBalance();

        uint256 platformFee = (grossBnbOut * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (grossBnbOut * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        bnbOut = grossBnbOut - totalFee;

        if (bnbOut < minBnbOut) revert SlippageExceeded();

        market.yesSupply -= shares;
        market.poolBalance -= grossBnbOut;
        position.yesShares -= shares;

        // Platform fee: Push to treasury (we control it)
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Creator fee: Pull pattern (v3.4.0) - credit to pending, creator withdraws later
        if (creatorFee > 0) {
            pendingCreatorFees[market.creator] += creatorFee;
            totalPendingCreatorFees += creatorFee;
            emit CreatorFeesCredited(market.creator, marketId, creatorFee);
        }

        (bool successTransfer, ) = msg.sender.call{value: bnbOut}("");
        if (!successTransfer) revert TransferFailed();

        emit Trade(marketId, msg.sender, true, false, shares, bnbOut);
    }

    /**
     * @notice Sell NO shares
     */
    function sellNo(
        uint256 marketId,
        uint256 shares,
        uint256 minBnbOut
    ) external nonReentrant whenNotPaused returns (uint256 bnbOut) {
        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        Position storage position = positions[marketId][msg.sender];
        if (position.noShares < shares) revert InsufficientShares();

        uint256 grossBnbOut = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            shares,
            false,
            market.virtualLiquidity
        );

        if (grossBnbOut > market.poolBalance) revert InsufficientPoolBalance();

        uint256 platformFee = (grossBnbOut * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (grossBnbOut * creatorFeeBps) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        bnbOut = grossBnbOut - totalFee;

        if (bnbOut < minBnbOut) revert SlippageExceeded();

        market.noSupply -= shares;
        market.poolBalance -= grossBnbOut;
        position.noShares -= shares;

        // Platform fee: Push to treasury (we control it)
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Creator fee: Pull pattern (v3.4.0) - credit to pending, creator withdraws later
        if (creatorFee > 0) {
            pendingCreatorFees[market.creator] += creatorFee;
            totalPendingCreatorFees += creatorFee;
            emit CreatorFeesCredited(market.creator, marketId, creatorFee);
        }

        (bool successTransfer, ) = msg.sender.call{value: bnbOut}("");
        if (!successTransfer) revert TransferFailed();

        emit Trade(marketId, msg.sender, false, false, shares, bnbOut);
    }

    // ============ Street Consensus Resolution ============

    /**
     * @notice Propose an outcome for an expired market
     * @param marketId The market to propose outcome for
     * @param outcome The proposed outcome (true = YES wins, false = NO wins)
     * @dev Requires bond payment. Creator has priority in first 10 minutes.
     */
    function proposeOutcome(
        uint256 marketId,
        bool outcome
    ) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status == MarketStatus.Active) revert MarketNotExpired();
        if (status != MarketStatus.Expired) revert AlreadyProposed();

        // v3.6.2 FIX: Block proposals on one-sided markets (either side has 0 holders)
        // One-sided markets have no losers to pay winners - they should go to emergency refund
        // This replaces the v3.4.0 check that only blocked when BOTH sides were zero
        if (market.yesSupply == 0 || market.noSupply == 0) {
            revert OneSidedMarket();
        }

        // v3.6.0 FIX: Block proposals when too close to emergency refund time
        // Prevents race condition where proposal starts but can't complete before
        // emergency refunds become available (creating conflicting resolution paths)
        uint256 emergencyRefundTime = market.expiryTimestamp +
            EMERGENCY_REFUND_DELAY;
        if (block.timestamp >= emergencyRefundTime - RESOLUTION_CUTOFF_BUFFER) {
            revert ProposalWindowClosed();
        }

        // Creator priority: first 10 minutes only creator can propose
        if (
            block.timestamp < market.expiryTimestamp + CREATOR_PRIORITY_WINDOW
        ) {
            if (msg.sender != market.creator) revert CreatorPriorityActive();
        }

        // Calculate required bond
        uint256 requiredBond = getRequiredBond(marketId);

        // Take 0.3% fee from bond
        uint256 fee = (msg.value * resolutionFeeBps) / BPS_DENOMINATOR;
        uint256 bondAfterFee = msg.value - fee;

        if (bondAfterFee < requiredBond) revert InsufficientBond();

        // Store proposal
        market.proposer = msg.sender;
        market.proposedOutcome = outcome;
        market.proposalTime = block.timestamp;
        market.proposalBond = bondAfterFee;

        // Send fee to treasury
        if (fee > 0) {
            (bool success, ) = treasury.call{value: fee}("");
            if (!success) revert TransferFailed();
        }

        emit OutcomeProposed(marketId, msg.sender, outcome, bondAfterFee);
    }

    /**
     * @notice Dispute a proposed outcome
     * @param marketId The market with the proposal to dispute
     * @dev Requires 2x the proposal bond. Triggers voting period.
     *      v3.6.1: Removed cutoff check - disputes are always allowed within their 30-min window
     *      The proposal cutoff at 22h ensures resolution always completes before 24h refund
     *      (proposal at 21:59 + 30min dispute + 1h voting = 23:29, well before 24h)
     */
    function dispute(
        uint256 marketId
    ) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status != MarketStatus.Proposed) revert NotProposed();

        // Check we're still in dispute window (30 min after proposal)
        // Note: No cutoff check needed here - the proposal cutoff guarantees safety
        // If proposal was made before 22h cutoff, dispute window ends max at 22.5h
        // Voting then ends at 23.5h max, well before 24h emergency refund
        if (block.timestamp > market.proposalTime + DISPUTE_WINDOW) {
            revert DisputeWindowExpired();
        }

        // Dispute bond is 2x proposal bond
        uint256 requiredDisputeBond = market.proposalBond * 2;

        // Take 0.3% fee from bond
        uint256 fee = (msg.value * resolutionFeeBps) / BPS_DENOMINATOR;
        uint256 bondAfterFee = msg.value - fee;

        if (bondAfterFee < requiredDisputeBond) revert InsufficientBond();

        // Store dispute
        market.disputer = msg.sender;
        market.disputeTime = block.timestamp;
        market.disputeBond = bondAfterFee;

        // Send fee to treasury
        if (fee > 0) {
            (bool success, ) = treasury.call{value: fee}("");
            if (!success) revert TransferFailed();
        }

        emit ProposalDisputed(marketId, msg.sender, bondAfterFee);
    }

    /**
     * @notice Cast a vote on a disputed market
     * @param marketId The market to vote on
     * @param outcome The outcome to vote for (true = YES, false = NO)
     * @dev Vote weight equals total shares owned. Free to vote.
     */
    function vote(uint256 marketId, bool outcome) external whenNotPaused {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status != MarketStatus.Disputed) revert VotingNotActive();

        // Check voting window hasn't expired
        if (block.timestamp > market.disputeTime + VOTING_WINDOW) {
            revert VotingNotActive();
        }

        Position storage position = positions[marketId][msg.sender];
        if (position.hasVoted) revert AlreadyVoted();

        // Vote weight = total shares owned
        uint256 voteWeight = position.yesShares + position.noShares;
        if (voteWeight == 0) revert NoSharesForVoting();

        // Record vote
        position.hasVoted = true;
        position.votedOutcome = outcome;

        if (outcome) {
            market.yesVotes += voteWeight;
        } else {
            market.noVotes += voteWeight;
        }

        emit VoteCast(marketId, msg.sender, outcome, voteWeight);
    }

    /**
     * @notice Finalize a market after voting ends or dispute window passes
     * @param marketId The market to finalize
     * @dev Can be called by anyone. Distributes bonds to winners.
     */
    function finalizeMarket(
        uint256 marketId
    ) external nonReentrant whenNotPaused {
        Market storage market = markets[marketId];
        MarketStatus status = _getMarketStatus(market);

        if (status == MarketStatus.Proposed) {
            // No dispute - proposal accepted after dispute window
            if (block.timestamp <= market.proposalTime + DISPUTE_WINDOW) {
                revert DisputeWindowExpired(); // Window not expired yet
            }

            // SAFETY CHECK: Ensure winning side has holders
            // If not, don't resolve - allow emergency refund instead
            uint256 winningSupply = market.proposedOutcome
                ? market.yesSupply
                : market.noSupply;
            if (winningSupply == 0) {
                // No winners possible - return bond via Pull Pattern (v3.4.1 fix)
                if (market.proposalBond > 0) {
                    uint256 bondAmount = market.proposalBond;
                    market.proposalBond = 0; // CEI: clear state before crediting
                    pendingWithdrawals[market.proposer] += bondAmount;
                    totalPendingWithdrawals += bondAmount;
                    emit WithdrawalCredited(
                        market.proposer,
                        bondAmount,
                        "proposer_bond_empty_side"
                    );
                }
                // v3.6.2 FIX: Clear proposer so emergency refund is not blocked
                market.proposer = address(0);
                // Don't resolve - market stays unresolved, emergency refund available after 24h
                emit MarketResolutionFailed(
                    marketId,
                    "No holders on winning side"
                );
                return;
            }

            // Resolve with proposed outcome
            market.resolved = true;
            market.outcome = market.proposedOutcome;

            // Calculate proposer reward (0.5% of pool)
            uint256 proposerReward = (market.poolBalance * proposerRewardBps) /
                BPS_DENOMINATOR;

            // Deduct reward from pool
            if (proposerReward > 0) {
                market.poolBalance -= proposerReward;
            }

            // Return bond + reward to proposer (Pull Pattern - credit to pendingWithdrawals)
            uint256 proposerPayout = market.proposalBond + proposerReward;
            market.proposalBond = 0; // CEI: clear bond before crediting
            pendingWithdrawals[market.proposer] += proposerPayout;
            totalPendingWithdrawals += proposerPayout;
            emit WithdrawalCredited(
                market.proposer,
                proposerPayout,
                "proposer_bond_reward"
            );

            if (proposerReward > 0) {
                emit ProposerRewardPaid(
                    marketId,
                    market.proposer,
                    proposerReward
                );
            }

            emit MarketResolved(marketId, market.outcome, false);
        } else if (status == MarketStatus.Disputed) {
            // Voting ended - determine winner
            if (block.timestamp <= market.disputeTime + VOTING_WINDOW) {
                revert VotingNotEnded();
            }

            // Check for tie (exact same votes = emergency refund scenario)
            if (market.yesVotes == market.noVotes) {
                // Tie: return all bonds and allow emergency refund
                _returnBondsOnTie(marketId, market);
                // Don't resolve - market stays stuck, emergency refund available
                return;
            }

            // Simple majority wins
            bool votedOutcome = market.yesVotes > market.noVotes;

            // SAFETY CHECK: Ensure winning side has holders
            // If not, don't resolve - allow emergency refund instead
            uint256 winningSupply = votedOutcome
                ? market.yesSupply
                : market.noSupply;
            if (winningSupply == 0) {
                // No winners possible - return bonds and allow emergency refund
                _returnBondsOnTie(marketId, market);
                emit MarketResolutionFailed(
                    marketId,
                    "No holders on winning side"
                );
                return;
            }

            market.resolved = true;
            market.outcome = votedOutcome;

            // Determine who won the dispute
            bool proposerWins = (market.proposedOutcome == votedOutcome);

            // Pay proposer reward if proposer wins (0.5% of pool)
            uint256 proposerReward = 0;
            if (proposerWins && proposerRewardBps > 0) {
                proposerReward =
                    (market.poolBalance * proposerRewardBps) /
                    BPS_DENOMINATOR;
                if (proposerReward > 0) {
                    market.poolBalance -= proposerReward;
                    // Reward paid in _distributeBonds along with bond return
                }
            }

            // Distribute bonds (+ proposer reward if applicable)
            _distributeBonds(marketId, market, proposerWins, proposerReward);

            emit MarketResolved(marketId, market.outcome, true);
        } else {
            revert MarketNotResolved();
        }
    }

    /**
     * @notice Internal function to return bonds when voting is a tie
     * @dev Uses Pull Pattern - credits to pendingWithdrawals instead of immediate transfers
     *      v3.6.2: Also clears proposer/disputer so emergency refund is not blocked
     * @param marketId The ID of the market (for event emission)
     * @param market The market storage reference
     */
    function _returnBondsOnTie(
        uint256 marketId,
        Market storage market
    ) internal {
        // Return proposer bond (Pull Pattern)
        if (market.proposalBond > 0) {
            uint256 proposerBondAmount = market.proposalBond;
            market.proposalBond = 0; // CEI: clear state before crediting
            pendingWithdrawals[market.proposer] += proposerBondAmount;
            totalPendingWithdrawals += proposerBondAmount;
            emit WithdrawalCredited(
                market.proposer,
                proposerBondAmount,
                "proposer_bond_tie"
            );
        }

        // Return disputer bond (Pull Pattern)
        if (market.disputeBond > 0) {
            uint256 disputerBondAmount = market.disputeBond;
            market.disputeBond = 0; // CEI: clear state before crediting
            pendingWithdrawals[market.disputer] += disputerBondAmount;
            totalPendingWithdrawals += disputerBondAmount;
            emit WithdrawalCredited(
                market.disputer,
                disputerBondAmount,
                "disputer_bond_tie"
            );
        }

        // v3.6.2 FIX: Clear proposer/disputer so emergency refund is not blocked
        market.proposer = address(0);
        market.disputer = address(0);

        // v3.8.3: Emit event so subgraph can update state
        emit TieFinalized(marketId);
    }

    /**
     * @notice Internal function to distribute bonds after voting
     * @dev 50% to winner (proposer or disputer), 50% to winning voters
     * @dev Uses Pull Pattern - credits to pendingWithdrawals instead of immediate transfers
     * @param proposerReward Additional reward from pool if proposer wins (v3.3.0)
     */
    function _distributeBonds(
        uint256 marketId,
        Market storage market,
        bool proposerWins,
        uint256 proposerReward
    ) internal {
        uint256 loserBond = proposerWins
            ? market.disputeBond
            : market.proposalBond;
        address winner = proposerWins ? market.proposer : market.disputer;
        uint256 winnerBond = proposerWins
            ? market.proposalBond
            : market.disputeBond;

        // Winner gets their bond back + 50% of loser's bond
        uint256 winnerShare = (loserBond * bondWinnerShareBps) /
            BPS_DENOMINATOR;
        uint256 voterPool = loserBond - winnerShare;

        // Clear bonds first (CEI compliance)
        market.proposalBond = 0;
        market.disputeBond = 0;

        // Credit winner (+ proposer reward if proposer wins) - Pull Pattern
        uint256 winnerPayout = winnerBond + winnerShare + proposerReward;
        pendingWithdrawals[winner] += winnerPayout;
        totalPendingWithdrawals += winnerPayout;
        emit WithdrawalCredited(winner, winnerPayout, "bond_winner");

        emit BondDistributed(marketId, winner, winnerPayout, voterPool);

        // Emit proposer reward event if applicable
        if (proposerReward > 0) {
            emit ProposerRewardPaid(marketId, market.proposer, proposerReward);
        }

        // Distribute voter pool to winning voters
        if (voterPool > 0) {
            _distributeJuryFees(marketId, market, voterPool);
        }
    }

    /**
     * @notice Internal function to store jury fees pool for later claiming
     * @dev v3.7.0: Converted from Push to Pull Pattern - stores pool, voters claim individually
     *      This fixes the gas griefing vulnerability where >4600 voters could block finalization
     */
    function _distributeJuryFees(
        uint256 marketId,
        Market storage market,
        uint256 voterPool
    ) internal {
        bool winningOutcome = market.outcome;
        uint256 totalWinningVotes = winningOutcome
            ? market.yesVotes
            : market.noVotes;

        if (totalWinningVotes == 0) {
            // No winning voters - send to treasury (Push is OK for treasury)
            (bool success, ) = treasury.call{value: voterPool}("");
            if (!success) revert TransferFailed();
            return;
        }

        // v3.7.0: Store pool for Pull Pattern claiming - O(1) instead of O(n)
        market.juryFeesPool = voterPool;
        emit JuryFeesPoolCreated(marketId, voterPool);
    }

    /**
     * @notice Claim jury fees from a disputed market (Pull Pattern)
     * @param marketId The market to claim jury fees from
     * @return amount The amount claimed
     * @dev v3.7.0: Each winning voter claims their proportional share individually
     *      This replaces the loop in _distributeJuryFees to prevent gas griefing
     */
    function claimJuryFees(
        uint256 marketId
    ) external nonReentrant returns (uint256 amount) {
        Market storage market = markets[marketId];

        // Must be resolved
        if (!market.resolved) revert MarketNotResolved();

        // Must have jury fees pool (only disputed markets have this)
        if (market.juryFeesPool == 0) revert NoJuryFeesPool();

        Position storage position = positions[marketId][msg.sender];

        // Must have voted
        if (!position.hasVoted) revert DidNotVote();

        // Must have voted for winning outcome
        if (position.votedOutcome != market.outcome)
            revert VotedForLosingOutcome();

        // Must not have already claimed
        if (position.juryFeesClaimed) revert JuryFeesAlreadyClaimed();

        // Calculate voter's share
        uint256 totalWinningVotes = market.outcome
            ? market.yesVotes
            : market.noVotes;
        uint256 voterWeight = position.yesShares + position.noShares;
        amount = (market.juryFeesPool * voterWeight) / totalWinningVotes;

        if (amount == 0) revert NothingToClaim();

        // CEI: Update state before transfer
        position.juryFeesClaimed = true;

        // Transfer to voter
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit JuryFeesClaimed(marketId, msg.sender, amount);
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The market to claim from
     * @dev Takes 0.3% resolution fee from payout
     */
    function claim(
        uint256 marketId
    ) external nonReentrant returns (uint256 payout) {
        Market storage market = markets[marketId];
        if (!market.resolved) revert MarketNotResolved();

        Position storage position = positions[marketId][msg.sender];
        if (position.claimed) revert AlreadyClaimed();

        // v3.6.0 FIX: Prevent double-spend vulnerability
        // Users who took emergency refund cannot also claim resolution payout
        // Without this check, a user could: 1) take emergency refund, 2) wait for resolution, 3) claim again
        // This would result in ~2x payout and drain the pool, leaving other winners unable to claim
        if (position.emergencyRefunded) revert AlreadyEmergencyRefunded();

        uint256 winningShares = market.outcome
            ? position.yesShares
            : position.noShares;
        if (winningShares == 0) revert NothingToClaim();

        // Calculate payout: proportional share of pool
        uint256 totalWinningShares = market.outcome
            ? market.yesSupply
            : market.noSupply;
        uint256 grossPayout = (winningShares * market.poolBalance) /
            totalWinningShares;

        // Take 0.3% resolution fee
        uint256 fee = (grossPayout * resolutionFeeBps) / BPS_DENOMINATOR;
        payout = grossPayout - fee;

        // Update state
        position.claimed = true;

        // v3.6.0: Reduce pool balance and winning supply for clean accounting
        // This ensures poolBalance reflects actual BNB remaining after claims
        // Must reduce BOTH to maintain correct payout ratio for remaining claimers
        market.poolBalance -= grossPayout;
        if (market.outcome) {
            market.yesSupply -= winningShares;
        } else {
            market.noSupply -= winningShares;
        }

        // Transfer fee to treasury
        if (fee > 0) {
            (bool feeSuccess, ) = treasury.call{value: fee}("");
            if (!feeSuccess) revert TransferFailed();
        }

        // Transfer payout
        (bool success, ) = msg.sender.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit Claimed(marketId, msg.sender, payout);
    }

    /**
     * @notice Emergency refund for stuck markets
     * @dev Available 24h after expiry if: no proposal, or voting resulted in tie
     *      v3.6.2: Blocked if a proposal exists (must finalize first), unless contract is paused
     */
    function emergencyRefund(
        uint256 marketId
    ) external nonReentrant returns (uint256 refund) {
        Market storage market = markets[marketId];

        // Check market has expired + 24 hours passed
        if (block.timestamp < market.expiryTimestamp + EMERGENCY_REFUND_DELAY) {
            revert EmergencyRefundTooEarly();
        }

        // Check market is not resolved
        if (market.resolved) revert MarketAlreadyResolved();

        // v3.6.2 FIX: Block emergency refund if a proposal exists and contract is not paused
        // This prevents losers from avoiding resolution by not calling finalizeMarket()
        // Exception: If contract is paused (emergency), allow refund as escape hatch
        if (!paused && market.proposer != address(0)) {
            revert ResolutionInProgress();
        }

        Position storage position = positions[marketId][msg.sender];
        if (position.emergencyRefunded) revert AlreadyEmergencyRefunded();

        uint256 userTotalShares = position.yesShares + position.noShares;
        if (userTotalShares == 0) revert NoPosition();

        // Calculate proportional refund
        uint256 totalShares = market.yesSupply + market.noSupply;
        refund = (userTotalShares * market.poolBalance) / totalShares;

        // Update state
        position.emergencyRefunded = true;

        // v3.6.0 FIX: Reduce pool balance and supplies to prevent insolvency
        // Without this, later refunders would calculate from wrong totals
        // (their share of a pool that no longer has enough funds)
        market.poolBalance -= refund;
        market.yesSupply -= position.yesShares;
        market.noSupply -= position.noShares;

        // Clear user's shares to prevent any future miscalculations
        position.yesShares = 0;
        position.noShares = 0;

        // Transfer refund
        (bool success, ) = msg.sender.call{value: refund}("");
        if (!success) revert TransferFailed();

        emit EmergencyRefunded(marketId, msg.sender, refund);
    }

    // ============ Pull Pattern Withdrawals (v3.4.0) ============

    /**
     * @notice Withdraw pending bonds, jury fees, and other credits
     * @dev Pull Pattern - users must call this to receive their funds
     * @return amount The amount withdrawn
     */
    function withdrawBond() external nonReentrant returns (uint256 amount) {
        amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // CEI: Clear state before transfer
        pendingWithdrawals[msg.sender] = 0;
        totalPendingWithdrawals -= amount;

        // Transfer to user
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit WithdrawalClaimed(msg.sender, amount);
    }

    /**
     * @notice Withdraw pending creator fees
     * @dev Pull Pattern - creators must call this to receive their fees
     * @return amount The amount withdrawn
     */
    function withdrawCreatorFees()
        external
        nonReentrant
        returns (uint256 amount)
    {
        amount = pendingCreatorFees[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        // CEI: Clear state before transfer
        pendingCreatorFees[msg.sender] = 0;
        totalPendingCreatorFees -= amount;

        // Transfer to creator
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit CreatorFeesClaimed(msg.sender, amount);
    }

    /**
     * @notice Get pending withdrawal balance for an address
     * @param account The address to check
     * @return The pending withdrawal amount
     */
    function getPendingWithdrawal(
        address account
    ) external view returns (uint256) {
        return pendingWithdrawals[account];
    }

    /**
     * @notice Get pending creator fees for an address
     * @param account The address to check
     * @return The pending creator fees amount
     */
    function getPendingCreatorFees(
        address account
    ) external view returns (uint256) {
        return pendingCreatorFees[account];
    }

    // ============ View Functions ============

    /**
     * @notice Get current YES price based on bonding curve
     */
    function getYesPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return
            _getYesPrice(
                market.yesSupply,
                market.noSupply,
                market.virtualLiquidity
            );
    }

    /**
     * @notice Get current NO price based on bonding curve
     */
    function getNoPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return
            _getNoPrice(
                market.yesSupply,
                market.noSupply,
                market.virtualLiquidity
            );
    }

    /**
     * @notice Preview how many shares you'd get for a given BNB amount
     */
    function previewBuy(
        uint256 marketId,
        uint256 bnbAmount,
        bool isYes
    ) external view returns (uint256 shares) {
        Market storage market = markets[marketId];
        uint256 totalFee = (bnbAmount * (platformFeeBps + creatorFeeBps)) /
            BPS_DENOMINATOR;
        return
            _calculateBuyShares(
                market.yesSupply,
                market.noSupply,
                bnbAmount - totalFee,
                isYes,
                market.virtualLiquidity
            );
    }

    /**
     * @notice Preview how much BNB you'd get for selling shares
     */
    function previewSell(
        uint256 marketId,
        uint256 shares,
        bool isYes
    ) external view returns (uint256 bnbOut) {
        Market storage market = markets[marketId];
        uint256 grossBnbOut = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            shares,
            isYes,
            market.virtualLiquidity
        );
        uint256 totalFee = (grossBnbOut * (platformFeeBps + creatorFeeBps)) /
            BPS_DENOMINATOR;
        return grossBnbOut - totalFee;
    }

    /**
     * @notice Calculate maximum shares sellable given current pool liquidity
     * @dev Uses binary search to find max shares where grossBnbOut <= poolBalance
     * @param marketId The market ID
     * @param userShares The user's total shares on this side
     * @param isYes Whether selling YES or NO shares
     * @return maxShares Maximum shares that can be sold without exceeding pool balance
     * @return bnbOut Net BNB the user would receive after fees
     */
    function getMaxSellableShares(
        uint256 marketId,
        uint256 userShares,
        bool isYes
    ) external view returns (uint256 maxShares, uint256 bnbOut) {
        Market storage market = markets[marketId];

        if (userShares == 0) {
            return (0, 0);
        }

        // Check if user can sell all shares
        uint256 fullSellGross = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            userShares,
            isYes,
            market.virtualLiquidity
        );

        if (fullSellGross <= market.poolBalance) {
            // Can sell everything
            uint256 totalFee = (fullSellGross *
                (platformFeeBps + creatorFeeBps)) / BPS_DENOMINATOR;
            return (userShares, fullSellGross - totalFee);
        }

        // Binary search to find max sellable
        uint256 low = 0;
        uint256 high = userShares;

        while (low < high) {
            uint256 mid = (low + high + 1) / 2;
            uint256 grossBnb = _calculateSellBnb(
                market.yesSupply,
                market.noSupply,
                mid,
                isYes,
                market.virtualLiquidity
            );

            if (grossBnb <= market.poolBalance) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        maxShares = low;

        if (maxShares > 0) {
            uint256 grossBnbOut = _calculateSellBnb(
                market.yesSupply,
                market.noSupply,
                maxShares,
                isYes,
                market.virtualLiquidity
            );
            uint256 totalFee = (grossBnbOut *
                (platformFeeBps + creatorFeeBps)) / BPS_DENOMINATOR;
            bnbOut = grossBnbOut - totalFee;
        }

        return (maxShares, bnbOut);
    }

    /**
     * @notice Get the current status of a market
     */
    function getMarketStatus(
        uint256 marketId
    ) external view returns (MarketStatus) {
        return _getMarketStatus(markets[marketId]);
    }

    /**
     * @notice Get a user's position in a market
     */
    function getPosition(
        uint256 marketId,
        address user
    )
        external
        view
        returns (
            uint256 yesShares,
            uint256 noShares,
            bool claimed,
            bool emergencyRefunded,
            bool hasVoted,
            bool votedOutcome
        )
    {
        Position storage pos = positions[marketId][user];
        return (
            pos.yesShares,
            pos.noShares,
            pos.claimed,
            pos.emergencyRefunded,
            pos.hasVoted,
            pos.votedOutcome
        );
    }

    /**
     * @notice Check if a market is eligible for emergency refund
     */
    function canEmergencyRefund(
        uint256 marketId
    ) external view returns (bool eligible, uint256 timeUntilEligible) {
        Market storage market = markets[marketId];

        if (market.resolved) {
            return (false, 0);
        }

        uint256 emergencyTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
        if (block.timestamp >= emergencyTime) {
            return (true, 0);
        }

        return (false, emergencyTime - block.timestamp);
    }

    /**
     * @notice Calculate the required bond for proposing an outcome
     * @dev Dynamic bond: max(MIN_BOND_FLOOR, poolBalance * 1%)
     */
    function getRequiredBond(
        uint256 marketId
    ) public view returns (uint256 requiredBond) {
        Market storage market = markets[marketId];
        uint256 dynamicBond = (market.poolBalance * dynamicBondBps) /
            BPS_DENOMINATOR;
        requiredBond = dynamicBond > minBondFloor ? dynamicBond : minBondFloor;
    }

    /**
     * @notice Calculate the required dispute bond (2x proposal bond)
     */
    function getRequiredDisputeBond(
        uint256 marketId
    ) external view returns (uint256) {
        Market storage market = markets[marketId];
        return market.proposalBond * 2;
    }

    /**
     * @notice Get proposal details for a market
     */
    function getProposal(
        uint256 marketId
    )
        external
        view
        returns (
            address proposer,
            bool proposedOutcome,
            uint256 proposalTime,
            uint256 proposalBond,
            uint256 disputeDeadline
        )
    {
        Market storage m = markets[marketId];
        return (
            m.proposer,
            m.proposedOutcome,
            m.proposalTime,
            m.proposalBond,
            m.proposalTime + DISPUTE_WINDOW
        );
    }

    /**
     * @notice Get dispute details for a market
     */
    function getDispute(
        uint256 marketId
    )
        external
        view
        returns (
            address disputer,
            uint256 disputeTime,
            uint256 disputeBond,
            uint256 votingDeadline,
            uint256 yesVotes,
            uint256 noVotes
        )
    {
        Market storage m = markets[marketId];
        return (
            m.disputer,
            m.disputeTime,
            m.disputeBond,
            m.disputeTime + VOTING_WINDOW,
            m.yesVotes,
            m.noVotes
        );
    }

    /**
     * @notice Get full market data
     */
    function getMarket(
        uint256 marketId
    )
        external
        view
        returns (
            string memory question,
            string memory evidenceLink,
            string memory resolutionRules,
            string memory imageUrl,
            address creator,
            uint256 expiryTimestamp,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            bool resolved,
            bool outcome
        )
    {
        Market storage m = markets[marketId];
        return (
            m.question,
            m.evidenceLink,
            m.resolutionRules,
            m.imageUrl,
            m.creator,
            m.expiryTimestamp,
            m.yesSupply,
            m.noSupply,
            m.poolBalance,
            m.resolved,
            m.outcome
        );
    }

    // ============ MultiSig Governance ============

    // -------- Propose Functions (v3.8.1: Consolidated for contract size) --------

    /**
     * @notice Propose to set a fee parameter
     * @param feeType The type of fee to set (Platform=0, Creator=1, Resolution=2, MarketCreation=3)
     * @param newValue The new fee value (BPS for Platform/Creator/Resolution, wei for MarketCreation)
     * @dev Platform: max 500 (5%), Creator: max 200 (2%), Resolution: max 100 (1%), MarketCreation: max 0.1 BNB
     */
    function proposeSetFee(
        FeeType feeType,
        uint256 newValue
    ) external onlySigner returns (uint256 actionId) {
        // Validate based on fee type
        if (feeType == FeeType.Platform) {
            if (newValue > MAX_FEE_BPS) revert InvalidFee();
        } else if (feeType == FeeType.Creator) {
            if (newValue > MAX_CREATOR_FEE_BPS) revert InvalidFee();
        } else if (feeType == FeeType.Resolution) {
            if (newValue > MAX_RESOLUTION_FEE_BPS) revert InvalidFee();
        } else if (feeType == FeeType.MarketCreation) {
            if (newValue > MAX_MARKET_CREATION_FEE)
                revert InvalidMarketCreationFee();
        }
        return _createAction(ActionType.SetFee, abi.encode(feeType, newValue));
    }

    /**
     * @notice Propose to set minimum bet amount
     * @param newMinBet New minimum bet (0.001 - 0.1 BNB)
     */
    function proposeSetMinBet(
        uint256 newMinBet
    ) external onlySigner returns (uint256 actionId) {
        if (newMinBet < MIN_BET_LOWER || newMinBet > MIN_BET_UPPER)
            revert InvalidMinBet();
        return _createAction(ActionType.SetMinBet, abi.encode(newMinBet));
    }

    /**
     * @notice Propose to set treasury address
     * @param newTreasury New treasury address
     */
    function proposeSetTreasury(
        address newTreasury
    ) external onlySigner returns (uint256 actionId) {
        if (newTreasury == address(0)) revert InvalidAddress();
        return _createAction(ActionType.SetTreasury, abi.encode(newTreasury));
    }

    /**
     * @notice Propose to pause the contract
     */
    function proposePause() external onlySigner returns (uint256 actionId) {
        return _createAction(ActionType.Pause, "");
    }

    /**
     * @notice Propose to unpause the contract
     */
    function proposeUnpause() external onlySigner returns (uint256 actionId) {
        return _createAction(ActionType.Unpause, "");
    }

    /**
     * @notice Propose to set creator fee
     * @param newCreatorFee New creator fee in basis points (max 200 = 2%)
     */

    /**
     * @notice Propose to set minimum bond floor
     * @param newMinBondFloor New minimum bond floor (0.005 - 0.1 BNB)
     */
    function proposeSetMinBondFloor(
        uint256 newMinBondFloor
    ) external onlySigner returns (uint256 actionId) {
        if (
            newMinBondFloor < MIN_BOND_FLOOR_LOWER ||
            newMinBondFloor > MIN_BOND_FLOOR_UPPER
        ) revert InvalidMinBondFloor();
        return
            _createAction(
                ActionType.SetMinBondFloor,
                abi.encode(newMinBondFloor)
            );
    }

    /**
     * @notice Propose to set dynamic bond percentage
     * @param newDynamicBondBps New dynamic bond in basis points (50-500 = 0.5%-5%)
     */
    function proposeSetDynamicBondBps(
        uint256 newDynamicBondBps
    ) external onlySigner returns (uint256 actionId) {
        if (
            newDynamicBondBps < DYNAMIC_BOND_BPS_LOWER ||
            newDynamicBondBps > DYNAMIC_BOND_BPS_UPPER
        ) revert InvalidDynamicBondBps();
        return
            _createAction(
                ActionType.SetDynamicBondBps,
                abi.encode(newDynamicBondBps)
            );
    }

    /**
     * @notice Propose to set bond winner share
     * @param newBondWinnerShare New bond winner share in basis points (2000-8000 = 20%-80%)
     */
    function proposeSetBondWinnerShare(
        uint256 newBondWinnerShare
    ) external onlySigner returns (uint256 actionId) {
        if (
            newBondWinnerShare < BOND_WINNER_SHARE_LOWER ||
            newBondWinnerShare > BOND_WINNER_SHARE_UPPER
        ) revert InvalidBondWinnerShare();
        return
            _createAction(
                ActionType.SetBondWinnerShare,
                abi.encode(newBondWinnerShare)
            );
    }

    /**
     * @notice Propose to set heat level virtual liquidity
     * @param level The heat level to set (CRACK=0, HIGH=1, PRO=2, APEX=3, CORE=4)
     * @param newValue New virtual liquidity (1e18 - 15000e18)
     */
    function proposeSetHeatLevel(
        HeatLevel level,
        uint256 newValue
    ) external onlySigner returns (uint256 actionId) {
        if (newValue < MIN_HEAT_LEVEL || newValue > MAX_HEAT_LEVEL)
            revert InvalidFee();
        return
            _createAction(ActionType.SetHeatLevel, abi.encode(level, newValue));
    }

    /**
     * @notice Propose to set proposer reward percentage
     * @param newProposerReward New proposer reward in basis points (max 200 = 2%)
     */
    function proposeSetProposerReward(
        uint256 newProposerReward
    ) external onlySigner returns (uint256 actionId) {
        if (newProposerReward > MAX_PROPOSER_REWARD_BPS)
            revert InvalidProposerReward();
        return
            _createAction(
                ActionType.SetProposerReward,
                abi.encode(newProposerReward)
            );
    }

    /**
     * @notice Propose to replace a signer (emergency - only needs 2-of-3)
     * @param oldSigner The signer to replace
     * @param newSigner The new signer address
     */
    function proposeReplaceSigner(
        address oldSigner,
        address newSigner
    ) external onlySigner returns (uint256 actionId) {
        if (newSigner == address(0)) revert InvalidAddress();
        if (oldSigner == newSigner) revert InvalidSignerReplacement();
        if (_isSigner(newSigner)) revert InvalidSignerReplacement();
        if (!_isSigner(oldSigner)) revert SignerNotFound();
        return
            _createAction(
                ActionType.ReplaceSigner,
                abi.encode(oldSigner, newSigner)
            );
    }

    // -------- Internal Action Creation --------

    /**
     * @notice Internal function to create and auto-approve an action
     * @dev Proposer auto-approves. Action executes when 3rd signer confirms (2-of-3 for ReplaceSigner)
     */
    function _createAction(
        ActionType actionType,
        bytes memory data
    ) internal returns (uint256 actionId) {
        actionId = actionNonce++;

        PendingAction storage action = pendingActions[actionId];
        action.actionType = actionType;
        action.data = data;
        action.confirmations = 1; // Auto-approve for proposer
        action.createdAt = block.timestamp;
        action.hasConfirmed[msg.sender] = true;

        emit ActionProposed(actionId, actionType, msg.sender);
        emit ActionConfirmed(actionId, msg.sender);
    }

    // -------- Confirm & Execute --------

    /**
     * @notice Confirm a pending action
     * @dev ReplaceSigner requires 2-of-3, all other actions require 3-of-3
     *      Auto-executes when required confirmations reached
     */
    function confirmAction(uint256 actionId) external onlySigner {
        PendingAction storage action = pendingActions[actionId];

        if (action.executed) revert ActionAlreadyExecuted();
        if (block.timestamp > action.createdAt + ACTION_EXPIRY)
            revert ActionExpired();
        if (action.hasConfirmed[msg.sender]) revert AlreadyConfirmed();

        action.hasConfirmed[msg.sender] = true;
        action.confirmations++;

        emit ActionConfirmed(actionId, msg.sender);

        // ReplaceSigner only needs 2-of-3 (emergency escape hatch)
        // All other actions require 3-of-3
        uint256 requiredConfirmations = action.actionType ==
            ActionType.ReplaceSigner
            ? 2
            : 3;

        if (action.confirmations >= requiredConfirmations) {
            _executeAction(actionId);
        }
    }

    /**
     * @notice Execute a fully confirmed action
     * @dev ReplaceSigner requires 2-of-3, all other actions require 3-of-3
     */
    function executeAction(uint256 actionId) external onlySigner {
        PendingAction storage action = pendingActions[actionId];

        if (action.executed) revert ActionAlreadyExecuted();
        if (block.timestamp > action.createdAt + ACTION_EXPIRY)
            revert ActionExpired();

        // ReplaceSigner only needs 2-of-3 (emergency escape hatch)
        uint256 requiredConfirmations = action.actionType ==
            ActionType.ReplaceSigner
            ? 2
            : 3;
        if (action.confirmations < requiredConfirmations)
            revert NotEnoughConfirmations();

        _executeAction(actionId);
    }

    // ============ Internal Functions ============

    function _isSigner(address account) internal view returns (bool) {
        return
            account == signers[0] ||
            account == signers[1] ||
            account == signers[2];
    }

    function _getMarketStatus(
        Market storage market
    ) internal view returns (MarketStatus) {
        if (market.resolved) return MarketStatus.Resolved;
        if (market.disputer != address(0)) return MarketStatus.Disputed;
        if (market.proposer != address(0)) return MarketStatus.Proposed;
        if (block.timestamp >= market.expiryTimestamp)
            return MarketStatus.Expired;
        return MarketStatus.Active;
    }

    function _getYesPrice(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 virtualLiquidity
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + virtualLiquidity;
        uint256 virtualNo = noSupply + virtualLiquidity;
        return (UNIT_PRICE * virtualYes) / (virtualYes + virtualNo);
    }

    function _getNoPrice(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 virtualLiquidity
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + virtualLiquidity;
        uint256 virtualNo = noSupply + virtualLiquidity;
        return (UNIT_PRICE * virtualNo) / (virtualYes + virtualNo);
    }

    function _calculateBuyShares(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 bnbAmount,
        bool isYes,
        uint256 virtualLiquidity
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + virtualLiquidity;
        uint256 virtualNo = noSupply + virtualLiquidity;
        uint256 totalVirtual = virtualYes + virtualNo;

        if (isYes) {
            return
                (bnbAmount * totalVirtual * 1e18) / (UNIT_PRICE * virtualYes);
        } else {
            return (bnbAmount * totalVirtual * 1e18) / (UNIT_PRICE * virtualNo);
        }
    }

    function _calculateSellBnb(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 shares,
        bool isYes,
        uint256 virtualLiquidity
    ) internal pure returns (uint256) {
        // The sell formula must be the exact inverse of the buy formula
        // Buy: shares = (bnb * totalVirtual * 1e18) / (UNIT_PRICE * virtualSide)
        // Sell: bnb = (shares * UNIT_PRICE * virtualSideAfter) / (totalVirtualAfter * 1e18)
        //
        // But we need to account for the price impact during the sell.
        // We use the state AFTER selling to calculate the BNB out.
        // This ensures buy->sell always results in a loss (to fees).

        uint256 virtualYes = yesSupply + virtualLiquidity;
        uint256 virtualNo = noSupply + virtualLiquidity;
        uint256 totalVirtual = virtualYes + virtualNo;

        uint256 virtualSide = isYes ? virtualYes : virtualNo;

        // State after selling
        uint256 virtualSideAfter = virtualSide - shares;
        uint256 totalVirtualAfter = totalVirtual - shares;

        // Calculate BNB out using the inverse of buy formula with post-sell state
        // This is equivalent to: what BNB would buy these shares at the NEW (lower) price
        // bnbOut = (shares * UNIT_PRICE * virtualSideAfter) / (totalVirtualAfter * 1e18)
        return
            (shares * UNIT_PRICE * virtualSideAfter) /
            (totalVirtualAfter * 1e18);
    }

    function _executeAction(uint256 actionId) internal {
        PendingAction storage action = pendingActions[actionId];
        action.executed = true;

        if (action.actionType == ActionType.SetFee) {
            // v3.8.1: Combined fee setting with FeeType
            (FeeType feeType, uint256 newFee) = abi.decode(
                action.data,
                (FeeType, uint256)
            );
            if (feeType == FeeType.Platform) {
                if (newFee > MAX_FEE_BPS) revert InvalidFee();
                platformFeeBps = newFee;
            } else if (feeType == FeeType.Creator) {
                if (newFee > MAX_CREATOR_FEE_BPS) revert InvalidFee();
                creatorFeeBps = newFee;
            } else if (feeType == FeeType.Resolution) {
                if (newFee > MAX_RESOLUTION_FEE_BPS) revert InvalidFee();
                resolutionFeeBps = newFee;
            } else if (feeType == FeeType.MarketCreation) {
                if (newFee > MAX_MARKET_CREATION_FEE)
                    revert InvalidMarketCreationFee();
                marketCreationFee = newFee;
            }
        } else if (action.actionType == ActionType.SetMinBet) {
            uint256 newMinBet = abi.decode(action.data, (uint256));
            if (newMinBet < MIN_BET_LOWER || newMinBet > MIN_BET_UPPER)
                revert InvalidMinBet();
            minBet = newMinBet;
        } else if (action.actionType == ActionType.SetTreasury) {
            address newTreasury = abi.decode(action.data, (address));
            if (newTreasury == address(0)) revert InvalidAddress();
            treasury = newTreasury;
        } else if (action.actionType == ActionType.Pause) {
            paused = true;
            emit Paused(msg.sender);
        } else if (action.actionType == ActionType.Unpause) {
            paused = false;
            emit Unpaused(msg.sender);
        } else if (action.actionType == ActionType.SetMinBondFloor) {
            uint256 newMinBondFloor = abi.decode(action.data, (uint256));
            if (
                newMinBondFloor < MIN_BOND_FLOOR_LOWER ||
                newMinBondFloor > MIN_BOND_FLOOR_UPPER
            ) revert InvalidMinBondFloor();
            minBondFloor = newMinBondFloor;
        } else if (action.actionType == ActionType.SetDynamicBondBps) {
            uint256 newDynamicBondBps = abi.decode(action.data, (uint256));
            if (
                newDynamicBondBps < DYNAMIC_BOND_BPS_LOWER ||
                newDynamicBondBps > DYNAMIC_BOND_BPS_UPPER
            ) revert InvalidDynamicBondBps();
            dynamicBondBps = newDynamicBondBps;
        } else if (action.actionType == ActionType.SetBondWinnerShare) {
            uint256 newBondWinnerShare = abi.decode(action.data, (uint256));
            if (
                newBondWinnerShare < BOND_WINNER_SHARE_LOWER ||
                newBondWinnerShare > BOND_WINNER_SHARE_UPPER
            ) revert InvalidBondWinnerShare();
            bondWinnerShareBps = newBondWinnerShare;
        } else if (action.actionType == ActionType.SetHeatLevel) {
            // v3.8.1: Combined heat level setting
            (HeatLevel level, uint256 newValue) = abi.decode(
                action.data,
                (HeatLevel, uint256)
            );
            if (newValue < MIN_HEAT_LEVEL || newValue > MAX_HEAT_LEVEL)
                revert InvalidFee();
            if (level == HeatLevel.CRACK) {
                heatLevelCrack = newValue;
            } else if (level == HeatLevel.HIGH) {
                heatLevelHigh = newValue;
            } else if (level == HeatLevel.PRO) {
                heatLevelPro = newValue;
            } else if (level == HeatLevel.APEX) {
                heatLevelApex = newValue;
            } else if (level == HeatLevel.CORE) {
                heatLevelCore = newValue;
            }
        } else if (action.actionType == ActionType.SetProposerReward) {
            uint256 newProposerReward = abi.decode(action.data, (uint256));
            if (newProposerReward > MAX_PROPOSER_REWARD_BPS)
                revert InvalidProposerReward();
            proposerRewardBps = newProposerReward;
        } else if (action.actionType == ActionType.ReplaceSigner) {
            // v3.4.1: Emergency signer replacement (2-of-3 confirmations)
            (address oldSigner, address newSigner) = abi.decode(
                action.data,
                (address, address)
            );
            if (newSigner == address(0)) revert InvalidAddress();
            if (oldSigner == newSigner) revert InvalidSignerReplacement();
            // Prevent duplicate signers - critical for 3-of-3 governance
            // Without this, replacing SignerA with SignerB (already a signer) would
            // result in duplicate signers, making 3-of-3 actions impossible
            if (_isSigner(newSigner)) revert InvalidSignerReplacement();

            // Find and replace the old signer
            bool found = false;
            for (uint256 i = 0; i < 3; i++) {
                if (signers[i] == oldSigner) {
                    signers[i] = newSigner;
                    found = true;
                    break;
                }
            }
            if (!found) revert SignerNotFound();

            emit SignerReplaced(oldSigner, newSigner, actionId);
        }

        emit ActionExecuted(actionId, action.actionType);
    }
}
