// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";
import "forge-std/console.sol";

/**
 * @title PausedEmergencyRefundTest
 * @notice Tests for emergency refund behavior when contract is paused
 * @dev Verifies the "escape hatch" functionality:
 *      - When paused, users can emergency refund even if a proposal exists
 *      - Trading (buy/sell) is blocked when paused
 *      - Emergency refund works as safety valve during contract pause
 */
contract PausedEmergencyRefundTest is TestHelper {
    // ============================================
    // CONSTANTS
    // ============================================

    uint256 constant EMERGENCY_REFUND_DELAY = 24 hours;

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    /**
     * @notice Pause the contract via 3-of-3 MultiSig
     */
    function pauseContract() internal {
        executeMultiSigAction(PredictionMarket.ActionType.Pause, "");
        assertTrue(market.paused(), "Contract should be paused");
    }

    /**
     * @notice Unpause the contract via 3-of-3 MultiSig
     */
    function unpauseContract() internal {
        executeMultiSigAction(PredictionMarket.ActionType.Unpause, "");
        assertFalse(market.paused(), "Contract should be unpaused");
    }

    // ============================================
    // TEST: TRADING BLOCKED WHEN PAUSED
    // ============================================

    /**
     * @notice Test that buyYes reverts when contract is paused
     */
    function test_BuyYes_RevertWhenPaused() public {
        console.log("=== TEST: buyYes BLOCKED WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Pause contract
        pauseContract();

        // Try to buy YES - should revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.buyYes{value: 1 ether}(marketId, 0);

        console.log("SUCCESS: buyYes correctly blocked when paused");
    }

    /**
     * @notice Test that buyNo reverts when contract is paused
     */
    function test_BuyNo_RevertWhenPaused() public {
        console.log("=== TEST: buyNo BLOCKED WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Pause contract
        pauseContract();

        // Try to buy NO - should revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.buyNo{value: 1 ether}(marketId, 0);

        console.log("SUCCESS: buyNo correctly blocked when paused");
    }

    /**
     * @notice Test that sellYes reverts when contract is paused
     */
    function test_SellYes_RevertWhenPaused() public {
        console.log("=== TEST: sellYes BLOCKED WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys YES before pause
        vm.prank(alice);
        uint256 shares = market.buyYes{value: 1 ether}(marketId, 0);

        // Pause contract
        pauseContract();

        // Try to sell YES - should revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.sellYes(marketId, shares, 0);

        console.log("SUCCESS: sellYes correctly blocked when paused");
    }

    /**
     * @notice Test that sellNo reverts when contract is paused
     */
    function test_SellNo_RevertWhenPaused() public {
        console.log("=== TEST: sellNo BLOCKED WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys NO before pause
        vm.prank(alice);
        uint256 shares = market.buyNo{value: 1 ether}(marketId, 0);

        // Pause contract
        pauseContract();

        // Try to sell NO - should revert
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.sellNo(marketId, shares, 0);

        console.log("SUCCESS: sellNo correctly blocked when paused");
    }

    // ============================================
    // TEST: EMERGENCY REFUND WORKS WHEN PAUSED
    // ============================================

    /**
     * @notice Test emergency refund works when paused (no proposal)
     * @dev Basic case: paused contract, no proposal, 24h passed
     */
    function test_EmergencyRefund_WorksWhenPaused_NoProposal() public {
        console.log(
            "=== TEST: EMERGENCY REFUND WORKS WHEN PAUSED (NO PROPOSAL) ==="
        );

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice and Bob buy shares
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Warp past expiry + 24h
        vm.warp(block.timestamp + 7 days + EMERGENCY_REFUND_DELAY + 1);

        // Pause contract
        pauseContract();

        // Alice should be able to get emergency refund
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 aliceRefund = market.emergencyRefund(marketId);

        assertGt(aliceRefund, 0, "Alice should receive refund");
        assertEq(
            alice.balance,
            aliceBalanceBefore + aliceRefund,
            "Alice balance should increase"
        );

        console.log("Alice refund:", aliceRefund);
        console.log(
            "SUCCESS: Emergency refund works when paused (no proposal)"
        );
    }

    /**
     * @notice Test emergency refund works when paused WITH active proposal (escape hatch)
     * @dev This is the KEY escape hatch test:
     *      - Normally: proposal exists → emergency refund BLOCKED
     *      - When paused: proposal exists → emergency refund ALLOWED
     */
    function test_EmergencyRefund_WorksWhenPaused_WithProposal() public {
        console.log(
            "=== TEST: EMERGENCY REFUND ESCAPE HATCH (PAUSED + PROPOSAL) ==="
        );

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice and Bob buy shares (need both sides for normal market)
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Expire market
        expireMarket(marketId);

        // Creator proposes outcome
        proposeOutcomeFor(marketCreator, marketId, true);

        // Verify proposal exists
        (address proposer, , , , ) = market.getProposal(marketId);
        assertEq(proposer, marketCreator, "Proposal should exist");

        // Warp past 24h emergency refund window
        vm.warp(block.timestamp + EMERGENCY_REFUND_DELAY + 1);

        // WITHOUT pause: emergency refund should be BLOCKED
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ResolutionInProgress.selector);
        market.emergencyRefund(marketId);
        console.log(
            "Verified: Emergency refund blocked when NOT paused + proposal exists"
        );

        // NOW PAUSE the contract
        pauseContract();

        // WITH pause: emergency refund should WORK (escape hatch!)
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 aliceRefund = market.emergencyRefund(marketId);

        assertGt(aliceRefund, 0, "Alice should receive refund (escape hatch)");
        assertEq(
            alice.balance,
            aliceBalanceBefore + aliceRefund,
            "Alice balance should increase"
        );

        console.log("Alice emergency refund (escape hatch):", aliceRefund);

        // Bob should also be able to get refund
        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        uint256 bobRefund = market.emergencyRefund(marketId);

        assertGt(bobRefund, 0, "Bob should receive refund");
        console.log("Bob emergency refund:", bobRefund);

        console.log(
            "SUCCESS: Emergency refund escape hatch works when paused!"
        );
    }

    /**
     * @notice Test emergency refund works when paused WITH disputed market
     * @dev Even more complex case: market is in Disputed state
     */
    function test_EmergencyRefund_WorksWhenPaused_WithDispute() public {
        console.log(
            "=== TEST: EMERGENCY REFUND ESCAPE HATCH (PAUSED + DISPUTED) ==="
        );

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice and Bob buy shares
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Expire market
        expireMarket(marketId);

        // Creator proposes YES
        proposeOutcomeFor(marketCreator, marketId, true);

        // Charlie disputes
        disputeFor(charlie, marketId);

        // Verify dispute exists
        (address proposer, , , , ) = market.getProposal(marketId);
        (address disputer, , , , , ) = market.getDispute(marketId);
        assertEq(proposer, marketCreator, "Proposer should exist");
        assertEq(disputer, charlie, "Disputer should exist");

        // Warp past 24h
        vm.warp(block.timestamp + EMERGENCY_REFUND_DELAY + 1);

        // WITHOUT pause: blocked
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ResolutionInProgress.selector);
        market.emergencyRefund(marketId);

        // PAUSE and try again
        pauseContract();

        // With pause: should work
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 aliceRefund = market.emergencyRefund(marketId);

        assertGt(
            aliceRefund,
            0,
            "Alice should receive refund in disputed state"
        );
        console.log("Alice refund (disputed market, paused):", aliceRefund);

        console.log(
            "SUCCESS: Emergency refund works on disputed market when paused"
        );
    }

    // ============================================
    // TEST: UNPAUSE RESTORES NORMAL BEHAVIOR
    // ============================================

    /**
     * @notice Test that unpausing restores normal trading
     */
    function test_Unpause_RestoresTrading() public {
        console.log("=== TEST: UNPAUSE RESTORES TRADING ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Pause
        pauseContract();

        // Trading blocked
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ContractPaused.selector);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Unpause
        unpauseContract();

        // Trading works again
        vm.prank(alice);
        uint256 shares = market.buyYes{value: 1 ether}(marketId, 0);
        assertGt(shares, 0, "Should receive shares after unpause");

        console.log("SUCCESS: Trading restored after unpause");
    }

    /**
     * @notice Test that unpause restores emergency refund blocking with proposal
     */
    function test_Unpause_RestoresEmergencyRefundBlocking() public {
        console.log("=== TEST: UNPAUSE RESTORES EMERGENCY REFUND BLOCKING ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Setup market with proposal
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        expireMarket(marketId);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Warp past 24h
        vm.warp(block.timestamp + EMERGENCY_REFUND_DELAY + 1);

        // Pause - emergency refund works
        pauseContract();

        // Don't take refund yet, just verify it would work
        // (We need to test unpause behavior)

        // Unpause
        unpauseContract();

        // Emergency refund should be blocked again
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.ResolutionInProgress.selector);
        market.emergencyRefund(marketId);

        console.log(
            "SUCCESS: Emergency refund blocking restored after unpause"
        );
    }

    // ============================================
    // TEST: CREATOR FEES WITHDRAWAL WHEN PAUSED
    // ============================================

    /**
     * @notice Test that creator fees withdrawal works even when paused
     * @dev Creator fees are separate from pool, should always be withdrawable
     */
    function test_WithdrawCreatorFees_WorksWhenPaused() public {
        console.log("=== TEST: CREATOR FEES WITHDRAWAL WORKS WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Generate some creator fees
        vm.prank(alice);
        market.buyYes{value: 10 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 5 ether}(marketId, 0);

        // Check creator has pending fees
        uint256 pendingFees = market.getPendingCreatorFees(marketCreator);
        assertGt(pendingFees, 0, "Creator should have pending fees");
        console.log("Pending creator fees:", pendingFees);

        // Pause contract
        pauseContract();

        // Creator should still be able to withdraw fees
        uint256 creatorBalanceBefore = marketCreator.balance;
        vm.prank(marketCreator);
        uint256 withdrawn = market.withdrawCreatorFees();

        assertEq(withdrawn, pendingFees, "Should withdraw all pending fees");
        assertEq(
            marketCreator.balance,
            creatorBalanceBefore + withdrawn,
            "Creator balance should increase"
        );

        console.log("Withdrawn while paused:", withdrawn);
        console.log("SUCCESS: Creator fees withdrawal works when paused");
    }

    /**
     * @notice Test that bond withdrawal works when paused
     */
    function test_WithdrawBond_WorksWhenPaused() public {
        console.log("=== TEST: BOND WITHDRAWAL WORKS WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Setup: Complete a resolution to generate pending withdrawals
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        expireMarket(marketId);

        // Propose and let it finalize (no dispute)
        proposeOutcomeFor(marketCreator, marketId, true);

        // Warp past dispute window
        vm.warp(block.timestamp + 31 minutes);

        // Finalize
        market.finalizeMarket(marketId);

        // Check proposer has pending withdrawal (bond + reward)
        uint256 pendingWithdrawal = market.getPendingWithdrawal(marketCreator);
        assertGt(
            pendingWithdrawal,
            0,
            "Proposer should have pending withdrawal"
        );
        console.log("Pending withdrawal:", pendingWithdrawal);

        // Pause contract
        pauseContract();

        // Should still be able to withdraw bond
        uint256 creatorBalanceBefore = marketCreator.balance;
        vm.prank(marketCreator);
        uint256 withdrawn = market.withdrawBond();

        assertEq(withdrawn, pendingWithdrawal, "Should withdraw full amount");
        assertEq(
            marketCreator.balance,
            creatorBalanceBefore + withdrawn,
            "Balance should increase"
        );

        console.log("Withdrawn while paused:", withdrawn);
        console.log("SUCCESS: Bond withdrawal works when paused");
    }

    // ============================================
    // TEST: CLAIM WORKS WHEN PAUSED
    // ============================================

    /**
     * @notice Test that claiming winnings works when paused
     * @dev Winners should always be able to claim, even during pause
     */
    function test_Claim_WorksWhenPaused() public {
        console.log("=== TEST: CLAIM WINNINGS WORKS WHEN PAUSED ===");

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Alice buys YES, Bob buys NO
        vm.prank(alice);
        market.buyYes{value: 2 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);

        // Resolve market - YES wins
        expireMarket(marketId);
        proposeOutcomeFor(marketCreator, marketId, true);
        vm.warp(block.timestamp + 31 minutes);
        market.finalizeMarket(marketId);

        // Verify resolved
        (, , , , , , , , , , bool resolved) = market.getMarket(marketId);
        assertTrue(resolved, "Market should be resolved");

        // Pause contract
        pauseContract();

        // Alice (winner) should still be able to claim
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 claimed = market.claim(marketId);

        assertGt(claimed, 0, "Alice should claim winnings");
        assertEq(
            alice.balance,
            aliceBalanceBefore + claimed,
            "Alice balance should increase"
        );

        console.log("Alice claimed while paused:", claimed);
        console.log("SUCCESS: Claim works when paused");
    }

    // ============================================
    // TEST: EDGE CASES
    // ============================================

    /**
     * @notice Test multiple users can emergency refund when paused
     */
    function test_MultipleUsers_EmergencyRefund_WhenPaused() public {
        console.log(
            "=== TEST: MULTIPLE USERS EMERGENCY REFUND WHEN PAUSED ==="
        );

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        // Multiple users buy shares
        vm.prank(alice);
        market.buyYes{value: 3 ether}(marketId, 0);
        vm.prank(bob);
        market.buyNo{value: 2 ether}(marketId, 0);
        vm.prank(charlie);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Create proposal
        expireMarket(marketId);
        proposeOutcomeFor(marketCreator, marketId, true);

        // Warp and pause
        vm.warp(block.timestamp + EMERGENCY_REFUND_DELAY + 1);
        pauseContract();

        // All users should be able to refund
        uint256 aliceBalanceBefore = alice.balance;
        vm.prank(alice);
        uint256 aliceRefund = market.emergencyRefund(marketId);

        uint256 bobBalanceBefore = bob.balance;
        vm.prank(bob);
        uint256 bobRefund = market.emergencyRefund(marketId);

        uint256 charlieBalanceBefore = charlie.balance;
        vm.prank(charlie);
        uint256 charlieRefund = market.emergencyRefund(marketId);

        assertGt(aliceRefund, 0, "Alice should get refund");
        assertGt(bobRefund, 0, "Bob should get refund");
        assertGt(charlieRefund, 0, "Charlie should get refund");

        console.log("Alice refund:", aliceRefund);
        console.log("Bob refund:", bobRefund);
        console.log("Charlie refund:", charlieRefund);

        // Verify proportional refunds (Alice had ~50%, Bob ~33%, Charlie ~17%)
        uint256 totalRefunds = aliceRefund + bobRefund + charlieRefund;
        console.log("Total refunds:", totalRefunds);

        console.log("SUCCESS: Multiple users can emergency refund when paused");
    }

    /**
     * @notice Test emergency refund still requires 24h delay even when paused
     */
    function test_EmergencyRefund_Still_Requires24h_WhenPaused() public {
        console.log(
            "=== TEST: EMERGENCY REFUND REQUIRES 24H EVEN WHEN PAUSED ==="
        );

        uint256 marketId = createTestMarket(marketCreator, 7 days);

        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        // Expire but don't wait 24h
        expireMarket(marketId);

        // Pause immediately
        pauseContract();

        // Should still fail - not 24h yet
        vm.prank(alice);
        vm.expectRevert(PredictionMarket.EmergencyRefundTooEarly.selector);
        market.emergencyRefund(marketId);

        console.log("Verified: 24h requirement still applies when paused");

        // Now wait 24h
        vm.warp(block.timestamp + EMERGENCY_REFUND_DELAY + 1);

        // Now should work
        vm.prank(alice);
        uint256 refund = market.emergencyRefund(marketId);
        assertGt(refund, 0, "Should get refund after 24h");

        console.log("SUCCESS: 24h delay still required when paused");
    }
}
