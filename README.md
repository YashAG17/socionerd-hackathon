# SocioNerd

SocioNerd is a decentralized Web3 platform that lets creators monetize their content directly without middlemen or high platform fees. Creators can set up profiles, publish public or premium posts, and get paid instantly in crypto via subscriptions and direct tips. 

## 🎥 Project Demo Video
Watch the 2-minute project walkthrough here: [https://youtu.be/FHW6klfc3fU](https://youtu.be/FHW6klfc3fU)

## Features
- Connect with MetaMask to log in and manage your profile.
- Claim a unique ENS-style handle (e.g., `@alice`) so people can find you easily.
- Post public content for anyone to read.
- Set up subscriber-only premium posts.
- Direct "Tip by Handle" functionality so fans can support creators directly.
- On-chain subscriptions that automatically unlock premium content.

## Tech Stack
- Smart Contracts: Solidity, Hardhat, Ethers.js v6
- Frontend: React.js, Vite
- Wallet Connection: MetaMask
- Local Node: Hardhat Node / Foundry Anvil

## Project Structure
- `CreatorRegistry.sol`: Maps readable handles to wallet addresses and manages profile registration.
- `PostManager.sol`: Handles public and premium posts and checks subscriber permissions.
- `SubscriptionManager.sol`: Manages ETH tips and time-based subscription status.

## How to Run Locally

### 1. Install Dependencies
In the root directory, install the smart contract dependencies:
```bash
npm install
```

Then install the frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 2. Start the Local Blockchain
Start an empty local node using Hardhat:
```bash
npx hardhat node
```

### 3. Deploy Smart Contracts
Open a new terminal window at the project root and deploy the contracts to your local node:
```bash
npm run deploy:anvil
```
This script compiles the contracts and outputs the ABIs and contract addresses into `frontend/src/contracts/` so the frontend can use them.

### 4. Run the Web App
Start the Vite development server:
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173/` in your browser.

### 5. MetaMask Setup
Add a custom local network to MetaMask:
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
Import one or two of the test accounts using the private keys provided by the Hardhat node terminal so you have some test ETH.

## Testing Out the App
1. Connect MetaMask to the local network.
2. Register a handle and create a couple of posts (one public, one premium).
3. Switch your MetaMask account to a different test address.
4. Try tipping the first account and subscribing to unlock their premium posts.
