// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title EmptyWinningSideTest
 * @notice Tests for the critical vulnerability fix: proposing resolution to empty side
 * @dev v3.4.0 - Prevents funds from being locked forever when winning side has 0 holders
 *
 * VULNERABILITY (FIXED):
 * - Someone proposes resolution to YES when only NO holders exist
 * - Nobody disputes (why would NO holders dispute? They'd lose their own money!)
 * - Market resolves to YES -> Division by zero -> Funds locked forever
 *
 * FIX:
 * - In finalizeMarket(), check if winning side has 0 supply
 * - If so, return bonds and DON'T resolve
 * - Emit MarketResolutionFailed event
 * - Market stays unresolved -> Emergency refund available after 24h
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
    // TEST 1: PROPOSED CASE - Only YES holders, propose NO
    // ============================================

    function test_ProposedCase_OnlyYesHolders_ProposeNo_ShouldNotResolve()
        public
    {
        // Alice buys YES shares - she's the only holder
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Verify Alice has YES shares
        (uint256 aliceYes, uint256 aliceNo, , , , ) = market.getPosition(
            marketId,
            alice
        );
        assertGt(aliceYes, 0, "Alice should have YES shares");
        assertEq(aliceNo, 0, "Alice should have no NO shares");

        // Verify market has 0 NO supply
        (
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 yesSupply,
            uint256 noSupply,
            uint256 poolBalance,
            ,

        ) = market.getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertEq(noSupply, 0, "NO supply should be 0");
        assertGt(poolBalance, 0, "Pool should have funds");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Get bond amount using helper function
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        // Evil proposer proposes NO (empty side)
        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        market.proposeOutcome{value: totalRequired}(marketId, false);

        // Skip dispute window (30 minutes)
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Record pending withdrawals before (Pull Pattern v3.4.1)
        uint256 proposerPendingBefore = market.getPendingWithdrawal(proposer);

        // Anyone finalizes the market
        vm.prank(bob);
        market.finalizeMarket(marketId);

        // Market should NOT be resolved (safety check triggered)
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertFalse(
            resolved,
            "Market should NOT be resolved - empty winning side!"
        );

        // Proposer should get bond credited to pendingWithdrawals (Pull Pattern)
        uint256 proposerPendingAfter = market.getPendingWithdrawal(proposer);
        assertGt(
            proposerPendingAfter,
            proposerPendingBefore,
            "Proposer should get bond credited to pendingWithdrawals"
        );

        // Verify withdrawal works
        uint256 proposerBalanceBefore = proposer.balance;
        vm.prank(proposer);
        market.withdrawBond();
        assertGt(
            proposer.balance,
            proposerBalanceBefore,
            "Proposer should be able to withdraw bond"
        );

        // Pool should still have funds for emergency refund
        (, , , , , , , , uint256 poolAfter, , ) = market.getMarket(marketId);
        assertEq(poolAfter, poolBalance, "Pool balance should be unchanged");
    }

    // ============================================
    // TEST 2: PROPOSED CASE - Only NO holders, propose YES
    // ============================================

    function test_ProposedCase_OnlyNoHolders_ProposeYes_ShouldNotResolve()
        public
    {
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

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Get bond amount
        uint256 requiredBond = market.getRequiredBond(marketId);
        uint256 totalRequired = requiredBond +
            (requiredBond * RESOLUTION_FEE_BPS) /
            (BPS_DENOMINATOR - RESOLUTION_FEE_BPS) +
            1;

        // Evil proposer proposes YES (empty side)
        vm.deal(proposer, totalRequired);
        vm.prank(proposer);
        market.proposeOutcome{value: totalRequired}(marketId, true);

        // Skip dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Finalize
        vm.prank(bob);
        market.finalizeMarket(marketId);

        // Market should NOT be resolved
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertFalse(
            resolved,
            "Market should NOT be resolved - empty winning side!"
        );
    }

    // ============================================
    // TEST 3: DISPUTED CASE - Vote resolves to empty side
    // ============================================

    function test_DisputedCase_VoteResolvesToEmptySide_ShouldNotResolve()
        public
    {
        // Alice buys YES shares
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Verify only YES supply
        (, , , , , , uint256 yesSupply, uint256 noSupply, , , ) = market
            .getMarket(marketId);
        assertGt(yesSupply, 0, "YES supply should be > 0");
        assertEq(noSupply, 0, "NO supply should be 0");

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Someone proposes YES (correct - has holders)
        vm.deal(proposer, 10 ether);
        proposeOutcomeFor(proposer, marketId, true);

        // Disputer disputes (wants NO)
        vm.deal(disputer, 10 ether);
        disputeFor(disputer, marketId);

        // Alice votes NO (against her own interest - weird but possible)
        // This is the edge case - YES holder votes for NO to resolve
        vm.prank(alice);
        market.vote(marketId, false);

        // Skip voting window
        vm.warp(block.timestamp + VOTING_WINDOW + 1);

        // Record pending withdrawals before (Pull Pattern v3.4.0)
        uint256 proposerPendingBefore = market.getPendingWithdrawal(proposer);
        uint256 disputerPendingBefore = market.getPendingWithdrawal(disputer);

        // Finalize - vote result is NO, but NO supply is 0!
        vm.prank(bob);
        market.finalizeMarket(marketId);

        // Market should NOT be resolved
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertFalse(
            resolved,
            "Market should NOT be resolved - empty winning side after vote!"
        );

        // Both bonds should be credited to pendingWithdrawals (like a tie)
        uint256 proposerPendingAfter = market.getPendingWithdrawal(proposer);
        uint256 disputerPendingAfter = market.getPendingWithdrawal(disputer);
        assertGt(
            proposerPendingAfter,
            proposerPendingBefore,
            "Proposer should get bond back"
        );
        assertGt(
            disputerPendingAfter,
            disputerPendingBefore,
            "Disputer should get bond back"
        );

        // Verify withdrawals work
        uint256 proposerBalanceBefore = proposer.balance;
        vm.prank(proposer);
        market.withdrawBond();
        assertEq(
            proposer.balance,
            proposerBalanceBefore + proposerPendingAfter,
            "Proposer should receive withdrawal"
        );

        uint256 disputerBalanceBefore = disputer.balance;
        vm.prank(disputer);
        market.withdrawBond();
        assertEq(
            disputer.balance,
            disputerBalanceBefore + disputerPendingAfter,
            "Disputer should receive withdrawal"
        );
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
    // TEST 5: Emergency refund available after failed resolution
    // ============================================

    function test_EmergencyRefund_AvailableAfterFailedResolution() public {
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

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Evil proposer proposes NO (empty side)
        vm.deal(proposer, 10 ether);
        proposeOutcomeFor(proposer, marketId, false);

        // Skip dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Finalize - should fail to resolve
        market.finalizeMarket(marketId);

        // Market not resolved
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertFalse(resolved, "Market should not be resolved");

        // Wait for emergency refund window (24h from ORIGINAL expiry)
        // Use absolute timestamp to avoid warp issues
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
    // TEST 6: Event emission on failed resolution
    // ============================================

    function test_MarketResolutionFailed_EventEmitted() public {
        // Alice buys YES shares
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Market expires
        vm.warp(block.timestamp + 1 days + 1);

        // Wait for creator priority window
        vm.warp(block.timestamp + CREATOR_PRIORITY_WINDOW + 1);

        // Propose NO (empty side)
        vm.deal(proposer, 10 ether);
        proposeOutcomeFor(proposer, marketId, false);

        // Skip dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        // Expect MarketResolutionFailed event
        vm.expectEmit(true, false, false, true);
        emit PredictionMarket.MarketResolutionFailed(
            marketId,
            "No holders on winning side"
        );

        // Finalize
        market.finalizeMarket(marketId);
    }
}
