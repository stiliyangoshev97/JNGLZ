// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/PredictionMarket.sol";

/**
 * @title TestHelper
 * @notice Base contract for all PredictionMarket tests
 * @dev Deploys the PredictionMarket contract for Street Consensus resolution
 */
contract TestHelper is Test {
    // ============================================
    // CONTRACTS
    // ============================================
    PredictionMarket public market;

    // ============================================
    // TEST ACCOUNTS
    // ============================================

    /// @notice MultiSig signers (3-of-3)
    address public signer1;
    address public signer2;
    address public signer3;

    /// @notice Platform treasury address
    address public treasury;

    /// @notice Test users
    address public alice;
    address public bob;
    address public charlie;
    address public marketCreator;
    address public proposer;
    address public disputer;

    // ============================================
    // CONSTANTS (matching contract defaults)
    // ============================================

    /// @notice Unit price: 0.01 BNB
    uint256 public constant UNIT_PRICE = 0.01 ether;

    /// @notice Virtual liquidity: 100 shares each side (scaled to 1e18)
    uint256 public constant VIRTUAL_LIQUIDITY = 100 * 1e18;

    /// @notice Default platform fee: 1% (100 basis points)
    uint256 public constant DEFAULT_FEE_BPS = 100;

    /// @notice Creator fee: 0.5% (50 basis points)
    uint256 public constant CREATOR_FEE_BPS = 50;

    /// @notice Total fee: platform + creator = 1.5% (150 basis points)
    uint256 public constant TOTAL_FEE_BPS = DEFAULT_FEE_BPS + CREATOR_FEE_BPS;

    /// @notice Resolution fee: 0.3% (30 basis points)
    uint256 public constant RESOLUTION_FEE_BPS = 30;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Default minimum bet: 0.005 BNB
    uint256 public constant DEFAULT_MIN_BET = 0.005 ether;

    /// @notice Action expiry time: 1 hour
    uint256 public constant ACTION_EXPIRY = 1 hours;

    /// @notice Creator priority window: 10 minutes
    uint256 public constant CREATOR_PRIORITY_WINDOW = 10 minutes;

    /// @notice Dispute window: 30 minutes
    uint256 public constant DISPUTE_WINDOW = 30 minutes;

    /// @notice Voting window: 1 hour
    uint256 public constant VOTING_WINDOW = 1 hours;

    /// @notice Minimum bond floor: 0.02 BNB
    uint256 public constant MIN_BOND_FLOOR = 0.02 ether;

    // ============================================
    // SETUP
    // ============================================

    /**
     * @notice Base setup - creates accounts and deploys all contracts
     */
    function setUp() public virtual {
        // Create test accounts with labels for easier debugging
        signer1 = makeAddr("signer1");
        signer2 = makeAddr("signer2");
        signer3 = makeAddr("signer3");
        treasury = makeAddr("treasury");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        marketCreator = makeAddr("marketCreator");
        proposer = makeAddr("proposer");
        disputer = makeAddr("disputer");

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(marketCreator, 100 ether);
        vm.deal(proposer, 100 ether);
        vm.deal(disputer, 100 ether);

        // Deploy PredictionMarket (Street Consensus - no UMA)
        market = new PredictionMarket([signer1, signer2, signer3], treasury);
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * @notice Create a test market with default parameters (HIGH heat level)
     * @param creator The address creating the market
     * @param expiryOffset How many seconds from now until expiry
     */
    function createTestMarket(
        address creator,
        uint256 expiryOffset
    ) internal returns (uint256 marketId) {
        vm.prank(creator);
        marketId = market.createMarket(
            "Will ETH be above $5000 by end of 2026?",
            "https://coinmarketcap.com/currencies/ethereum/",
            "Resolve YES if ETH price is above $5000 USD at 00:00 UTC on Jan 1, 2027 according to CoinMarketCap",
            "https://i.imgur.com/test.png", // imageUrl
            block.timestamp + expiryOffset,
            PredictionMarket.HeatLevel.HIGH // Default to HIGH heat level
        );
    }

    /**
     * @notice Create a test market with specific heat level
     * @param creator The address creating the market
     * @param expiryOffset How many seconds from now until expiry
     * @param heatLevel The heat level for market volatility
     */
    function createTestMarketWithHeatLevel(
        address creator,
        uint256 expiryOffset,
        PredictionMarket.HeatLevel heatLevel
    ) internal returns (uint256 marketId) {
        vm.prank(creator);
        marketId = market.createMarket(
            "Will ETH be above $5000 by end of 2026?",
            "https://coinmarketcap.com/currencies/ethereum/",
            "Resolve YES if ETH price is above $5000 USD at 00:00 UTC on Jan 1, 2027 according to CoinMarketCap",
            "https://i.imgur.com/test.png", // imageUrl
            block.timestamp + expiryOffset,
            heatLevel
        );
    }

    /**
     * @notice Create a degen market (no evidence link, CRACK heat level for max volatility)
     */
    function createDegenMarket(
        address creator,
        uint256 expiryOffset
    ) internal returns (uint256 marketId) {
        vm.prank(creator);
        marketId = market.createMarket(
            "Will I get a girlfriend tomorrow?",
            "", // No evidence link - full degen
            "Resolve YES if creator posts proof of girlfriend",
            "", // No image - full degen
            block.timestamp + expiryOffset,
            PredictionMarket.HeatLevel.CRACK // Degen markets use CRACK for max volatility
        );
    }

    /**
     * @notice Create a PRO market (high liquidity for whale bets)
     * @dev Use this for tests with large BNB amounts (1+ BNB)
     */
    function createProMarket(
        address creator,
        uint256 expiryOffset
    ) internal returns (uint256 marketId) {
        vm.prank(creator);
        marketId = market.createMarket(
            "Will BTC hit $100k by end of year?",
            "https://coinmarketcap.com/currencies/bitcoin/",
            "Resolve YES if BTC price > $100k USD at expiry",
            "https://i.imgur.com/btc.png",
            block.timestamp + expiryOffset,
            PredictionMarket.HeatLevel.PRO // PRO for large bets
        );
    }

    /**
     * @notice Execute a 3-of-3 MultiSig action
     * @param actionType The type of governance action
     * @param data ABI-encoded parameters
     */
    function executeMultiSigAction(
        PredictionMarket.ActionType actionType,
        bytes memory data
    ) internal returns (uint256 actionId) {
        // Signer1 proposes
        vm.prank(signer1);
        actionId = market.proposeAction(actionType, data);

        // Signer2 confirms
        vm.prank(signer2);
        market.confirmAction(actionId);

        // Signer3 confirms (auto-executes)
        vm.prank(signer3);
        market.confirmAction(actionId);
    }

    /**
     * @notice Buy YES shares for a user
     * @param user The buyer
     * @param marketId The market to buy in
     * @param bnbAmount Amount of BNB to spend
     * @param minSharesOut Minimum shares expected
     */
    function buyYesFor(
        address user,
        uint256 marketId,
        uint256 bnbAmount,
        uint256 minSharesOut
    ) internal returns (uint256 sharesOut) {
        vm.prank(user);
        sharesOut = market.buyYes{value: bnbAmount}(marketId, minSharesOut);
    }

    /**
     * @notice Buy NO shares for a user
     */
    function buyNoFor(
        address user,
        uint256 marketId,
        uint256 bnbAmount,
        uint256 minSharesOut
    ) internal returns (uint256 sharesOut) {
        vm.prank(user);
        sharesOut = market.buyNo{value: bnbAmount}(marketId, minSharesOut);
    }

    /**
     * @notice Sell YES shares for a user
     */
    function sellYesFor(
        address user,
        uint256 marketId,
        uint256 shares,
        uint256 minBnbOut
    ) internal returns (uint256 bnbOut) {
        vm.prank(user);
        bnbOut = market.sellYes(marketId, shares, minBnbOut);
    }

    /**
     * @notice Sell NO shares for a user
     */
    function sellNoFor(
        address user,
        uint256 marketId,
        uint256 shares,
        uint256 minBnbOut
    ) internal returns (uint256 bnbOut) {
        vm.prank(user);
        bnbOut = market.sellNo(marketId, shares, minBnbOut);
    }

    /**
     * @notice Fast forward time past market expiry
     */
    function expireMarket(uint256 marketId) internal {
        (, , , , , uint256 expiryTimestamp, , , , , ) = market.getMarket(
            marketId
        );
        vm.warp(expiryTimestamp + 1);
    }

    /**
     * @notice Fast forward past creator priority window
     */
    function skipCreatorPriority(uint256 marketId) internal {
        (, , , , , uint256 expiryTimestamp, , , , , ) = market.getMarket(
            marketId
        );
        vm.warp(expiryTimestamp + CREATOR_PRIORITY_WINDOW + 1);
    }

    /**
     * @notice Propose an outcome for a market
     * @param _proposer Who proposes
     * @param marketId The market
     * @param outcome Proposed outcome (true=YES, false=NO)
     */
    function proposeOutcomeFor(
        address _proposer,
        uint256 marketId,
        bool outcome
    ) internal {
        uint256 requiredBond = market.getRequiredBond(marketId);
        // Add 0.3% fee on top
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.prank(_proposer);
        market.proposeOutcome{value: totalRequired}(marketId, outcome);
    }

    /**
     * @notice Dispute a proposal
     * @param _disputer Who disputes
     * @param marketId The market
     */
    function disputeFor(address _disputer, uint256 marketId) internal {
        uint256 requiredDisputeBond = market.getRequiredDisputeBond(marketId);
        // Add 0.3% fee on top
        uint256 totalRequired = requiredDisputeBond +
            (requiredDisputeBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.prank(_disputer);
        market.dispute{value: totalRequired}(marketId);
    }

    /**
     * @notice Cast a vote
     * @param voter Who votes
     * @param marketId The market
     * @param outcome Vote for YES (true) or NO (false)
     */
    function voteFor(address voter, uint256 marketId, bool outcome) internal {
        vm.prank(voter);
        market.vote(marketId, outcome);
    }

    /**
     * @notice Complete resolution flow: propose, no dispute, finalize
     */
    function proposeAndFinalize(
        address _proposer,
        uint256 marketId,
        bool outcome
    ) internal {
        proposeOutcomeFor(_proposer, marketId, outcome);

        // Skip dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);
    }

    /**
     * @notice Complete disputed resolution flow: propose, dispute, vote, finalize
     */
    function proposeDisputeVoteFinalize(
        address _proposer,
        uint256 marketId,
        bool proposedOutcome,
        address _disputer,
        address[] memory yesVoters,
        address[] memory noVoters
    ) internal {
        // Propose
        proposeOutcomeFor(_proposer, marketId, proposedOutcome);

        // Dispute
        disputeFor(_disputer, marketId);

        // Vote
        for (uint256 i = 0; i < yesVoters.length; i++) {
            voteFor(yesVoters[i], marketId, true);
        }
        for (uint256 i = 0; i < noVoters.length; i++) {
            voteFor(noVoters[i], marketId, false);
        }

        // Skip voting window
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);
    }

    /**
     * @notice Assert outcome and resolve (replacement for old UMA flow)
     * @dev This is a simplified helper that proposes and finalizes without dispute
     * @param marketId The market to resolve
     * @param _proposer Who proposes the outcome
     * @param outcome The outcome to propose
     * @param skipCreator Whether to skip creator priority window (usually true in tests)
     */
    function assertAndResolve(
        uint256 marketId,
        address _proposer,
        bool outcome,
        bool skipCreator
    ) internal {
        if (skipCreator) {
            skipCreatorPriority(marketId);
        }
        proposeAndFinalize(_proposer, marketId, outcome);
    }

    /**
     * @notice Calculate expected YES price
     */
    function calculateYesPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        return (UNIT_PRICE * virtualYes) / (virtualYes + virtualNo);
    }

    /**
     * @notice Calculate expected NO price
     */
    function calculateNoPrice(
        uint256 yesSupply,
        uint256 noSupply
    ) internal pure returns (uint256) {
        uint256 virtualYes = yesSupply + VIRTUAL_LIQUIDITY;
        uint256 virtualNo = noSupply + VIRTUAL_LIQUIDITY;
        return (UNIT_PRICE * virtualNo) / (virtualYes + virtualNo);
    }
}
