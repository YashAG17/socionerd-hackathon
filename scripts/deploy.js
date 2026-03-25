const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const CreatorRegistry = await ethers.getContractFactory("CreatorRegistry");
  const creatorRegistry = await CreatorRegistry.deploy();
  await creatorRegistry.waitForDeployment();
  const creatorRegistryAddress = await creatorRegistry.getAddress();
  console.log("CreatorRegistry deployed to:", creatorRegistryAddress);

  const SubscriptionManager = await ethers.getContractFactory("SubscriptionManager");
  const subscriptionManager = await SubscriptionManager.deploy(creatorRegistryAddress);
  await subscriptionManager.waitForDeployment();
  const subscriptionManagerAddress = await subscriptionManager.getAddress();
  console.log("SubscriptionManager deployed to:", subscriptionManagerAddress);

  const PostManager = await ethers.getContractFactory("PostManager");
  const postManager = await PostManager.deploy(creatorRegistryAddress, subscriptionManagerAddress);
  await postManager.waitForDeployment();
  const postManagerAddress = await postManager.getAddress();
  console.log("PostManager deployed to:", postManagerAddress);

  const addresses = {
    chainId: network.config.chainId || 31337,
    CreatorRegistry: creatorRegistryAddress,
    SubscriptionManager: subscriptionManagerAddress,
    PostManager: postManagerAddress
  };

  const outDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "addresses.json"), JSON.stringify(addresses, null, 2));

  const creatorRegistryArtifact = await artifacts.readArtifact("CreatorRegistry");
  const subscriptionManagerArtifact = await artifacts.readArtifact("SubscriptionManager");
  const postManagerArtifact = await artifacts.readArtifact("PostManager");

  fs.writeFileSync(
    path.join(outDir, "CreatorRegistry.json"),
    JSON.stringify(creatorRegistryArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "SubscriptionManager.json"),
    JSON.stringify(subscriptionManagerArtifact, null, 2)
  );
  fs.writeFileSync(
    path.join(outDir, "PostManager.json"),
    JSON.stringify(postManagerArtifact, null, 2)
  );

  console.log("Frontend contract files generated in frontend/src/contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
