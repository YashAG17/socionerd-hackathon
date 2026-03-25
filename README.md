# SocioNerd

SocioNerd is a decentralized creator platform built for hackathons. Creators can register profiles, publish public or premium posts, receive direct crypto tips, and sell subscriptions without relying on centralized platforms.

## Tech stack
- Solidity
- Hardhat
- Ethers.js
- React + Vite
- MetaMask
- Anvil or Hardhat local node

## Features
- Wallet-based login with MetaMask
- Creator profile registration
- Public and subscriber-only posts
- Direct ETH tipping
- On-chain subscription access

## Project structure
- `contracts/` smart contracts
- `scripts/` deployment scripts
- `frontend/` React frontend

## Run locally

### 1. Install dependencies
At root:
```bash
npm install
```

Inside frontend:
```bash
cd frontend
npm install
cd ..
```

### 2. Start a local chain
You can use either Anvil or Hardhat node.

Using Anvil:
```bash
anvil
```

Or using Hardhat:
```bash
npx hardhat node
```

### 3. Deploy contracts
In a new terminal:
```bash
npm run deploy:anvil
```

This also writes contract addresses and ABIs into `frontend/src/contracts/`.

### 4. Start the frontend
```bash
cd frontend
npm run dev
```

### 5. Connect MetaMask
- Add local chain `http://127.0.0.1:8545`
- Chain ID for Anvil is usually `31337`, but MetaMask often expects `0x7A69` / `31337` for local tools
- Import one of the private keys shown by Anvil/Hardhat node

## Demo flow
1. Connect wallet
2. Register as creator
3. Create a public or premium post
4. From another wallet, subscribe or tip
5. Refresh and view unlocked premium content
