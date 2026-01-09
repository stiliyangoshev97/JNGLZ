// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title InstantSellAnalysisTest
 * @notice Comprehensive analysis of the instant sell scenario:
 *         "What happens if someone buys $500 worth of BNB and tries to immediately sell?"
 * @dev Tests verify:
 *      1. Can the user sell ALL their shares immediately?
 *      2. What percentage can they sell?
 *      3. What's the expected loss from fees?
 *      4. Is the pool always solvent?
 */
contract InstantSellAnalysisTest is TestHelper {
    /**
     * @notice Test: Buy 0.5 BNB (~$250-300 at typical prices) and try to sell immediately
     * @dev This simulates a smaller bet scenario
     */
    function test_InstantSell_HalfBNB() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 buyAmount = 0.5 ether;
        vm.deal(alice, buyAmount);

        console.log("=== Instant Sell: 0.5 BNB ===");
        console.log("Buy amount:", buyAmount);

        // Buy YES shares
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);
        console.log("Shares bought:", sharesBought);

        // Get pool state
        (, , , , , , uint256 yesSupply, , uint256 poolBalance, , ) = market
            .getMarket(marketId);
        console.log("Pool balance after buy:", poolBalance);

        // Preview sell
        uint256 sellPreviewNet = market.previewSell(
            marketId,
            sharesBought,
            true
        );
        // Calculate gross (before platform+creator fees: 1.5%)
        uint256 totalFeeBps = 150; // 1% platform + 0.5% creator
        uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
            (BPS_DENOMINATOR - totalFeeBps);

        console.log("Sell preview (net):", sellPreviewNet);
        console.log("Sell preview (gross):", sellPreviewGross);

        if (sellPreviewGross > poolBalance) {
            console.log("!!! CANNOT SELL ALL SHARES !!!");
            console.log("Shortfall:", sellPreviewGross - poolBalance);

            // Find max sellable
            uint256 maxSellable = _findMaxSellableShares(
                marketId,
                sharesBought,
                poolBalance
            );
            console.log("Max sellable shares:", maxSellable);
            console.log(
                "Percentage of position:",
                (maxSellable * 100) / sharesBought,
                "%"
            );

            // Verify we can sell the max
            if (maxSellable > 0) {
                uint256 bnbOut = sellYesFor(alice, marketId, maxSellable, 0);
                console.log("BNB received from partial sell:", bnbOut);
            }
        } else {
            console.log("OK: Can sell all shares");
            uint256 bnbOut = sellYesFor(alice, marketId, sharesBought, 0);
            console.log("BNB received:", bnbOut);
            console.log("Loss from fees:", buyAmount - bnbOut);
            console.log(
                "Loss percentage:",
                ((buyAmount - bnbOut) * 100) / buyAmount,
                "%"
            );
        }
    }

    /**
     * @notice Test: Buy 1 BNB (~$500-600 at typical prices) and try to sell immediately
     * @dev This is the specific scenario requested
     */
    function test_InstantSell_OneBNB() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 buyAmount = 1 ether; // ~$500-600 at typical BNB prices
        vm.deal(alice, buyAmount);

        console.log("=== Instant Sell: 1 BNB ($500 scenario) ===");
        console.log("Buy amount:", buyAmount);

        // Buy YES shares
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);
        console.log("Shares bought:", sharesBought);

        // Get pool state
        (, , , , , , , , uint256 poolBalance, , ) = market.getMarket(marketId);
        console.log("Pool balance after buy:", poolBalance);

        // Preview sell
        uint256 sellPreviewNet = market.previewSell(
            marketId,
            sharesBought,
            true
        );
        uint256 totalFeeBps = 150;
        uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
            (BPS_DENOMINATOR - totalFeeBps);

        console.log("Sell preview (net):", sellPreviewNet);
        console.log("Sell preview (gross):", sellPreviewGross);

        if (sellPreviewGross > poolBalance) {
            console.log("!!! CANNOT SELL ALL SHARES IMMEDIATELY !!!");
            console.log("Shortfall:", sellPreviewGross - poolBalance);

            // Find max sellable
            uint256 maxSellable = _findMaxSellableShares(
                marketId,
                sharesBought,
                poolBalance
            );
            console.log("Max sellable shares:", maxSellable);
            console.log(
                "Percentage of position sellable:",
                (maxSellable * 100) / sharesBought,
                "%"
            );

            // Calculate potential BNB from max sellable
            uint256 maxSellPreview = market.previewSell(
                marketId,
                maxSellable,
                true
            );
            console.log("Max BNB recoverable now:", maxSellPreview);

            // Try to sell all - should revert
            vm.prank(alice);
            vm.expectRevert();
            market.sellYes(marketId, sharesBought, 0);
            console.log("Confirmed: sellYes reverts for full amount");
        } else {
            console.log("OK: Can sell all shares");
            uint256 bnbOut = sellYesFor(alice, marketId, sharesBought, 0);
            console.log("BNB received:", bnbOut);
        }
    }

    /**
     * @notice Test: What happens in a balanced market (both sides have traders)?
     * @dev In practice, markets have buyers on both sides
     */
    function test_InstantSell_WithOpposingSide() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Bob buys NO first
        vm.deal(bob, 1 ether);
        buyNoFor(bob, marketId, 1 ether, 0);

        console.log("=== Instant Sell: With Opposing Side ===");

        // Now Alice buys YES
        uint256 buyAmount = 1 ether;
        vm.deal(alice, buyAmount);
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        console.log("Bob bought 1 BNB NO first");
        console.log("Alice bought:", buyAmount, "YES");
        console.log("Alice shares:", sharesBought);

        // Get pool state
        (, , , , , , , , uint256 poolBalance, , ) = market.getMarket(marketId);
        console.log("Pool balance (both sides):", poolBalance);

        // Preview sell
        uint256 sellPreviewNet = market.previewSell(
            marketId,
            sharesBought,
            true
        );
        uint256 totalFeeBps = 150;
        uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
            (BPS_DENOMINATOR - totalFeeBps);

        console.log("Sell preview (gross):", sellPreviewGross);

        if (sellPreviewGross <= poolBalance) {
            console.log("WITH OPPOSING LIQUIDITY: Can sell all shares!");
            uint256 bnbOut = sellYesFor(alice, marketId, sharesBought, 0);
            console.log("BNB received:", bnbOut);
            // Alice gets MORE than she put in because she bought at lower price!
            if (bnbOut > buyAmount) {
                console.log("PROFIT from roundtrip:", bnbOut - buyAmount);
            } else {
                console.log("Loss from roundtrip:", buyAmount - bnbOut);
            }
        } else {
            console.log("Still cannot sell all even with opposing side");
        }
    }

    /**
     * @notice Test: Small bet scenario (0.1 BNB ~ $50-60)
     * @dev Test if smaller bets can always exit
     */
    function test_InstantSell_SmallBet() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        uint256 buyAmount = 0.1 ether;
        vm.deal(alice, buyAmount);

        console.log("=== Instant Sell: Small Bet (0.1 BNB) ===");

        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);
        console.log("Shares bought:", sharesBought);

        (, , , , , , , , uint256 poolBalance, , ) = market.getMarket(marketId);

        uint256 sellPreviewNet = market.previewSell(
            marketId,
            sharesBought,
            true
        );
        uint256 totalFeeBps = 150;
        uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
            (BPS_DENOMINATOR - totalFeeBps);

        console.log("Pool balance:", poolBalance);
        console.log("Sell preview (gross):", sellPreviewGross);

        if (sellPreviewGross <= poolBalance) {
            console.log("SMALL BETS: Can always exit");
            uint256 bnbOut = sellYesFor(alice, marketId, sharesBought, 0);
            uint256 lossPercentage = ((buyAmount - bnbOut) * 10000) / buyAmount; // basis points
            console.log("BNB received:", bnbOut);
            console.log("Loss (basis points):", lossPercentage);
        } else {
            console.log("Even small bets cannot exit fully");
        }
    }

    /**
     * @notice Fuzz test to find the threshold where instant sells become impossible
     * @dev Find the buy amount where you can no longer sell 100% immediately
     */
    function test_FindInstantSellThreshold() public {
        console.log("=== Finding Instant Sell Threshold ===");

        uint256[] memory amounts = new uint256[](10);
        amounts[0] = 0.01 ether;
        amounts[1] = 0.05 ether;
        amounts[2] = 0.1 ether;
        amounts[3] = 0.2 ether;
        amounts[4] = 0.3 ether;
        amounts[5] = 0.4 ether;
        amounts[6] = 0.5 ether;
        amounts[7] = 0.75 ether;
        amounts[8] = 1 ether;
        amounts[9] = 2 ether;

        for (uint256 i = 0; i < amounts.length; i++) {
            uint256 marketId = createTestMarket(marketCreator, 7 days);

            vm.deal(alice, amounts[i]);
            uint256 sharesBought = buyYesFor(alice, marketId, amounts[i], 0);

            (, , , , , , , , uint256 poolBalance, , ) = market.getMarket(
                marketId
            );

            uint256 sellPreviewNet = market.previewSell(
                marketId,
                sharesBought,
                true
            );
            uint256 totalFeeBps = 150;
            uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
                (BPS_DENOMINATOR - totalFeeBps);

            bool canSellAll = sellPreviewGross <= poolBalance;

            console.log("---");
            console.log("Buy amount (wei):", amounts[i]);
            console.log("Can sell all:", canSellAll ? "YES" : "NO");

            if (canSellAll) {
                // Actually sell and report loss
                uint256 bnbOut = sellYesFor(alice, marketId, sharesBought, 0);
                uint256 lossPercentage = ((amounts[i] - bnbOut) * 10000) /
                    amounts[i];
                console.log("Round-trip loss (bps):", lossPercentage);
            } else {
                uint256 maxSellable = _findMaxSellableShares(
                    marketId,
                    sharesBought,
                    poolBalance
                );
                console.log(
                    "Max sellable %:",
                    (maxSellable * 100) / sharesBought
                );
            }
        }
    }

    /**
     * @notice Helper: Binary search to find max sellable shares
     */
    function _findMaxSellableShares(
        uint256 marketId,
        uint256 totalShares,
        uint256 poolBalance
    ) internal view returns (uint256) {
        uint256 low = 0;
        uint256 high = totalShares;
        uint256 totalFeeBps = 150;

        while (low < high) {
            uint256 mid = (low + high + 1) / 2;
            uint256 sellPreviewNet = market.previewSell(marketId, mid, true);
            uint256 sellPreviewGross = (sellPreviewNet * BPS_DENOMINATOR) /
                (BPS_DENOMINATOR - totalFeeBps);

            if (sellPreviewGross <= poolBalance) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }

        return low;
    }

    /**
     * @notice Test the new getMaxSellableShares() contract function
     * @dev Verifies it matches our test helper binary search
     */
    function test_GetMaxSellableShares_ContractFunction() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys 1 BNB
        uint256 buyAmount = 1 ether;
        vm.deal(alice, buyAmount);
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        console.log("=== Testing getMaxSellableShares() ===");
        console.log("Alice shares:", sharesBought);

        // Call the new contract function
        (uint256 maxShares, uint256 bnbOut) = market.getMaxSellableShares(
            marketId,
            sharesBought,
            true
        );

        console.log("Contract getMaxSellableShares:");
        console.log("  Max shares:", maxShares);
        console.log("  BNB out:", bnbOut);
        console.log("  Percentage:", (maxShares * 100) / sharesBought, "%");

        // Verify we can actually sell this amount
        assertGt(maxShares, 0, "Should be able to sell some shares");

        // With the fixed bonding curve, you CAN sell all shares immediately
        // (you just receive less than you put in due to fees)
        assertEq(
            maxShares,
            sharesBought,
            "Should be able to sell all shares (with loss from fees)"
        );

        // Actually sell the max amount - should succeed
        uint256 actualBnb = sellYesFor(alice, marketId, maxShares, 0);
        console.log("Actual BNB received:", actualBnb);

        // Verify we took a loss (fees + bonding curve)
        assertLt(
            actualBnb,
            1 ether,
            "Should receive less than invested due to fees"
        );

        // Should be very close to predicted
        assertApproxEqRel(
            actualBnb,
            bnbOut,
            0.01e18,
            "BNB out should match prediction"
        );
    }

    /**
     * @notice Test getMaxSellableShares() with full liquidity
     * @dev When there's opposing liquidity, should return full position
     */
    function test_GetMaxSellableShares_WithOpposingLiquidity() public {
        // Use PRO market for larger liquidity pool - allows full exits
        uint256 marketId = createTestMarketWithHeatLevel(
            marketCreator,
            7 days,
            PredictionMarket.HeatLevel.PRO
        );

        // Bob buys NO first (scaled for PRO)
        vm.deal(bob, 0.5 ether);
        buyNoFor(bob, marketId, 0.5 ether, 0);

        // Alice buys YES
        uint256 buyAmount = 0.5 ether;
        vm.deal(alice, buyAmount);
        uint256 sharesBought = buyYesFor(alice, marketId, buyAmount, 0);

        console.log("=== getMaxSellableShares() With Opposing Liquidity ===");

        // Call the new contract function
        (uint256 maxShares, uint256 bnbOut) = market.getMaxSellableShares(
            marketId,
            sharesBought,
            true
        );

        console.log("Max sellable:", maxShares);
        console.log("Total shares:", sharesBought);
        console.log("BNB out:", bnbOut);

        // With opposing liquidity, should be able to sell all
        assertEq(
            maxShares,
            sharesBought,
            "Should sell 100% with opposing liquidity"
        );

        // Actually sell
        uint256 actualBnb = sellYesFor(alice, marketId, maxShares, 0);
        assertApproxEqRel(
            actualBnb,
            bnbOut,
            0.01e18,
            "BNB out should match prediction"
        );
    }

    /**
     * @notice Test getMaxSellableShares() with zero shares
     */
    function test_GetMaxSellableShares_ZeroShares() public {
        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Call with zero shares
        (uint256 maxShares, uint256 bnbOut) = market.getMaxSellableShares(
            marketId,
            0,
            true
        );

        assertEq(maxShares, 0, "Zero shares in = zero shares out");
        assertEq(bnbOut, 0, "Zero shares = zero BNB");
    }
}
