// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../../src/PredictionMarket.sol";

/**
 * @title TestHelper
 * @notice Base contract for all PredictionMarket tests
 * @dev Deploys the PredictionMarket contract with mock UMA and WBNB
 */
contract TestHelper is Test {
    // ============================================
    // CONTRACTS
    // ============================================
    PredictionMarket public market;
    MockWBNB public wbnb;
    MockUmaOOv3 public umaOOv3;

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

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice Default minimum bet: 0.005 BNB
    uint256 public constant DEFAULT_MIN_BET = 0.005 ether;

    /// @notice Default UMA bond: 0.1 BNB
    uint256 public constant DEFAULT_UMA_BOND = 0.1 ether;

    /// @notice Action expiry time: 1 hour
    uint256 public constant ACTION_EXPIRY = 1 hours;

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

        // Fund test accounts
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);
        vm.deal(marketCreator, 100 ether);

        // Deploy mock contracts
        wbnb = new MockWBNB();
        umaOOv3 = new MockUmaOOv3();

        // Deploy PredictionMarket
        market = new PredictionMarket(
            [signer1, signer2, signer3],
            treasury,
            address(wbnb),
            address(umaOOv3)
        );

        // Set the market address in mock UMA for callbacks
        umaOOv3.setMarket(address(market));
    }

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * @notice Create a test market with default parameters
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
            block.timestamp + expiryOffset
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
        (, , , , uint256 expiryTimestamp, , , , , , , ) = market.getMarket(
            marketId
        );
        vm.warp(expiryTimestamp + 1);
    }

    /**
     * @notice Setup WBNB for assertion
     * @param user User who will assert
     * @param amount Bond amount
     */
    function setupWbnbForAssertion(address user, uint256 amount) internal {
        // Give user WBNB
        wbnb.mint(user, amount);

        // Approve market to spend WBNB
        vm.prank(user);
        wbnb.approve(address(market), amount);
    }

    /**
     * @notice Assert and resolve a market (simulates UMA flow)
     * @param marketId The market to resolve
     * @param asserter Who asserts the outcome
     * @param outcome The asserted outcome
     * @param truthful Whether UMA considers it truthful
     */
    function assertAndResolve(
        uint256 marketId,
        address asserter,
        bool outcome,
        bool truthful
    ) internal {
        // Setup WBNB for assertion
        setupWbnbForAssertion(asserter, DEFAULT_UMA_BOND);

        // Assert outcome
        vm.prank(asserter);
        bytes32 assertionId = market.assertOutcome(marketId, outcome);

        // UMA callback (resolve)
        umaOOv3.resolveAssertion(assertionId, truthful);
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
        return (UNIT_PRICE * virtualNo) / (virtualYes + virtualNo);
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
        return (UNIT_PRICE * virtualYes) / (virtualYes + virtualNo);
    }
}

// ============================================
// MOCK CONTRACTS
// ============================================

/**
 * @title MockWBNB
 * @notice Simple mock for WBNB (ERC20-like)
 */
contract MockWBNB {
    string public name = "Wrapped BNB";
    string public symbol = "WBNB";
    uint8 public decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(
            allowance[from][msg.sender] >= amount,
            "Insufficient allowance"
        );

        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

/**
 * @title MockUmaOOv3
 * @notice Mock UMA Optimistic Oracle V3 for testing
 */
contract MockUmaOOv3 {
    address public market;
    uint256 public assertionCounter;

    mapping(bytes32 => address) public asserters;
    mapping(bytes32 => bool) public resolved;

    function setMarket(address _market) external {
        market = _market;
    }

    function assertTruthWithDefaults(
        bytes memory /* claim */,
        address asserter
    ) external returns (bytes32 assertionId) {
        assertionCounter++;
        assertionId = bytes32(assertionCounter);
        asserters[assertionId] = asserter;
        return assertionId;
    }

    /**
     * @notice Manually resolve an assertion (simulates UMA dispute period completion)
     * @param assertionId The assertion to resolve
     * @param truthful Whether the assertion was truthful
     */
    function resolveAssertion(bytes32 assertionId, bool truthful) external {
        require(!resolved[assertionId], "Already resolved");
        resolved[assertionId] = true;

        // Call back to the market contract
        PredictionMarket(market).assertionResolvedCallback(
            assertionId,
            truthful
        );
    }
}
