// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title EmptyWinningSideTest
 * @notice Tests for v3.6.2 behavior: one-sided markets blocked at proposal time
 * @dev v3.6.2 - One-sided markets are now blocked at proposeOutcome() with OneSidedMarket()
 *
 * BEHAVIOR CHANGES from v3.4.0 to v3.6.2:
 * - v3.4.0: Allowed proposals on one-sided markets, handled at finalization
 * - v3.6.2: Blocks proposals on one-sided markets upfront with OneSidedMarket()
 *
 * REMAINING EDGE CASE:
 * - A two-sided market can still resolve to an empty side through voting
 * - If voting result picks a side that had all shares sold back
 * - This is handled by the existing finalizeMarket() safety check
 */
contract EmptyWinningSideTest is TestHelper {
    uint256 public marketId;

    function setUp() public override {
        super.setUp();

        // Create a market
        vm.prank(marketCreator);
        marketId = market.createMarket(
            "Will this test pass?",
            "https://example.com",
            "Test rules",
            "",
            block.timestamp + 1 days,
            PredictionMarket.HeatLevel.HIGH
        );
    }

    // ============================================
    // TEST 1: v3.6.2 - One-sided market (only YES) blocks proposal
    // ============================================

    function test_OneSidedMarket_OnlyYes_BlocksProposal() public {
        // Alice buys YES shares - she's the only holder
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Verify market has 0 NO supply
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertEq(noSupply, 0, "NO supply should be 0");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Get bond amount
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        // v3.6.2: Proposal should revert with OneSidedMarket
        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: totalRequired}(marketId, false);
    }

    // ============================================
    // TEST 2: v3.6.2 - One-sided market (only NO) blocks proposal
    // ============================================

    function test_OneSidedMarket_OnlyNo_BlocksProposal() public {
        // Alice buys NO shares - she's the only holder
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Verify market has 0 YES supply
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertEq(yesSupply, 0, "YES supply should be 0");
        assertGt(noSupply, 0, "NO supply should be > 0");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Get bond amount
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        // v3.6.2: Proposal should revert with OneSidedMarket
        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: totalRequired}(marketId, true);
    }

    // ============================================
    // TEST 3: DISPUTED CASE - Vote resolves to side that became empty
    // ============================================

    /**
     * @notice Edge case: Two-sided market where shares are sold back, then voting resolves to empty side
     * @dev This can still happen and is handled by finalizeMarket() safety check
     */
    function test_DisputedCase_VoteResolvesToEmptySide_ShouldNotResolve()
        public
    {
        // Create a two-sided market
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Bob buys NO (creates two-sided market)
        vm.deal(bob, 10 ether);
        vm.prank(bob);
        uint256 bobShares = market.buyNo{value: 1 ether}(marketId, 0);

        // Verify both sides have supply
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertGt(noSupply, 0, "NO supply should be > 0");

        // Bob sells all his NO shares (making NO side empty)
        vm.prank(bob);
        market.sellNo(marketId, bobShares, 0);

        // Verify NO is now empty
        (, , , , , , , noSupply, , , ) = market.getMarket(marketId);
        assertEq(noSupply, 0, "NO supply should be 0 after sell");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Note: At this point, proposing should fail because market is now one-sided
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: totalRequired}(marketId, true);
    }

    // ============================================
    // TEST 4: NORMAL CASE - Both sides have holders, should resolve normally
    // ============================================

    function test_NormalCase_BothSidesHaveHolders_ShouldResolve() public {
        // Alice buys YES
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Bob buys NO
        vm.deal(bob, 10 ether);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Verify both sides have supply
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertGt(noSupply, 0, "NO supply should be > 0");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Propose YES
        vm.deal(proposer, 10 ether);
        proposeOutcomeFor(proposer, marketId, true);

        // Skip dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Finalize
        market.finalizeMarket(marketId);

        // Market SHOULD be resolved
        (, , , , , , , , , bool resolved, bool outcome) = market.getMarket(
            marketId
        );
        assertTrue(resolved, "Market should be resolved normally");
        assertTrue(outcome, "Outcome should be YES");
    }

    // ============================================
    // TEST 5: Emergency refund available for one-sided markets
    // ============================================

    function test_EmergencyRefund_AvailableForOneSidedMarket() public {
        // Alice buys YES shares - she's the only holder
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Get market expiry time for later calculation
        (, , , , , uint256 expiryTimestamp, , , , , ) = market.getMarket(
            marketId
        );

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);

        // Cannot propose on one-sided market (v3.6.2)
        // So emergency refund is the only resolution path

        // Wait for emergency refund window (24h from expiry)
        vm.warp(expiryTimestamp + 24 hours + 1);

        // Alice should be able to emergency refund
        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(alice);
        market.emergencyRefund(marketId);

        uint256 aliceBalanceAfter = alice.balance;
        assertGt(
            aliceBalanceAfter,
            aliceBalanceBefore,
            "Alice should receive refund"
        );
    }

    // ============================================
    // TEST 6: No trades at all - blocks proposal
    // ============================================

    function test_NoTrades_BlocksProposal() public {
        // No trades made - market has 0 supply on both sides

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Get bond amount
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        // v3.6.2: Proposal should revert with OneSidedMarket (both sides are 0)
        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        vm.expectRevert(PredictionMarket.OneSidedMarket.selector);
        market.proposeOutcome{value: totalRequired}(marketId, true);
    }
}
