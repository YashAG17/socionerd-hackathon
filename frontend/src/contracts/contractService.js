import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers'
import addresses from './addresses.json'
import CreatorRegistryArtifact from './CreatorRegistry.json'
import SubscriptionManagerArtifact from './SubscriptionManager.json'
import PostManagerArtifact from './PostManager.json'

export async function getEthereum() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }
  return window.ethereum
}

export async function connectWallet() {
  const ethereum = await getEthereum()
  await ethereum.request({ method: 'eth_requestAccounts' })
  const provider = new BrowserProvider(ethereum)
  const signer = await provider.getSigner()
  const address = await signer.getAddress()
  const network = await provider.getNetwork()
  return { provider, signer, address, chainId: Number(network.chainId) }
}

export async function switchToLocalhost() {
  const ethereum = await getEthereum()
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7A69' }]
    })
  } catch (error) {
    if (error.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x7A69',
            chainName: 'Anvil Local',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['http://127.0.0.1:8545']
          }
        ]
      })
    } else {
      throw error
    }
  }
}

export async function getContracts() {
  const { provider, signer, address, chainId } = await connectWallet()
  const creatorRegistry = new Contract(addresses.CreatorRegistry, CreatorRegistryArtifact.abi, signer)
  const subscriptionManager = new Contract(addresses.SubscriptionManager, SubscriptionManagerArtifact.abi, signer)
  const postManager = new Contract(addresses.PostManager, PostManagerArtifact.abi, signer)
  return { provider, signer, address, chainId, creatorRegistry, subscriptionManager, postManager }
}

export function toWei(value) {
  return parseEther(value || '0')
}

export function fromWei(value) {
  return formatEther(value)
}


export function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
