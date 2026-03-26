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
        string mediaUrl;
        bool isPremium;
        uint256 createdAt;
    }

    struct Comment {
        address author;
        string text;
        uint256 timestamp;
        bool isDeleted;
    }

    ICreatorRegistryForPosts public immutable creatorRegistry;
    ISubscriptionManager public immutable subscriptionManager;

    uint256 public postCount;
    mapping(uint256 => Post) public posts;
    uint256[] private postIds;

    mapping(uint256 => uint256) public postLikes;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(uint256 => Comment[]) public postComments;

    event PostCreated(uint256 indexed postId, address indexed creator, string title, bool isPremium);
    event PostLiked(uint256 indexed postId, address indexed user);
    event CommentAdded(uint256 indexed postId, address indexed author, string text);

    constructor(address creatorRegistryAddress, address subscriptionManagerAddress) {
        creatorRegistry = ICreatorRegistryForPosts(creatorRegistryAddress);
        subscriptionManager = ISubscriptionManager(subscriptionManagerAddress);
    }

    function _canAccessPost(uint256 postId, address user) internal view returns (bool) {
        Post memory post = posts[postId];
        if (post.id == 0) return false;
        if (post.isPremium) {
            return user == post.creator || subscriptionManager.isSubscribed(user, post.creator);
        }
        return true;
    }

    function createPost(
        string calldata title,
        string calldata content,
        string calldata mediaUrl,
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
            mediaUrl: mediaUrl,
            isPremium: isPremium,
            createdAt: block.timestamp
        });
        postIds.push(postCount);

        emit PostCreated(postCount, msg.sender, title, isPremium);
    }

    modifier canAccessPost(uint256 postId) {
        Post memory post = posts[postId];
        require(post.id != 0, "Post not found");
        if (post.isPremium) {
            bool allowed = msg.sender == post.creator || subscriptionManager.isSubscribed(msg.sender, post.creator);
            require(allowed, "Locked: subscribe to unlock this content");
        }
        _;
    }

    function toggleLike(uint256 postId) external canAccessPost(postId) {
        if (hasLiked[postId][msg.sender]) {
            hasLiked[postId][msg.sender] = false;
            postLikes[postId]--;
        } else {
            hasLiked[postId][msg.sender] = true;
            postLikes[postId]++;
            emit PostLiked(postId, msg.sender);
        }
    }

    function addComment(uint256 postId, string calldata text) external canAccessPost(postId) {
        require(bytes(text).length > 0, "Comment cannot be empty");
        postComments[postId].push(Comment({
            author: msg.sender,
            text: text,
            timestamp: block.timestamp,
            isDeleted: false
        }));
        emit CommentAdded(postId, msg.sender, text);
    }

    function deleteComment(uint256 postId, uint256 commentIndex) external {
        require(posts[postId].id != 0, "Post not found");
        require(
            msg.sender == posts[postId].creator || msg.sender == postComments[postId][commentIndex].author,
            "Not authorized to delete"
        );
        require(!postComments[postId][commentIndex].isDeleted, "Already deleted");
        
        postComments[postId][commentIndex].isDeleted = true;
    }



    function getPostInteractions(uint256 postId, address user) external view returns (uint256 likeCount, bool userHasLiked, Comment[] memory comments) {
        likeCount = postLikes[postId];
        userHasLiked = hasLiked[postId][user];
        comments = postComments[postId];
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
