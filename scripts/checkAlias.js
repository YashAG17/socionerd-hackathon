const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
    const addresses = JSON.parse(fs.readFileSync('./frontend/src/contracts/addresses.json'));
    const CreatorRegistry = await ethers.getContractFactory('CreatorRegistry');
    const registry = await CreatorRegistry.attach(addresses.CreatorRegistry);

    console.log("Checking resolveAlias for 'yash':", await registry.resolveAlias('yash'));
    console.log("Checking resolveAlias for 'Yash':", await registry.resolveAlias('Yash'));
    
    console.log("\nAll registered users:");
    const creators = await registry.getAllCreators();
    for(let c of creators) { 
        let info = await registry.getCreator(c); 
        console.log(`Address: ${c} | Username: '${info.username}' | Raw Hex: `,ethers.hexlify(ethers.toUtf8Bytes(info.username))); 
        let resolved = await registry.resolveAlias(info.username);
        console.log(`  -> Alias mapping manually resolved to: ${resolved}`);
    }
}

main().catch(console.error);
