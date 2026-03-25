// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISubscriptionManager {
    function isSubscribed(address user, address creator) external view returns (bool);
}

interface ICreatorRegistryForPosts {
    function isCreatorRegistered(address creator) external view returns (bool);
}

contract PostManager {
    struct Post {
        uint256 id;
        address creator;
        string title;
        string content;
        bool isPremium;
        uint256 createdAt;
    }

    ICreatorRegistryForPosts public immutable creatorRegistry;
    ISubscriptionManager public immutable subscriptionManager;

    uint256 public postCount;
    mapping(uint256 => Post) public posts;
    uint256[] private postIds;

    event PostCreated(uint256 indexed postId, address indexed creator, string title, bool isPremium);

    constructor(address creatorRegistryAddress, address subscriptionManagerAddress) {
        creatorRegistry = ICreatorRegistryForPosts(creatorRegistryAddress);
        subscriptionManager = ISubscriptionManager(subscriptionManagerAddress);
    }

    function createPost(
        string calldata title,
        string calldata content,
        bool isPremium
    ) external {
        require(creatorRegistry.isCreatorRegistered(msg.sender), "Register as creator first");
        require(bytes(title).length > 0, "Title required");
        require(bytes(content).length > 0, "Content required");

        postCount++;
        posts[postCount] = Post({
            id: postCount,
            creator: msg.sender,
            title: title,
            content: content,
            isPremium: isPremium,
            createdAt: block.timestamp
        });
        postIds.push(postCount);

        emit PostCreated(postCount, msg.sender, title, isPremium);
    }

    function getAllPosts() external view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postIds.length);
        for (uint256 i = 0; i < postIds.length; i++) {
            allPosts[i] = posts[postIds[i]];
        }
        return allPosts;
    }

    function getVisibleContent(uint256 postId, address viewer) external view returns (string memory) {
        Post memory post = posts[postId];
        require(post.id != 0, "Post not found");

        if (!post.isPremium) {
            return post.content;
        }

        bool allowed = viewer == post.creator || subscriptionManager.isSubscribed(viewer, post.creator);
        if (allowed) {
            return post.content;
        }

        return "Locked: subscribe to unlock this content";
    }
}
