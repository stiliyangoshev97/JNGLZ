// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @author Junkie.Fun
 * @notice Decentralized prediction market with bonding curve pricing and Street Consensus resolution
 * @dev Uses linear constant sum bonding curve: P(YES) + P(NO) = UNIT_PRICE (0.01 BNB)
 *      Virtual liquidity of 100 shares each side provides initial pricing
 *      Street Consensus: Bettors vote on outcomes, weighted by share ownership
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

    /// @notice Maximum creator fee (2%)
    uint256 public constant MAX_CREATOR_FEE_BPS = 200;

    /// @notice Maximum resolution fee (1%)
    uint256 public constant MAX_RESOLUTION_FEE_BPS = 100;

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

    enum ActionType {
        SetFee,
        SetMinBet,
        SetTreasury,
        Pause,
        Unpause,
        SetCreatorFee,
        SetResolutionFee,
        SetMinBondFloor,
        SetDynamicBondBps,
        SetBondWinnerShare
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
        bool resolved;
        bool outcome; // true = YES wins, false = NO wins
        // Street Consensus fields
        address proposer;
        bool proposedOutcome;
        string proofLink;
        uint256 proposalTime;
        uint256 proposalBond;
        address disputer;
        uint256 disputeTime;
        uint256 disputeBond;
        uint256 yesVotes; // Total vote weight for YES
        uint256 noVotes; // Total vote weight for NO
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
    address public treasury;

    // Pause state
    bool public paused;

    // Markets
    uint256 public marketCount;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;

    // Track voters for jury fee distribution
    mapping(uint256 => address[]) public marketVoters;

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

    event OutcomeProposed(
        uint256 indexed marketId,
        address indexed proposer,
        bool outcome,
        string proofLink,
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

    event JuryFeeDistributed(
        uint256 indexed marketId,
        address indexed voter,
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
    error InvalidMinBondFloor();
    error InvalidDynamicBondBps();
    error InvalidBondWinnerShare();
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
            signers[i] = _signers[i];
        }

        if (_treasury == address(0)) revert InvalidAddress();
        treasury = _treasury;
    }

    // ============ Market Creation ============

    /**
     * @notice Create a new prediction market (free)
     * @param question The prediction question
     * @param evidenceLink URL to source of truth for resolution (can be empty for degen markets)
     * @param resolutionRules Clear rules for how to resolve
     * @param imageUrl URL to market image/thumbnail (IPFS or HTTP, can be empty)
     * @param expiryTimestamp When trading ends
     */
    function createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
        uint256 expiryTimestamp
    ) external whenNotPaused returns (uint256 marketId) {
        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            imageUrl,
            expiryTimestamp
        );
    }

    /**
     * @notice Create a new prediction market AND place the first bet atomically
     * @dev This guarantees the creator is the first buyer - impossible to front-run
     */
    function createMarketAndBuy(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
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
        marketId = _createMarket(
            question,
            evidenceLink,
            resolutionRules,
            imageUrl,
            expiryTimestamp
        );

        if (msg.value < minBet) revert BelowMinBet();

        Market storage market = markets[marketId];

        uint256 fee = (msg.value * platformFeeBps) / BPS_DENOMINATOR;
        uint256 amountAfterFee = msg.value - fee;

        sharesOut = _calculateBuyShares(
            market.yesSupply,
            market.noSupply,
            amountAfterFee,
            buyYesSide
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

    function _createMarket(
        string calldata question,
        string calldata evidenceLink,
        string calldata resolutionRules,
        string calldata imageUrl,
        uint256 expiryTimestamp
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

        emit MarketCreated(marketId, msg.sender, question, expiryTimestamp);
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
            true
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        market.yesSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].yesShares += sharesOut;

        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        emit Trade(marketId, msg.sender, true, true, sharesOut, msg.value);
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
            false
        );
        if (sharesOut < minSharesOut) revert SlippageExceeded();

        market.noSupply += sharesOut;
        market.poolBalance += amountAfterFee;
        positions[marketId][msg.sender].noShares += sharesOut;

        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
        }

        emit Trade(marketId, msg.sender, false, true, sharesOut, msg.value);
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
            true
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

        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
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
            false
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

        if (platformFee > 0) {
            (bool success, ) = treasury.call{value: platformFee}("");
            if (!success) revert TransferFailed();
        }

        if (creatorFee > 0) {
            (bool success, ) = market.creator.call{value: creatorFee}("");
            if (!success) revert TransferFailed();
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
     * @param proofLink Optional URL to proof/evidence (can be empty)
     * @dev Requires bond payment. Creator has priority in first 10 minutes.
     */
    function proposeOutcome(
        uint256 marketId,
        bool outcome,
        string calldata proofLink
    ) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status == MarketStatus.Active) revert MarketNotExpired();
        if (status != MarketStatus.Expired) revert AlreadyProposed();

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
        market.proofLink = proofLink;
        market.proposalTime = block.timestamp;
        market.proposalBond = bondAfterFee;

        // Send fee to treasury
        if (fee > 0) {
            (bool success, ) = treasury.call{value: fee}("");
            if (!success) revert TransferFailed();
        }

        emit OutcomeProposed(
            marketId,
            msg.sender,
            outcome,
            proofLink,
            bondAfterFee
        );
    }

    /**
     * @notice Dispute a proposed outcome
     * @param marketId The market with the proposal to dispute
     * @dev Requires 2x the proposal bond. Triggers voting period.
     */
    function dispute(
        uint256 marketId
    ) external payable nonReentrant whenNotPaused {
        Market storage market = markets[marketId];

        MarketStatus status = _getMarketStatus(market);
        if (status != MarketStatus.Proposed) revert NotProposed();

        // Check we're still in dispute window
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

        // Track voter for jury fee distribution
        marketVoters[marketId].push(msg.sender);

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

            // Resolve with proposed outcome
            market.resolved = true;
            market.outcome = market.proposedOutcome;

            // Return bond to proposer
            (bool success, ) = market.proposer.call{value: market.proposalBond}(
                ""
            );
            if (!success) revert TransferFailed();

            emit MarketResolved(marketId, market.outcome, false);
        } else if (status == MarketStatus.Disputed) {
            // Voting ended - determine winner
            if (block.timestamp <= market.disputeTime + VOTING_WINDOW) {
                revert VotingNotEnded();
            }

            // Check for tie (exact same votes = emergency refund scenario)
            if (market.yesVotes == market.noVotes) {
                // Tie: return all bonds and allow emergency refund
                _returnBondsOnTie(market);
                // Don't resolve - market stays stuck, emergency refund available
                return;
            }

            // Simple majority wins
            bool votedOutcome = market.yesVotes > market.noVotes;
            market.resolved = true;
            market.outcome = votedOutcome;

            // Determine who won the dispute
            bool proposerWins = (market.proposedOutcome == votedOutcome);

            // Distribute bonds
            _distributeBonds(marketId, market, proposerWins);

            emit MarketResolved(marketId, market.outcome, true);
        } else {
            revert MarketNotResolved();
        }
    }

    /**
     * @notice Internal function to return bonds when voting is a tie
     */
    function _returnBondsOnTie(Market storage market) internal {
        // Return proposer bond
        if (market.proposalBond > 0) {
            (bool success1, ) = market.proposer.call{
                value: market.proposalBond
            }("");
            if (!success1) revert TransferFailed();
            market.proposalBond = 0;
        }

        // Return disputer bond
        if (market.disputeBond > 0) {
            (bool success2, ) = market.disputer.call{value: market.disputeBond}(
                ""
            );
            if (!success2) revert TransferFailed();
            market.disputeBond = 0;
        }
    }

    /**
     * @notice Internal function to distribute bonds after voting
     * @dev 50% to winner (proposer or disputer), 50% to winning voters
     */
    function _distributeBonds(
        uint256 marketId,
        Market storage market,
        bool proposerWins
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

        // Pay winner
        uint256 winnerPayout = winnerBond + winnerShare;
        (bool success, ) = winner.call{value: winnerPayout}("");
        if (!success) revert TransferFailed();

        emit BondDistributed(marketId, winner, winnerPayout, voterPool);

        // Distribute voter pool to winning voters
        if (voterPool > 0) {
            _distributeJuryFees(marketId, market, voterPool);
        }

        // Clear bonds
        market.proposalBond = 0;
        market.disputeBond = 0;
    }

    /**
     * @notice Internal function to distribute jury fees to winning voters
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
            // No winning voters - send to treasury
            (bool success, ) = treasury.call{value: voterPool}("");
            if (!success) revert TransferFailed();
            return;
        }

        // Distribute proportionally to winning voters
        address[] storage voters = marketVoters[marketId];
        for (uint256 i = 0; i < voters.length; i++) {
            address voter = voters[i];
            Position storage pos = positions[marketId][voter];

            // Only pay winning voters
            if (pos.hasVoted && pos.votedOutcome == winningOutcome) {
                uint256 voterWeight = pos.yesShares + pos.noShares;
                uint256 voterShare = (voterPool * voterWeight) /
                    totalWinningVotes;

                if (voterShare > 0) {
                    (bool success, ) = voter.call{value: voterShare}("");
                    // Don't revert on failed transfer - continue to others
                    if (success) {
                        emit JuryFeeDistributed(marketId, voter, voterShare);
                    }
                }
            }
        }
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

        Position storage position = positions[marketId][msg.sender];
        if (position.emergencyRefunded) revert AlreadyEmergencyRefunded();

        uint256 userTotalShares = position.yesShares + position.noShares;
        if (userTotalShares == 0) revert NoPosition();

        // Calculate proportional refund
        uint256 totalShares = market.yesSupply + market.noSupply;
        refund = (userTotalShares * market.poolBalance) / totalShares;

        // Update state
        position.emergencyRefunded = true;

        // Transfer refund
        (bool success, ) = msg.sender.call{value: refund}("");
        if (!success) revert TransferFailed();

        emit EmergencyRefunded(marketId, msg.sender, refund);
    }

    // ============ View Functions ============

    /**
     * @notice Get current YES price based on bonding curve
     */
    function getYesPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return _getYesPrice(market.yesSupply, market.noSupply);
    }

    /**
     * @notice Get current NO price based on bonding curve
     */
    function getNoPrice(
        uint256 marketId
    ) external view returns (uint256 price) {
        Market storage market = markets[marketId];
        return _getNoPrice(market.yesSupply, market.noSupply);
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
                isYes
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
            isYes
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
            isYes
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
                isYes
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
                isYes
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
            string memory proofLink,
            uint256 proposalTime,
            uint256 proposalBond,
            uint256 disputeDeadline
        )
    {
        Market storage m = markets[marketId];
        return (
            m.proposer,
            m.proposedOutcome,
            m.proofLink,
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

    /**
     * @notice Get number of voters for a market
     */
    function getVoterCount(uint256 marketId) external view returns (uint256) {
        return marketVoters[marketId].length;
    }

    // ============ MultiSig Governance ============

    /**
     * @notice Propose a governance action (any signer can propose)
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

        if (action.confirmations >= 3) {
            _executeAction(actionId);
        }
    }

    /**
     * @notice Execute a fully confirmed action
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
        if (market.disputer != address(0)) return MarketStatus.Disputed;
        if (market.proposer != address(0)) return MarketStatus.Proposed;
        if (block.timestamp >= market.expiryTimestamp)
            return MarketStatus.Expired;
        return MarketStatus.Active;
    }

    function _getYesPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        return (UNIT_PRICE * virtualYes) / (virtualYes + virtualNo);
    }

    function _getNoPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        return (UNIT_PRICE * virtualNo) / (virtualYes + virtualNo);
    }

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
        bool isYes
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        uint256 totalVirtual = virtualYes + virtualNo;

        uint256 virtualSide = isYes ? virtualYes : virtualNo;

        uint256 priceBeforeSell = (UNIT_PRICE * virtualSide) / totalVirtual;

        uint256 virtualSideAfter = virtualSide - shares;
        uint256 totalVirtualAfter = totalVirtual - shares;

        uint256 priceAfterSell = (UNIT_PRICE * virtualSideAfter) /
            totalVirtualAfter;

        uint256 avgPrice = (priceBeforeSell + priceAfterSell) / 2;

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
        } else if (action.actionType == ActionType.SetCreatorFee) {
            uint256 newCreatorFee = abi.decode(action.data, (uint256));
            if (newCreatorFee > MAX_CREATOR_FEE_BPS) revert InvalidFee();
            creatorFeeBps = newCreatorFee;
        } else if (action.actionType == ActionType.SetResolutionFee) {
            uint256 newResolutionFee = abi.decode(action.data, (uint256));
            if (newResolutionFee > MAX_RESOLUTION_FEE_BPS) revert InvalidFee();
            resolutionFeeBps = newResolutionFee;
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
        }

        emit ActionExecuted(actionId, action.actionType);
    }

    /// @notice Receive BNB for bond payments
    receive() external payable {}
}
