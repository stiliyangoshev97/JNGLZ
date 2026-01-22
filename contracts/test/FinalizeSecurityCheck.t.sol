// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./helpers/TestHelper.sol";

/**
 * @title FinalizeSecurityCheck
 * @notice Tests that finalizeMarket cannot be called prematurely
 * @dev Verifies that:
 *      1. Cannot finalize Active markets (still trading)
 *      2. Cannot finalize Expired markets (no proposal yet)
 *      3. Can only finalize Proposed markets AFTER dispute window
 *      4. Can only finalize Disputed markets AFTER voting window
 *
 * Timeline (after expiry):
 *   - Expiry to Expiry+22h: Proposal window open
 *   - Expiry+22h to Expiry+24h: CUTOFF - No new proposals (2h buffer before emergency refund)
 *   - Expiry+24h+: Emergency refund available
 */
contract FinalizeSecurityCheck is TestHelper {
    uint256 public marketId;

    function setUp() public override {
        super.setUp();

        // Create a market (expires in 7 days - gives plenty of room for testing)
        vm.prank(alice);
        marketId = market.createMarket(
            "Will BTC reach $100k?",
            "https://coingecko.com",
            "Check CoinGecko on expiry date",
            "",
            block.timestamp + 7 days,
            PredictionMarket.HeatLevel.HIGH
        );

        // Alice buys YES, Bob buys NO (so we have both sides)
        vm.prank(alice);
        market.buyYes{value: 1 ether}(marketId, 0);

        vm.prank(bob);
        market.buyNo{value: 1 ether}(marketId, 0);
    }

    /**
     * @notice Calculate payment needed to achieve required bond after 0.3% fee
     * @dev bondAfterFee = payment - (payment * 30 / 10000) = payment * 9970 / 10000
     *      So: payment = bondRequired * 10000 / 9970
     */
    function getBondPayment(
        uint256 bondRequired
    ) internal pure returns (uint256) {
        return (bondRequired * 10000) / 9970 + 1; // +1 for rounding safety
    }

    // ============================================================
    // TEST 1: Cannot finalize ACTIVE market (still trading, not expired)
    // ============================================================
    function test_CannotFinalize_ActiveMarket() public {
        // Market is active (not expired, no proposal)
        // Attempt to finalize should revert

        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);
    } // ============================================================

    // TEST 2: Cannot finalize EXPIRED market without proposal
    // ============================================================
    function test_CannotFinalize_ExpiredMarket_NoProposal() public {
        // Warp past expiry (but within proposal window - not past the 22h cutoff)
        vm.warp(block.timestamp + 7 days + 1 hours);

        // Market is expired but no proposal yet
        // Attempt to finalize should revert

        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);
    }

    // ============================================================
    // TEST 3: Cannot finalize PROPOSED market before dispute window ends
    // ============================================================
    function test_CannotFinalize_ProposedMarket_DuringDisputeWindow() public {
        // Warp past expiry (within proposal window)
        vm.warp(block.timestamp + 7 days + 1 hours);

        // Charlie proposes outcome (with bond + fee)
        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);

        // Still in dispute window (30 minutes)
        // Warp only 10 minutes
        vm.warp(block.timestamp + 10 minutes);

        // Attempt to finalize should revert
        vm.expectRevert(PredictionMarket.DisputeWindowExpired.selector);
        market.finalizeMarket(marketId);
    }

    // ============================================================
    // TEST 4: CAN finalize PROPOSED market AFTER dispute window ends
    // ============================================================
    function test_CanFinalize_ProposedMarket_AfterDisputeWindow() public {
        // Warp past expiry (within proposal window - well before the 22h cutoff)
        vm.warp(block.timestamp + 7 days + 1 hours);

        // Charlie proposes outcome (with bond + fee)
        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);

        // Warp past dispute window (30 minutes)
        vm.warp(block.timestamp + 31 minutes);

        // Should succeed now
        market.finalizeMarket(marketId);

        // Verify market is resolved
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertTrue(resolved, "Market should be resolved");
    }

    // ============================================================
    // TEST 5: Cannot finalize DISPUTED market before voting window ends
    // ============================================================
    function test_CannotFinalize_DisputedMarket_DuringVotingWindow() public {
        // Warp past expiry (within proposal window)
        vm.warp(block.timestamp + 7 days + 1 hours);

        // Charlie proposes YES (with bond + fee)
        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);

        // Bob disputes (proposes NO) - dispute requires 2x proposal bond (after fee) + fee
        // Use a generous payment to cover the fee
        uint256 disputePayment = getBondPayment(bondRequired) * 3; // 3x to be safe
        vm.prank(bob);
        market.dispute{value: disputePayment}(marketId);

        // Still in voting window (1 hour)
        // Warp only 30 minutes
        vm.warp(block.timestamp + 30 minutes);

        // Attempt to finalize should revert
        vm.expectRevert(PredictionMarket.VotingNotEnded.selector);
        market.finalizeMarket(marketId);
    }

    // ============================================================
    // TEST 6: CAN finalize DISPUTED market AFTER voting window ends
    // ============================================================
    function test_CanFinalize_DisputedMarket_AfterVotingWindow() public {
        // Warp past expiry (within proposal window)
        vm.warp(block.timestamp + 7 days + 1 hours);

        // Charlie proposes YES (with bond + fee)
        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);

        // Bob disputes - dispute requires 2x proposal bond (after fee) + fee
        uint256 disputePayment = getBondPayment(bondRequired) * 3; // 3x to be safe
        vm.prank(bob);
        market.dispute{value: disputePayment}(marketId);

        // Alice votes YES (has YES shares)
        vm.prank(alice);
        market.vote(marketId, true);

        // Bob votes NO (has NO shares)
        vm.prank(bob);
        market.vote(marketId, false);

        // Warp past voting window (1 hour)
        vm.warp(block.timestamp + 61 minutes);

        // Should succeed now
        market.finalizeMarket(marketId);

        // Verify market is resolved
        (, , , , , , , , , bool resolved, ) = market.getMarket(marketId);
        assertTrue(resolved, "Market should be resolved");
    }

    // ============================================================
    // TEST 7: Cannot finalize already RESOLVED market
    // ============================================================
    function test_CannotFinalize_AlreadyResolvedMarket() public {
        // Complete full resolution flow (within proposal window)
        vm.warp(block.timestamp + 7 days + 1 hours);

        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);

        vm.warp(block.timestamp + 31 minutes);
        market.finalizeMarket(marketId);

        // Try to finalize again
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);
    }

    // ============================================================
    // TEST 8: Random user cannot finalize during trading (multiple attempts)
    // ============================================================
    function test_RandomUser_CannotFinalize_DuringTrading() public {
        address randomUser = address(0xDEAD);

        // Try immediately after market creation
        vm.prank(randomUser);
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);

        // Try after some trading activity
        vm.prank(alice);
        market.buyYes{value: 0.5 ether}(marketId, 0);

        vm.prank(randomUser);
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);

        // Try 1 second before expiry
        vm.warp(block.timestamp + 1 days - 1);

        vm.prank(randomUser);
        vm.expectRevert(PredictionMarket.MarketNotResolved.selector);
        market.finalizeMarket(marketId);
    }

    // ============================================================
    // TEST 9: Verify MarketStatus enum flow
    // ============================================================
    function test_MarketStatus_Flow() public {
        // Active status
        PredictionMarket.MarketStatus status = market.getMarketStatus(marketId);
        assertEq(
            uint256(status),
            uint256(PredictionMarket.MarketStatus.Active)
        );

        // Expired status (no proposal) - warp past expiry but within proposal window
        vm.warp(block.timestamp + 7 days + 1 hours);
        status = market.getMarketStatus(marketId);
        assertEq(
            uint256(status),
            uint256(PredictionMarket.MarketStatus.Expired)
        );

        // Proposed status
        uint256 bondRequired = market.getRequiredBond(marketId);
        uint256 payment = getBondPayment(bondRequired);
        vm.prank(charlie);
        market.proposeOutcome{value: payment}(marketId, true);
        status = market.getMarketStatus(marketId);
        assertEq(
            uint256(status),
            uint256(PredictionMarket.MarketStatus.Proposed)
        );

        // Disputed status - dispute requires 2x proposal bond (after fee) + fee
        uint256 disputePayment = getBondPayment(bondRequired) * 3; // 3x to be safe
        vm.prank(bob);
        market.dispute{value: disputePayment}(marketId);
        status = market.getMarketStatus(marketId);
        assertEq(
            uint256(status),
            uint256(PredictionMarket.MarketStatus.Disputed)
        );

        // Resolved status (after voting)
        vm.prank(alice);
        market.vote(marketId, true);
        vm.warp(block.timestamp + 61 minutes);
        market.finalizeMarket(marketId);
        status = market.getMarketStatus(marketId);
        assertEq(
            uint256(status),
            uint256(PredictionMarket.MarketStatus.Resolved)
        );
    }
}
