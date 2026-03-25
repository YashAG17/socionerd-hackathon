// const { ethers } = require("hardhat");
const addresses = require("../frontend/src/contracts/addresses.json");

async function main() {
    const [owner, addr1] = await ethers.getSigners();
    console.log("Owner: ", owner.address);
    console.log("Addr1: ", addr1.address);
    
    const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
    const sm = SubscriptionManager.attach(addresses.SubscriptionManager);
    
    const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
    const cr = CreatorRegistry.attach(addresses.CreatorRegistry);

    // Register a creator as owner
    await cr.registerCreator("Test User", "Bio", ethers.parseEther("2.0"));
    console.log("Registered creator");

    // Get pricing
    const creatorInfo = await cr.getCreator(owner.address);
    console.log("Creator price: ", creatorInfo.subscriptionPrice);

    // Subscribe as addr1
    const tx = await sm.connect(addr1).subscribe(owner.address, { value: ethers.parseEther("2.0") });
    await tx.wait();
    console.log("Subscribed successfully");
}

main().catch(console.error);
