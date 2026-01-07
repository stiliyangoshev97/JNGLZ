// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @author Junkie.Fun
 * @notice Decentralized prediction market with bonding curve pricing and UMA Oracle resolution
 * @dev Uses linear constant sum bonding curve: P(YES) + P(NO) = UNIT_PRICE (0.01 BNB)
 *      Virtual liquidity of 100 shares each side provides initial pricing
 *      3-of-3 MultiSig for all governance actions
 */
contract PredictionMarket is ReentrancyGuard {
    // ============ Constants ============

    /// @notice Fixed unit price for shares (P_YES + P_NO always equals this)
    uint256 public constant UNIT_PRICE = 0.01 ether;

    /// @notice Virtual liquidity added to each side for pricing (scaled to 1e18)
    uint256 public constant VIRTUAL_LIQUIDITY = 100 * 1e18;

    /// @notice Maximum platform fee (5%)
    uint256 public constant MAX_FEE_BPS = 500;

    /// @notice Creator fee (0.5%) - paid to market creator on each trade
    uint256 public constant CREATOR_FEE_BPS = 50;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice MultiSig action expiry time
    uint256 public constant ACTION_EXPIRY = 1 hours;

    /// @notice Minimum bet bounds
    uint256 public constant MIN_BET_LOWER = 0.001 ether;
    uint256 public constant MIN_BET_UPPER = 0.1 ether;

    /// @notice UMA bond bounds
    uint256 public constant UMA_BOND_LOWER = 0.01 ether;
    uint256 public constant UMA_BOND_UPPER = 1 ether;

    /// @notice Minimum bond floor for dynamic bond calculation
    uint256 public constant MIN_BOND_FLOOR = 0.02 ether;

    /// @notice Dynamic bond percentage (1% of pool)
    uint256 public constant DYNAMIC_BOND_BPS = 100;

    /// @notice Asserter reward (2% of pool balance)
    uint256 public constant ASSERTER_REWARD_BPS = 200;

    /// @notice Emergency refund delay after expiry (24 hours)
    uint256 public constant EMERGENCY_REFUND_DELAY = 24 hours;

    // ============ Enums ============

    enum MarketStatus {
        Active, // Trading open
        Expired, // Past expiry, awaiting assertion
        Asserted, // Outcome asserted, in dispute window
        Resolved // Final outcome set
    }

    enum ActionType {
        SetFee,
        SetMinBet,
        SetUmaBond,
        SetTreasury,
        SetWbnb,
        SetUmaOOv3,
        Pause,
        Unpause
    }

    // ============ Structs ============

    struct Market {
        string question;
        string evidenceLink;
        string resolutionRules;
        address creator;
        uint256 expiryTimestamp;
        uint256 yesSupply; // Total YES shares minted
        uint256 noSupply; // Total NO shares minted
        uint256 poolBalance; // Total BNB in pool
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        bytes32 assertionId;
        address asserter;
        bool assertedOutcome;
        bool asserterRewardPaid; // Track if asserter reward was paid
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
    }

    // ============ State Variables ============

    // MultiSig
    address[3] public signers;
    uint256 public actionNonce;
    mapping(uint256 => PendingAction) public pendingActions;

    // Configurable parameters
    uint256 public platformFeeBps = 100; // 1% default
    uint256 public minBet = 0.005 ether;
    uint256 public umaBond = 0.02 ether;
    address public treasury;
    address public wbnb;
    address public umaOOv3;

    // Pause state
    bool public paused;

    // Markets
    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;

    // UMA assertion tracking
    mapping(bytes32 => uint256) public assertionToMarket;

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        address indexed creator,
        string question,
        uint256 expiryTimestamp
    );

    event Trade(
        uint256 indexed marketId,
        address indexed trader,
        bool isYes,
        bool isBuy,
        uint256 shares,
        uint256 bnbAmount
    );

    event OutcomeAsserted(
        uint256 indexed marketId,
        address indexed asserter,
        bool outcome,
        bytes32 assertionId
    );

    event MarketResolved(uint256 indexed marketId, bool outcome);

    event Claimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    event AsserterRewardPaid(
        uint256 indexed marketId,
        address indexed asserter,
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

    // ============ Errors ============

    error NotSigner();
    error InvalidAddress();
    error InvalidFee();
    error InvalidMinBet();
    error InvalidUmaBond();
    error ActionExpired();
    error ActionAlreadyExecuted();
    error AlreadyConfirmed();
    error NotEnoughConfirmations();
    error ContractPaused();
    error ContractNotPaused();
    error MarketNotActive();
    error MarketNotExpired();
    error MarketAlreadyResolved();
    error MarketNotAsserted();
    error BelowMinBet();
    error SlippageExceeded();
    error InsufficientShares();
    error NothingToClaim();
    error AlreadyClaimed();
    error InvalidExpiryTimestamp();
    error EmptyQuestion();
    error EmptyEvidenceLink();
    error TransferFailed();
    error OnlyUmaOOv3();
    error InvalidAssertionId();
    error InsufficientPoolBalance();
    error EmergencyRefundTooEarly();
    error NoPosition();
    error AlreadyEmergencyRefunded();
    error MarketHasAssertion();

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

    modifier onlyUmaOOv3() {
        if (msg.sender != umaOOv3) revert OnlyUmaOOv3();
        _;
    }

    // ============ Constructor ============

    constructor(
        address[3] memory _signers,
        address _treasury,
        address _wbnb,
        address _umaOOv3
    ) {
        for (uint256 i = 0; i < 3; i++) {
            if (_signers[i] == address(0)) revert InvalidAddress();
            signers[i] = _signers[i];
        }

        if (_treasury == address(0)) revert InvalidAddress();
        if (_wbnb == address(0)) revert InvalidAddress();
        if (_umaOOv3 == address(0)) revert InvalidAddress();

        treasury = _treasury;
        wbnb = _wbnb;
        umaOOv3 = _umaOOv3;
    }

    // ============ Market Creation ============

    /**
     * @notice Create a new prediction market (free)
     * @param question The prediction question
     * @param evidenceLink URL to source of truth for resolution
     * @param resolutionRules Clear rules for how to resolve
     * @param expiryTimestamp When trading ends
     */
    function createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        uint256 expiryTimestamp
    ) external whenNotPaused returns (uint256 marketId) {
        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            expiryTimestamp
        );
    }

    /**
     * @notice Create a new prediction market AND place the first bet atomically
     * @dev This guarantees the creator is the first buyer - impossible to front-run
     * @param question The prediction question
     * @param evidenceLink URL to source of truth for resolution
     * @param resolutionRules Clear rules for how to resolve
     * @param expiryTimestamp When trading ends
     * @param buyYesSide If true, buy YES shares; if false, buy NO shares
     * @param minSharesOut Minimum shares to receive (slippage protection)
     * @return marketId The ID of the created market
     * @return sharesOut The number of shares purchased
     */
    function createMarketAndBuy(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        uint256 expiryTimestamp,
        bool buyYesSide,
        uint256 minSharesOut
    )
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 marketId, uint256 sharesOut)
    {
        // Create the market
        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            expiryTimestamp
        );

        // Buy shares (must send BNB with this call)
        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];

        // Calculate shares out based on bonding curve
        uint256 fee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 amountAfterFee = msg.value - fee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            buyYesSide
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        // Update state (CEI pattern)
        if (buyYesSide) {
            market.yesSupply += sharesOut;
            positions[marketId][msg.sender].yesShares += sharesOut;
        } else {
            market.noSupply += sharesOut;
            positions[marketId][msg.sender].noShares += sharesOut;
        }
        market.poolBalance += amountAfterFee;

        // Transfer fee to treasury
        if (fee > 0) {
            (bool success, ) = treasury.call{value: fee}("");
            if (!success) revert TransferFailed();
        }

        emit Trade(
            marketId,
            msg.sender,
            buyYesSide,
            true,
            sharesOut,
            msg.value
        );
    }

    /**
     * @notice Internal function to create a market
     */
    function _createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        uint256 expiryTimestamp
    ) internal returns (uint256 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (bytes(evidenceLink).length == 0) revert EmptyEvidenceLink();
        if (expiryTimestamp <= block.timestamp) revert InvalidExpiryTimestamp();

        marketId = marketCount++;

        Market storage market = markets[marketId];
        market.question = question;
        market.evidenceLink = evidenceLink;
        market.resolutionRules = resolutionRules;
        market.creator = msg.sender;
        market.expiryTimestamp = expiryTimestamp;
        // yesSupply, noSupply, poolBalance start at 0
        // resolved, outcome default to false

        emit MarketCreated(marketId, msg.sender, question, expiryTimestamp);
    }

    // ============ Trading Functions ============

    /**
     * @notice Buy YES shares
     * @param marketId The market to trade in
     * @param minSharesOut Minimum shares to receive (slippage protection)
     */
    function buyYes(
        uint256 marketId,
        uint256 minSharesOut
    ) external payable nonReentrant whenNotPaused returns (uint256 sharesOut) {
        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        // Calculate fees
        uint256 platformFee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (msg.value * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        uint256 amountAfterFee = msg.value - totalFee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            true
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        // Update state (CEI pattern)
        market.yesSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].yesShares += sharesOut;

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer creator fee to market creator
        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        emit Trade(marketId, msg.sender, true, true, sharesOut, msg.value);
    }

    /**
     * @notice Buy NO shares
     * @param marketId The market to trade in
     * @param minSharesOut Minimum shares to receive (slippage protection)
     */
    function buyNo(
        uint256 marketId,
        uint256 minSharesOut
    ) external payable nonReentrant whenNotPaused returns (uint256 sharesOut) {
        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];
        if (_getMarketStatus(market) != MarketStatus.Active)
            revert MarketNotActive();

        // Calculate fees
        uint256 platformFee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (msg.value * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        uint256 amountAfterFee = msg.value - totalFee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            false
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        // Update state (CEI pattern)
        market.noSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].noShares += sharesOut;

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer creator fee to market creator
        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        emit Trade(marketId, msg.sender, false, true, sharesOut, msg.value);
    }

    /**
     * @notice Sell YES shares
     * @param marketId The market to trade in
     * @param shares Number of shares to sell
     * @param minBnbOut Minimum BNB to receive (slippage protection)
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

        // Calculate BNB out based on bonding curve (using average price)
        uint256 grossBnbOut = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            shares,
            true
        );

        // CRITICAL: Ensure pool has sufficient balance
        if (grossBnbOut > market.poolBalance) revert InsufficientPoolBalance();

        // Calculate fees from gross BNB out
        uint256 platformFee = (grossBnbOut * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (grossBnbOut * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        bnbOut = grossBnbOut - totalFee;

        if (bnbOut < minBnbOut) revert SlippageExceeded();

        // Update state (CEI pattern)
        market.yesSupply -= shares;
        market.poolBalance -= grossBnbOut;
        position.yesShares -= shares;

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer creator fee to market creator
        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer BNB to seller
        (bool successTransfer, ) = msg.sender.call{value: bnbOut}("");
        if (!successTransfer) revert TransferFailed();

        emit Trade(marketId, msg.sender, true, false, shares, bnbOut);
    }

    /**
     * @notice Sell NO shares
     * @param marketId The market to trade in
     * @param shares Number of shares to sell
     * @param minBnbOut Minimum BNB to receive (slippage protection)
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

        // Calculate BNB out based on bonding curve (using average price)
        uint256 grossBnbOut = _calculateSellBnb(
            market.yesSupply,
            market.noSupply,
            shares,
            false
        );

        // CRITICAL: Ensure pool has sufficient balance
        if (grossBnbOut > market.poolBalance) revert InsufficientPoolBalance();

        // Calculate fees from gross BNB out
        uint256 platformFee = (grossBnbOut * platformFeeBps) / BPS_DENOMINATOR;
        uint256 creatorFee = (grossBnbOut * CREATOR_FEE_BPS) / BPS_DENOMINATOR;
        uint256 totalFee = platformFee + creatorFee;
        bnbOut = grossBnbOut - totalFee;

        if (bnbOut < minBnbOut) revert SlippageExceeded();

        // Update state (CEI pattern)
        market.noSupply -= shares;
        market.poolBalance -= grossBnbOut;
        position.noShares -= shares;

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer creator fee to market creator
        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        // Transfer BNB to seller
        (bool successTransfer, ) = msg.sender.call{value: bnbOut}("");
        if (!successTransfer) revert TransferFailed();

        emit Trade(marketId, msg.sender, false, false, shares, bnbOut);
    }

    // ============ Resolution Functions ============

    /**
     * @notice Assert the outcome of an expired market via UMA OOv3
     * @param marketId The market to assert
     * @param outcome The claimed outcome (true = YES, false = NO)
     * @dev Caller must have approved WBNB bond amount to this contract
     */
    function assertOutcome(
        uint256 marketId,
        bool outcome
    ) external whenNotPaused returns (bytes32 assertionId) {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status != MarketStatus.Expired) {
            if (status == MarketStatus.Active) revert MarketNotExpired();
            if (
                status == MarketStatus.Asserted ||
                status == MarketStatus.Resolved
            ) revert MarketAlreadyResolved();
        }

        // Calculate dynamic bond: max(0.02 BNB, poolBalance * 1%)
        uint256 requiredBond = getRequiredBond(marketId);

        // Transfer WBNB bond from asserter
        IWBNB(wbnb).transferFrom(msg.sender, address(this), requiredBond);

        // Approve UMA to spend bond
        IWBNB(wbnb).approve(umaOOv3, requiredBond);

        // Build assertion claim string
        bytes memory assertionClaim = abi.encodePacked(
            "Market: ",
            market.question,
            " | Outcome: ",
            outcome ? "YES" : "NO",
            " | Evidence: ",
            market.evidenceLink
        );

        // Assert truth with UMA OOv3
        assertionId = IOptimisticOracleV3(umaOOv3).assertTruthWithDefaults(
            assertionClaim,
            address(this)
        );

        // Update market state
        market.assertionId = assertionId;
        market.asserter = msg.sender;
        market.assertedOutcome = outcome;
        assertionToMarket[assertionId] = marketId;

        emit OutcomeAsserted(marketId, msg.sender, outcome, assertionId);
    }

    /**
     * @notice Callback from UMA OOv3 when assertion is resolved
     * @param assertionId The assertion that was resolved
     * @param assertedTruthfully Whether the assertion was true
     */
    function assertionResolvedCallback(
        bytes32 assertionId,
        bool assertedTruthfully
    ) external onlyUmaOOv3 {
        uint256 marketId = assertionToMarket[assertionId];
        Market storage market = markets[marketId];

        if (market.assertionId != assertionId) revert InvalidAssertionId();

        if (assertedTruthfully) {
            // Assertion was correct, finalize with asserted outcome
            market.resolved = true;
            market.outcome = market.assertedOutcome;
            emit MarketResolved(marketId, market.outcome);
        } else {
            // Assertion was disputed and lost, reset for new assertion
            market.assertionId = bytes32(0);
            market.asserter = address(0);
            // assertedOutcome doesn't matter since assertionId is cleared
        }
    }

    /**
     * @notice Claim winnings from a resolved market
     * @param marketId The market to claim from
     */
    function claim(
        uint256 marketId
    ) external nonReentrant returns (uint256 payout) {
        Market storage market = markets[marketId];
        if (!market.resolved) revert MarketNotAsserted();

        Position storage position = positions[marketId][msg.sender];
        if (position.claimed) revert AlreadyClaimed();

        uint256 winningShares = market.outcome
            ? position.yesShares
            : position.noShares;
        if (winningShares == 0) revert NothingToClaim();

        // Pay asserter reward on first claim (2% of pool)
        if (!market.asserterRewardPaid && market.asserter != address(0)) {
            uint256 asserterReward = (market.poolBalance *
                ASSERTER_REWARD_BPS) / BPS_DENOMINATOR;
            market.asserterRewardPaid = true;
            market.poolBalance -= asserterReward; // Deduct from pool

            // Transfer asserter reward
            if (asserterReward > 0) {
                (bool rewardSuccess, ) = market.asserter.call{
                    value: asserterReward
                }("");
                if (!rewardSuccess) revert TransferFailed();
                emit AsserterRewardPaid(
                    marketId,
                    market.asserter,
                    asserterReward
                );
            }
        }

        // Calculate payout: proportional share of remaining pool
        uint256 totalWinningShares = market.outcome
            ? market.yesSupply
            : market.noSupply;
        payout = (winningShares * market.poolBalance) / totalWinningShares;

        // Update state (CEI pattern)
        position.claimed = true;

        // Transfer payout
        (bool success, ) = msg.sender.call{value: payout}("");
        if (!success) revert TransferFailed();

        emit Claimed(marketId, msg.sender, payout);
    }

    /**
     * @notice Emergency refund for markets where no assertion was made within 24 hours after expiry
     * @dev Users can self-claim proportional refund based on their total shares
     * @param marketId The market to claim emergency refund from
     */
    function emergencyRefund(
        uint256 marketId
    ) external nonReentrant returns (uint256 refund) {
        Market storage market = markets[marketId];

        // Check market has expired + 24 hours passed
        if (block.timestamp < market.expiryTimestamp + EMERGENCY_REFUND_DELAY) {
            revert EmergencyRefundTooEarly();
        }

        // Check market is not resolved (check resolved first since it implies assertion existed)
        if (market.resolved) revert MarketAlreadyResolved();

        // Check no assertion exists (market stuck in Expired state)
        if (market.assertionId != bytes32(0)) revert MarketHasAssertion();

        Position storage position = positions[marketId][msg.sender];
        if (position.emergencyRefunded) revert AlreadyEmergencyRefunded();

        // User must have some position
        uint256 userTotalShares = position.yesShares + position.noShares;
        if (userTotalShares == 0) revert NoPosition();

        // Calculate proportional refund: (user shares / total shares) * pool balance
        // Note: We use the CURRENT poolBalance which represents the original pool
        // since we don't decrease it during emergency refunds (each user can only claim once)
        uint256 totalShares = market.yesSupply + market.noSupply;
        refund = (userTotalShares * market.poolBalance) / totalShares;

        // Update state (CEI pattern)
        // Mark as refunded but DON'T decrease poolBalance - this ensures each user
        // gets their fair proportional share regardless of claim order
        position.emergencyRefunded = true;

        // Transfer refund
        (bool success, ) = msg.sender.call{value: refund}("");
        if (!success) revert TransferFailed();

        emit EmergencyRefunded(marketId, msg.sender, refund);
    }

    // ============ View Functions ============

    /**
     * @notice Get current YES price based on bonding curve
     * @param marketId The market to query
     * @return price Price in wei for 1 YES share (scaled by 1e18)
     */
    function getYesPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return _getYesPrice(market.yesSupply, market.noSupply);
    }

    /**
     * @notice Get current NO price based on bonding curve
     * @param marketId The market to query
     * @return price Price in wei for 1 NO share (scaled by 1e18)
     */
    function getNoPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return _getNoPrice(market.yesSupply, market.noSupply);
    }

    /**
     * @notice Preview how many shares you'd get for a given BNB amount
     * @param marketId The market to query
     * @param bnbAmount Amount of BNB to spend
     * @param isYes Whether buying YES or NO
     * @return shares Number of shares you'd receive
     */
    function previewBuy(
        uint256 marketId,
        uint256 bnbAmount,
        bool isYes
    ) external view returns (uint256 shares) {
        Market storage market = markets[marketId];
        uint256 totalFee = (bnbAmount * (platformFeeBps + CREATOR_FEE_BPS)) /
            BPS_DENOMINATOR;
        return
            _calculateBuyShares(
                market.yesSupply,
                market.noSupply,
                bnbAmount - totalFee,
                isYes
            );
    }

    /**
     * @notice Preview how much BNB you'd get for selling shares
     * @param marketId The market to query
     * @param shares Number of shares to sell
     * @param isYes Whether selling YES or NO
     * @return bnbOut Amount of BNB you'd receive after fees
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
            isYes
        );
        uint256 totalFee = (grossBnbOut * (platformFeeBps + CREATOR_FEE_BPS)) /
            BPS_DENOMINATOR;
        return grossBnbOut - totalFee;
    }

    /**
     * @notice Get the current status of a market
     * @param marketId The market to query
     */
    function getMarketStatus(
        uint256 marketId
    ) external view returns (MarketStatus) {
        return _getMarketStatus(markets[marketId]);
    }

    /**
     * @notice Get a user's position in a market
     * @param marketId The market to query
     * @param user The user to query
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
            bool emergencyRefunded
        )
    {
        Position storage pos = positions[marketId][user];
        return (
            pos.yesShares,
            pos.noShares,
            pos.claimed,
            pos.emergencyRefunded
        );
    }

    /**
     * @notice Check if a market is eligible for emergency refund
     * @param marketId The market to query
     */
    function canEmergencyRefund(
        uint256 marketId
    ) external view returns (bool eligible, uint256 timeUntilEligible) {
        Market storage market = markets[marketId];

        // Not eligible if resolved or has assertion
        if (market.resolved || market.assertionId != bytes32(0)) {
            return (false, 0);
        }

        uint256 emergencyTime = market.expiryTimestamp + EMERGENCY_REFUND_DELAY;
        if (block.timestamp >= emergencyTime) {
            return (true, 0);
        }

        return (false, emergencyTime - block.timestamp);
    }

    /**
     * @notice Calculate the required bond for asserting a market outcome
     * @dev Dynamic bond: max(MIN_BOND_FLOOR, poolBalance * 1%)
     * @param marketId The market to query
     * @return requiredBond The bond amount required in WBNB
     */
    function getRequiredBond(
        uint256 marketId
    ) public view returns (uint256 requiredBond) {
        Market storage market = markets[marketId];
        uint256 dynamicBond = (market.poolBalance * DYNAMIC_BOND_BPS) /
            BPS_DENOMINATOR;
        requiredBond = dynamicBond > MIN_BOND_FLOOR
            ? dynamicBond
            : MIN_BOND_FLOOR;
    }

    /**
     * @notice Get full market data
     * @param marketId The market to query
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
            address creator,
            uint256 expiryTimestamp,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            bool resolved,
            bool outcome,
            bytes32 assertionId,
            address asserter
        )
    {
        Market storage m = markets[marketId];
        return (
            m.question,
            m.evidenceLink,
            m.resolutionRules,
            m.creator,
            m.expiryTimestamp,
            m.yesSupply,
            m.noSupply,
            m.poolBalance,
            m.resolved,
            m.outcome,
            m.assertionId,
            m.asserter
        );
    }

    // ============ MultiSig Governance ============

    /**
     * @notice Propose a governance action (any signer can propose)
     * @param actionType The type of action to perform
     * @param data ABI-encoded parameters for the action
     */
    function proposeAction(
        ActionType actionType,
        bytes calldata data
    ) external onlySigner returns (uint256 actionId) {
        actionId = actionNonce++;

        PendingAction storage action = pendingActions[actionId];
        action.actionType = actionType;
        action.data = data;
        action.confirmations = 1;
        action.createdAt = block.timestamp;
        action.hasConfirmed[msg.sender] = true;

        emit ActionProposed(actionId, actionType, msg.sender);
        emit ActionConfirmed(actionId, msg.sender);
    }

    /**
     * @notice Confirm a pending action
     * @param actionId The action to confirm
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

        // Auto-execute if 3 confirmations reached
        if (action.confirmations >= 3) {
            _executeAction(actionId);
        }
    }

    /**
     * @notice Execute a fully confirmed action
     * @param actionId The action to execute
     */
    function executeAction(uint256 actionId) external onlySigner {
        PendingAction storage action = pendingActions[actionId];

        if (action.executed) revert ActionAlreadyExecuted();
        if (block.timestamp > action.createdAt + ACTION_EXPIRY)
            revert ActionExpired();
        if (action.confirmations < 3) revert NotEnoughConfirmations();

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
        if (market.assertionId != bytes32(0)) return MarketStatus.Asserted;
        if (block.timestamp >= market.expiryTimestamp)
            return MarketStatus.Expired;
        return MarketStatus.Active;
    }

    /**
     * @notice Calculate YES price using linear constant sum formula
     * @dev P(YES) = UNIT_PRICE * YES_supply / (YES_supply + NO_supply)
     *      More YES supply = higher YES price (more likely)
     */
    function _getYesPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        // P(YES) = UNIT_PRICE * virtualYes / (virtualYes + virtualNo)
        return (UNIT_PRICE * virtualYes) / (virtualYes + virtualNo);
    }

    /**
     * @notice Calculate NO price using linear constant sum formula
     * @dev P(NO) = UNIT_PRICE * NO_supply / (YES_supply + NO_supply)
     *      More NO supply = higher NO price (more likely)
     */
    function _getNoPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        // P(NO) = UNIT_PRICE * virtualNo / (virtualYes + virtualNo)
        return (UNIT_PRICE * virtualNo) / (virtualYes + virtualNo);
    }

    /**
     * @notice Calculate shares received for a given BNB input
     * @dev Uses average price during the trade to ensure pool solvency
     *      Shares = bnbAmount / averagePrice
     *      Where averagePrice is between pre-trade and post-trade price
     */
    function _calculateBuyShares(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 bnbAmount,
        bool isYes
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        uint256 totalVirtual = virtualYes + virtualNo;

        if (isYes) {
            // P(YES) = UNIT_PRICE * virtualYes / totalVirtual
            // shares = bnbAmount / price = bnbAmount * totalVirtual / (UNIT_PRICE * virtualYes)
            return
                (bnbAmount * totalVirtual * 1e18) / (UNIT_PRICE * virtualYes);
        } else {
            // P(NO) = UNIT_PRICE * virtualNo / totalVirtual
            return (bnbAmount * totalVirtual * 1e18) / (UNIT_PRICE * virtualNo);
        }
    }

    /**
     * @notice Calculate BNB received for selling shares using AVERAGE price
     * @dev To ensure pool solvency, we calculate BNB based on the average price
     *      between current state and post-sell state.
     *
     *      Current price: P1 = UNIT_PRICE * virtualSide / totalVirtual
     *      Post-sell price: P2 = UNIT_PRICE * (virtualSide - shares) / (total - shares)
     *      Average price: (P1 + P2) / 2
     *
     *      This ensures that selling gives back less than or equal to what buying cost,
     *      preventing pool insolvency.
     */
    function _calculateSellBnb(
        uint256 yesSupply,
        uint256 noSupply,
        uint256 shares,
        bool isYes
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        uint256 totalVirtual = virtualYes + virtualNo;

        uint256 virtualSide = isYes ? virtualYes : virtualNo;

        // Current price (before sell)
        // P1 = UNIT_PRICE * virtualSide / totalVirtual
        uint256 priceBeforeSell = (UNIT_PRICE * virtualSide) / totalVirtual;

        // Post-sell state
        uint256 virtualSideAfter = virtualSide - shares;
        uint256 totalVirtualAfter = totalVirtual - shares;

        // Price after sell
        // P2 = UNIT_PRICE * virtualSideAfter / totalVirtualAfter
        uint256 priceAfterSell = (UNIT_PRICE * virtualSideAfter) /
            totalVirtualAfter;

        // Average price = (P1 + P2) / 2
        uint256 avgPrice = (priceBeforeSell + priceAfterSell) / 2;

        // BNB out = shares * avgPrice / 1e18 (to account for share scaling)
        return (shares * avgPrice) / 1e18;
    }

    function _executeAction(uint256 actionId) internal {
        PendingAction storage action = pendingActions[actionId];
        action.executed = true;

        if (action.actionType == ActionType.SetFee) {
            uint256 newFee = abi.decode(action.data, (uint256));
            if (newFee > MAX_FEE_BPS) revert InvalidFee();
            platformFeeBps = newFee;
        } else if (action.actionType == ActionType.SetMinBet) {
            uint256 newMinBet = abi.decode(action.data, (uint256));
            if (newMinBet < MIN_BET_LOWER || newMinBet > MIN_BET_UPPER)
                revert InvalidMinBet();
            minBet = newMinBet;
        } else if (action.actionType == ActionType.SetUmaBond) {
            uint256 newBond = abi.decode(action.data, (uint256));
            if (newBond < UMA_BOND_LOWER || newBond > UMA_BOND_UPPER)
                revert InvalidUmaBond();
            umaBond = newBond;
        } else if (action.actionType == ActionType.SetTreasury) {
            address newTreasury = abi.decode(action.data, (address));
            if (newTreasury == address(0)) revert InvalidAddress();
            treasury = newTreasury;
        } else if (action.actionType == ActionType.SetWbnb) {
            address newWbnb = abi.decode(action.data, (address));
            if (newWbnb == address(0)) revert InvalidAddress();
            wbnb = newWbnb;
        } else if (action.actionType == ActionType.SetUmaOOv3) {
            address newUma = abi.decode(action.data, (address));
            if (newUma == address(0)) revert InvalidAddress();
            umaOOv3 = newUma;
        } else if (action.actionType == ActionType.Pause) {
            paused = true;
            emit Paused(msg.sender);
        } else if (action.actionType == ActionType.Unpause) {
            paused = false;
            emit Unpaused(msg.sender);
        }

        emit ActionExecuted(actionId, action.actionType);
    }
}

// ============ Interfaces ============

interface IWBNB {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);
}

interface IOptimisticOracleV3 {
    function assertTruthWithDefaults(
        bytes memory claim,
        address asserter
    ) external returns (bytes32 assertionId);
}
