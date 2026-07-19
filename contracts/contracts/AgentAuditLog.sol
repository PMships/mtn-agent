// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentAuditLog
 * @notice Immutable on-chain record of AI agent payment decisions.
 *         Demonstrates the audit trail layer required for trusted agentic commerce.
 *         Deployed on Ethereum Sepolia testnet for MTN-Agent demo.
 */
contract AgentAuditLog {

    struct AgentAction {
        address agent;
        string  merchantId;
        string  merchantName;
        uint256 amount;
        string  category;
        string  decision;
        string  reason;
        uint256 timestamp;
    }

    AgentAction[] public actions;

    event ActionLogged(
        uint256 indexed id,
        address indexed agent,
        string merchantId,
        string decision,
        uint256 amount,
        uint256 timestamp
    );

    function logAction(
        string calldata merchantId,
        string calldata merchantName,
        uint256 amount,
        string calldata category,
        string calldata decision,
        string calldata reason
    ) external {
        actions.push(AgentAction({
            agent:       msg.sender,
            merchantId:  merchantId,
            merchantName: merchantName,
            amount:      amount,
            category:    category,
            decision:    decision,
            reason:      reason,
            timestamp:   block.timestamp
        }));

        emit ActionLogged(actions.length - 1, msg.sender, merchantId, decision, amount, block.timestamp);
    }

    function getAction(uint256 id) external view returns (AgentAction memory) {
        return actions[id];
    }

    function totalActions() external view returns (uint256) {
        return actions.length;
    }
}