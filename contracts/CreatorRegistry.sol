// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CreatorRegistry {
    struct Creator {
        string username;
        string bio;
        uint256 subscriptionPrice;
        bool exists;
    }

    mapping(address => Creator) private creators;
    address[] private creatorList;
    mapping(string => address) private aliasToAddress;

    event CreatorRegistered(address indexed creator, string username, uint256 subscriptionPrice);
    event CreatorUpdated(address indexed creator, string username, uint256 subscriptionPrice);
    event CreatorDeactivated(address indexed creator);

    function registerCreator(
        string calldata username,
        string calldata bio,
        uint256 subscriptionPrice
    ) external {
        require(bytes(username).length > 0, "Username required");
        require(!creators[msg.sender].exists, "Already registered");
        require(aliasToAddress[username] == address(0), "Username already taken");

        creators[msg.sender] = Creator({
            username: username,
            bio: bio,
            subscriptionPrice: subscriptionPrice,
            exists: true
        });

        aliasToAddress[username] = msg.sender;
        creatorList.push(msg.sender);
        emit CreatorRegistered(msg.sender, username, subscriptionPrice);
    }

    function updateCreator(
        string calldata username,
        string calldata bio,
        uint256 subscriptionPrice
    ) external {
        require(creators[msg.sender].exists, "Not registered");
        require(bytes(username).length > 0, "Username required");

        Creator storage creator = creators[msg.sender];
        
        // If username changed, update mapping
        if (keccak256(bytes(creator.username)) != keccak256(bytes(username))) {
            require(aliasToAddress[username] == address(0), "Username already taken");
            // Free old username
            aliasToAddress[creator.username] = address(0);
            // Claim new username
            aliasToAddress[username] = msg.sender;
            // Update struct
            creator.username = username;
        }

        creator.bio = bio;
        creator.subscriptionPrice = subscriptionPrice;

        emit CreatorUpdated(msg.sender, username, subscriptionPrice);
    }

    function deactivateCreator() external {
        require(creators[msg.sender].exists, "Not registered");
        
        Creator storage creator = creators[msg.sender];
        
        // Free username
        aliasToAddress[creator.username] = address(0);
        
        // Mark as does not exist
        creator.exists = false;
        creator.username = "";
        creator.bio = "";
        creator.subscriptionPrice = 0;
        
        emit CreatorDeactivated(msg.sender);
    }

    function getCreator(address creator) external view returns (Creator memory) {
        return creators[creator];
    }

    function isCreatorRegistered(address creator) external view returns (bool) {
        return creators[creator].exists;
    }

    function resolveAlias(string calldata aliasName) external view returns (address) {
        return aliasToAddress[aliasName];
    }

    function getAllCreators() external view returns (address[] memory) {
        return creatorList;
    }
}
