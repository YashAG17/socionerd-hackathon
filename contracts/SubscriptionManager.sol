// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICreatorRegistry {
    struct Creator {
        string username;
        string bio;
        uint256 subscriptionPrice;
        bool exists;
    }

    function getCreator(address creator) external view returns (Creator memory);
}

contract SubscriptionManager {
    ICreatorRegistry public immutable creatorRegistry;
    uint256 public constant SUBSCRIPTION_DURATION = 30 days;

    mapping(address => mapping(address => uint256)) public subscriptionExpiry;

    event Subscribed(address indexed subscriber, address indexed creator, uint256 expiresAt, uint256 amountPaid);
    event Tipped(address indexed supporter, address indexed creator, uint256 amount);

    constructor(address creatorRegistryAddress) {
        creatorRegistry = ICreatorRegistry(creatorRegistryAddress);
    }

    function subscribe(address creator) external payable {
        ICreatorRegistry.Creator memory c = creatorRegistry.getCreator(creator);
        require(c.exists, "Creator not registered");
        require(msg.value >= c.subscriptionPrice, "Insufficient payment");
        require(c.subscriptionPrice > 0, "Subscription disabled");

        uint256 currentExpiry = subscriptionExpiry[msg.sender][creator];
        uint256 baseTime = currentExpiry > block.timestamp ? currentExpiry : block.timestamp;
        uint256 newExpiry = baseTime + SUBSCRIPTION_DURATION;
        subscriptionExpiry[msg.sender][creator] = newExpiry;

        (bool sent, ) = payable(creator).call{value: msg.value}("");
        require(sent, "Transfer failed");

        emit Subscribed(msg.sender, creator, newExpiry, msg.value);
    }

    function tipCreator(address creator) external payable {
        require(msg.value > 0, "Tip must be greater than 0");
        ICreatorRegistry.Creator memory c = creatorRegistry.getCreator(creator);
        require(c.exists, "Creator not registered");

        (bool sent, ) = payable(creator).call{value: msg.value}("");
        require(sent, "Tip transfer failed");

        emit Tipped(msg.sender, creator, msg.value);
    }

    function isSubscribed(address user, address creator) external view returns (bool) {
        return subscriptionExpiry[user][creator] > block.timestamp;
    }
}
