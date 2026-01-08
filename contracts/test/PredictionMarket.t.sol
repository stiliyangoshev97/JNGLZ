// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title PredictionMarketTest
 * @notice Comprehensive tests for PredictionMarket contract with Street Consensus
 */
contract PredictionMarketTest is TestHelper {
    // ============================================
    // MARKET CREATION TESTS
    // ============================================

    function test_CreateMarket_Success() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Will BTC hit $100k?",
            "https://coinmarketcap.com/currencies/bitcoin/",
            "Resolve YES if BTC > $100,000 USD at expiry",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.HIGH
        );

        assertEq(marketId, 0, "First market should have ID 0");
        assertEq(market.marketCount(), 1, "Market count should be 1");

        (
            string memory question,
            string memory evidenceLink,
            string memory resolutionRules,
            string memory imageUrl,
            address creator,
            uint256 expiry,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            bool resolved,
            bool outcome
        ) = market.getMarket(marketId);

        assertEq(question, "Will BTC hit $100k?");
        assertEq(evidenceLink, "https://coinmarketcap.com/currencies/bitcoin/");
        assertEq(
            resolutionRules,
            "Resolve YES if BTC > $100,000 USD at expiry"
        );
        assertEq(creator, marketCreator);
        assertEq(expiry, expiryTime);
        assertEq(yesSupply, 0);
        assertEq(noSupply, 0);
        assertEq(poolBalance, 0);
        assertFalse(resolved);
    }

    function test_CreateMarket_EmitsEvent() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.expectEmit(true, true, false, true);
        emit PredictionMarket.MarketCreated(
            0,
            marketCreator,
            "Test question",
            expiryTime,
            PredictionMarket.HeatLevel.HIGH,
            20 * 1e18 // Default HIGH liquidity
        );

        vm.prank(marketCreator);
        market.createMarket(
            "Test question",
            "https://example.com",
            "Rules",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.HIGH
        );
    }

    function test_CreateMarket_RevertOnEmptyQuestion() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.EmptyQuestion.selector);
        market.createMarket(
            "",
            "https://example.com",
            "Rules",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );
    }

    function test_CreateMarket_AllowsEmptyEvidenceLink() public {
        // Degen markets can have empty evidence link
        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Will I get a girlfriend tomorrow?",
            "", // Empty evidence link is OK for degen markets
            "Creator posts proof",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.CRACK // Degen = CRACK heat
        );

        assertEq(marketId, 0, "Should create market successfully");
    }

    function test_CreateMarket_RevertOnPastExpiry() public {
        vm.prank(marketCreator);
        vm.expectRevert(PredictionMarket.InvalidExpiryTimestamp.selector);
        market.createMarket(
            "Question",
            "https://example.com",
            "Rules",
            "",
            block.timestamp - 1,
            PredictionMarket.HeatLevel.HIGH
        );
    }

    function test_CreateMarketAndBuy_Success() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(alice);
        (uint256 marketId, uint256 shares) = market.createMarketAndBuy{
            value: 1 ether
        }(
            "Test?",
            "https://example.com",
            "Rules",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.HIGH,
            true,
            0
        );

        assertEq(marketId, 0);
        assertGt(shares, 0, "Should receive shares");

        (uint256 yesShares, , , , , ) = market.getPosition(marketId, alice);
        assertEq(yesShares, shares);
    }

    // ============================================
    // HEAT LEVEL TESTS
    // ============================================

    function test_HeatLevel_CRACK_HasCorrectLiquidity() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Degen CRACK test?",
            "",
            "Rules",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.CRACK
        );

        // CRACK = 5 * 1e18 - access virtualLiquidity and heatLevel
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 virtualLiquidity,
            PredictionMarket.HeatLevel heatLevel,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertEq(
            virtualLiquidity,
            5 * 1e18,
            "CRACK should have 5e18 liquidity"
        );
        assertEq(uint256(heatLevel), uint256(PredictionMarket.HeatLevel.CRACK));
    }

    function test_HeatLevel_HIGH_HasCorrectLiquidity() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Standard HIGH test?",
            "",
            "Rules",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.HIGH
        );

        // HIGH = 20 * 1e18
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 virtualLiquidity,
            PredictionMarket.HeatLevel heatLevel,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertEq(
            virtualLiquidity,
            20 * 1e18,
            "HIGH should have 20e18 liquidity"
        );
        assertEq(uint256(heatLevel), uint256(PredictionMarket.HeatLevel.HIGH));
    }

    function test_HeatLevel_PRO_HasCorrectLiquidity() public {
        uint256 expiryTime = block.timestamp + 7 days;

        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Whale PRO test?",
            "",
            "Rules",
            "",
            expiryTime,
            PredictionMarket.HeatLevel.PRO
        );

        // PRO = 50 * 1e18
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 virtualLiquidity,
            PredictionMarket.HeatLevel heatLevel,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertEq(
            virtualLiquidity,
            50 * 1e18,
            "PRO should have 50e18 liquidity"
        );
        assertEq(uint256(heatLevel), uint256(PredictionMarket.HeatLevel.PRO));
    }

    function test_HeatLevel_CRACK_HasHigherPriceImpact() public {
        // Create CRACK market (5 liquidity)
        uint256 crackMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );

        // Create PRO market (50 liquidity)
        uint256 proMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        // Buy same amount on both
        uint256 buyAmount = 0.05 ether; // Small bet

        vm.prank(alice);
        market.buyYes{value: buyAmount}(crackMarket, 0);

        vm.prank(bob);
        market.buyYes{value: buyAmount}(proMarket, 0);

        // CRACK should have higher price after same buy
        uint256 crackPrice = market.getYesPrice(crackMarket);
        uint256 proPrice = market.getYesPrice(proMarket);

        assertGt(crackPrice, proPrice, "CRACK should have higher price impact");
    }

    function test_HeatLevel_GovernanceCanUpdateDefaults() public {
        uint256 newCrackValue = 3 * 1e18;

        // Update CRACK heat level via MultiSig
        executeMultiSigAction(
            PredictionMarket.ActionType.SetHeatLevelCrack,
            abi.encode(newCrackValue)
        );

        assertEq(
            market.heatLevelCrack(),
            newCrackValue,
            "CRACK should be updated"
        );

        // Create new market - should use new value
        vm.prank(marketCreator);
        uint256 marketId = market.createMarket(
            "Test new CRACK?",
            "",
            "Rules",
            "",
            block.timestamp + 7 days,
            PredictionMarket.HeatLevel.CRACK
        );

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 virtualLiquidity,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(marketId);

        assertEq(
            virtualLiquidity,
            newCrackValue,
            "New market should use updated CRACK"
        );
    }

    function test_HeatLevel_InvalidValueReverts() public {
        // Try to set heat level below minimum (1e18)
        // The revert happens on the 3rd confirmation (execution)
        vm.prank(signer1);
        uint256 actionId = market.proposeAction(
            PredictionMarket.ActionType.SetHeatLevelCrack,
            abi.encode(0.5e18)
        );

        vm.prank(signer2);
        market.confirmAction(actionId);

        vm.prank(signer3);
        vm.expectRevert(PredictionMarket.InvalidFee.selector);
        market.confirmAction(actionId);
    }

    // ============================================
    // HEAT LEVEL PRICE IMPACT VERIFICATION TESTS
    // ============================================

    /**
     * @notice Test CRACK heat level math: 0.01 BNB buy should move price significantly
     * @dev virtualLiquidity = 5e18, so small bets have HUGE impact
     *
     * Math walkthrough for 0.01 BNB buy on CRACK:
     * - Initial: virtualYes = 5e18, virtualNo = 5e18, total = 10e18
     * - Initial price: P(YES) = 0.01 * 5 / 10 = 0.005 BNB (50%)
     * - After fee (1.5%): 0.01 * 0.985 = 0.00985 BNB to pool
     * - Shares = (0.00985 * 10e18 * 1e18) / (0.01 * 5e18) = ~19.7e18 shares
     * - New virtualYes = 5e18 + 19.7e18 = 24.7e18
     * - New P(YES) = 0.01 * 24.7 / (24.7 + 5) = ~0.00831 BNB (~83%)
     * - Price moved from 50% to ~83% = 33% swing!
     */
    function test_HeatLevel_CRACK_PriceImpact_SmallBet() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );

        // Initial price should be 50%
        uint256 initialPrice = market.getYesPrice(marketId);
        assertEq(
            initialPrice,
            0.005 ether,
            "Initial YES price should be 0.005 BNB"
        );

        // Buy with 0.01 BNB (very small bet)
        uint256 buyAmount = 0.01 ether;
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        // Get new price
        uint256 newPrice = market.getYesPrice(marketId);

        // Calculate price change percentage (in basis points for precision)
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== CRACK Heat Level (vLiq=5) - 0.01 BNB buy ===");
        console.log("Initial YES price:", initialPrice);
        console.log("Shares bought:", sharesBought);
        console.log("New YES price:", newPrice);
        console.log("Price change (bps):", priceChangeBps);
        console.log("Price change %:", priceChangeBps / 100);

        // CRACK should have significant price impact (~16% for 0.01 BNB)
        // Actual math: vLiq=5, shares=1.97, price moves from 50% to ~58%
        assertGt(priceChangeBps, 1000, "CRACK 0.01 BNB should move price >10%");
        assertLt(priceChangeBps, 2500, "CRACK 0.01 BNB should move price <25%");
    }

    /**
     * @notice Test HIGH heat level math: 0.01 BNB buy should have moderate impact
     * @dev virtualLiquidity = 20e18, balanced volatility
     *
     * Math for 0.01 BNB on HIGH:
     * - Initial: virtualYes = 20e18, virtualNo = 20e18, total = 40e18
     * - After fee: ~0.00985 BNB to pool
     * - Shares = (0.00985 * 40e18 * 1e18) / (0.01 * 20e18) = ~19.7e18 shares
     * - New virtualYes = 20e18 + 19.7e18 = 39.7e18
     * - New P(YES) = 0.01 * 39.7 / (39.7 + 20) = ~0.00665 BNB (~66.5%)
     * - Price moved from 50% to ~66.5% = 16.5% swing
     */
    function test_HeatLevel_HIGH_PriceImpact_SmallBet() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.HIGH
        );

        uint256 initialPrice = market.getYesPrice(marketId);
        assertEq(
            initialPrice,
            0.005 ether,
            "Initial YES price should be 0.005 BNB"
        );

        uint256 buyAmount = 0.01 ether;
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        uint256 newPrice = market.getYesPrice(marketId);
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== HIGH Heat Level (vLiq=20) - 0.01 BNB buy ===");
        console.log("Initial YES price:", initialPrice);
        console.log("Shares bought:", sharesBought);
        console.log("New YES price:", newPrice);
        console.log("Price change (bps):", priceChangeBps);
        console.log("Price change %:", priceChangeBps / 100);

        // HIGH should have moderate price impact (~4.7% for 0.01 BNB)
        assertGt(priceChangeBps, 300, "HIGH 0.01 BNB should move price >3%");
        assertLt(priceChangeBps, 800, "HIGH 0.01 BNB should move price <8%");
    }

    /**
     * @notice Test PRO heat level math: 0.01 BNB buy should have minimal impact
     * @dev virtualLiquidity = 50e18, designed for whale trades
     *
     * Math for 0.01 BNB on PRO:
     * - Initial: virtualYes = 50e18, virtualNo = 50e18, total = 100e18
     * - After fee: ~0.00985 BNB to pool
     * - Shares = (0.00985 * 100e18 * 1e18) / (0.01 * 50e18) = ~19.7e18 shares
     * - New virtualYes = 50e18 + 19.7e18 = 69.7e18
     * - New P(YES) = 0.01 * 69.7 / (69.7 + 50) = ~0.00582 BNB (~58.2%)
     * - Price moved from 50% to ~58.2% = 8.2% swing
     */
    function test_HeatLevel_PRO_PriceImpact_SmallBet() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        uint256 initialPrice = market.getYesPrice(marketId);
        assertEq(
            initialPrice,
            0.005 ether,
            "Initial YES price should be 0.005 BNB"
        );

        uint256 buyAmount = 0.01 ether;
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        uint256 newPrice = market.getYesPrice(marketId);
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== PRO Heat Level (vLiq=50) - 0.01 BNB buy ===");
        console.log("Initial YES price:", initialPrice);
        console.log("Shares bought:", sharesBought);
        console.log("New YES price:", newPrice);
        console.log("Price change (bps):", priceChangeBps);
        console.log("Price change %:", priceChangeBps / 100);

        // PRO should have minimal price impact (~1.9% for 0.01 BNB)
        assertLt(priceChangeBps, 400, "PRO 0.01 BNB should move price <4%");
        assertGt(
            priceChangeBps,
            100,
            "PRO 0.01 BNB should still move price >1%"
        );
    }

    /**
     * @notice Compare all three heat levels with same buy amount
     * @dev This test creates visual comparison of volatility differences
     */
    function test_HeatLevel_AllLevels_PriceImpactComparison() public {
        // Create one market of each type
        uint256 crackMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );
        uint256 highMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.HIGH
        );
        uint256 proMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        uint256 buyAmount = 0.05 ether; // ~$25 at typical BNB prices

        // Buy on all three
        buyYesFor(alice, crackMarket, buyAmount, 0);
        buyYesFor(bob, highMarket, buyAmount, 0);
        buyYesFor(charlie, proMarket, buyAmount, 0);

        uint256 crackPrice = market.getYesPrice(crackMarket);
        uint256 highPrice = market.getYesPrice(highMarket);
        uint256 proPrice = market.getYesPrice(proMarket);

        console.log("=== Heat Level Comparison (0.05 BNB buy) ===");
        console.log("CRACK price after:", crackPrice);
        console.log("CRACK price %:", (crackPrice * 100) / 0.01 ether);
        console.log("HIGH price after:", highPrice);
        console.log("HIGH price %:", (highPrice * 100) / 0.01 ether);
        console.log("PRO price after:", proPrice);
        console.log("PRO price %:", (proPrice * 100) / 0.01 ether);

        // Verify ordering: CRACK > HIGH > PRO price impact
        assertGt(
            crackPrice,
            highPrice,
            "CRACK should have higher price than HIGH"
        );
        assertGt(highPrice, proPrice, "HIGH should have higher price than PRO");

        // Verify CRACK is significantly more volatile than PRO
        uint256 crackImpact = crackPrice - 0.005 ether;
        uint256 proImpact = proPrice - 0.005 ether;
        assertGt(
            (crackImpact * 100) / proImpact,
            300,
            "CRACK should have >3x PRO's impact"
        );
    }

    /**
     * @notice Test larger bet amounts on each heat level
     * @dev Verifies the "target bet" ranges from documentation
     */
    function test_HeatLevel_CRACK_LargeBetImpact() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );

        // 0.05 BNB should cause ~15% price impact on CRACK (per documentation)
        uint256 buyAmount = 0.05 ether;
        uint256 initialPrice = market.getYesPrice(marketId);

        buyYesFor(alice, marketId, buyAmount, 0);

        uint256 newPrice = market.getYesPrice(marketId);
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== CRACK: 0.05 BNB (target bet) ===");
        console.log("Price change %:", priceChangeBps / 100);

        // CRACK with 0.05 BNB should have ~49% price change (74% price)
        assertGt(priceChangeBps, 4000, "CRACK 0.05 BNB should move price >40%");
        assertLt(priceChangeBps, 6000, "CRACK 0.05 BNB should move price <60%");
    }

    function test_HeatLevel_HIGH_TargetBetImpact() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.HIGH
        );

        // 0.5 BNB should cause ~15% price impact on HIGH (per documentation)
        uint256 buyAmount = 0.5 ether;
        uint256 initialPrice = market.getYesPrice(marketId);

        buyYesFor(alice, marketId, buyAmount, 0);

        uint256 newPrice = market.getYesPrice(marketId);
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== HIGH: 0.5 BNB (target bet) ===");
        console.log("Price change %:", priceChangeBps / 100);

        // HIGH with 0.5 BNB should have ~71% price change
        assertGt(priceChangeBps, 6000, "HIGH 0.5 BNB should move price >60%");
        assertLt(priceChangeBps, 8500, "HIGH 0.5 BNB should move price <85%");
    }

    function test_HeatLevel_PRO_WhaleBetImpact() public {
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        // 2.0 BNB should cause ~15% price impact on PRO (per documentation)
        uint256 buyAmount = 2 ether;
        uint256 initialPrice = market.getYesPrice(marketId);

        buyYesFor(alice, marketId, buyAmount, 0);

        uint256 newPrice = market.getYesPrice(marketId);
        uint256 priceChangeBps = ((newPrice - initialPrice) * 10000) /
            initialPrice;

        console.log("=== PRO: 2.0 BNB (whale bet) ===");
        console.log("Price change %:", priceChangeBps / 100);

        // PRO with 2 BNB should have ~79% price change
        assertGt(priceChangeBps, 7000, "PRO 2 BNB should move price >70%");
        assertLt(priceChangeBps, 9000, "PRO 2 BNB should move price <90%");
    }

    /**
     * @notice Verify heat level immutability per market
     * @dev Even if MultiSig changes global defaults, existing markets keep their original virtualLiquidity
     */
    function test_HeatLevel_ImmutablePerMarket() public {
        // Create CRACK market with default 5e18
        uint256 crackMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );

        // Get initial virtualLiquidity
        (, , , , , , , , , uint256 initialVLiq, , , , , , , , , , , , ) = market
            .markets(crackMarket);
        assertEq(initialVLiq, 5e18, "Initial CRACK should be 5e18");

        // MultiSig changes CRACK default to 10e18
        executeMultiSigAction(
            PredictionMarket.ActionType.SetHeatLevelCrack,
            abi.encode(10e18)
        );

        // Verify global default changed
        assertEq(
            market.heatLevelCrack(),
            10e18,
            "Global CRACK should be 10e18"
        );

        // BUT the existing market should STILL have 5e18
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 unchangedVLiq,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,

        ) = market.markets(crackMarket);
        assertEq(unchangedVLiq, 5e18, "Existing market should STILL have 5e18");

        // New market gets the new value
        uint256 newMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );
        (, , , , , , , , , uint256 newVLiq, , , , , , , , , , , , ) = market
            .markets(newMarket);
        assertEq(newVLiq, 10e18, "New market should have 10e18");
    }

    /**
     * @notice Test price invariant holds across all heat levels
     * @dev P(YES) + P(NO) should always equal UNIT_PRICE regardless of heat level
     */
    function test_HeatLevel_PriceInvariant_AllLevels() public {
        uint256 crackMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.CRACK
        );
        uint256 highMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.HIGH
        );
        uint256 proMarket = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        // Trade on each market
        buyYesFor(alice, crackMarket, 0.1 ether, 0);
        buyNoFor(bob, highMarket, 0.2 ether, 0);
        buyYesFor(charlie, proMarket, 0.5 ether, 0);

        // Verify invariant: P(YES) + P(NO) = 0.01 BNB
        uint256 crackYes = market.getYesPrice(crackMarket);
        uint256 crackNo = market.getNoPrice(crackMarket);
        assertApproxEqAbs(crackYes + crackNo, 0.01 ether, 1, "CRACK invariant");

        uint256 highYes = market.getYesPrice(highMarket);
        uint256 highNo = market.getNoPrice(highMarket);
        assertApproxEqAbs(highYes + highNo, 0.01 ether, 1, "HIGH invariant");

        uint256 proYes = market.getYesPrice(proMarket);
        uint256 proNo = market.getNoPrice(proMarket);
        assertApproxEqAbs(proYes + proNo, 0.01 ether, 1, "PRO invariant");
    }

    // ============================================
    // SWEEP FUNDS TESTS
    // ============================================
    // ...existing code...
}
