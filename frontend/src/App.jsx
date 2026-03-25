import { useEffect, useMemo, useState } from 'react'
import {
  getContracts,
  connectWallet,
  switchToLocalhost,
  toWei,
  fromWei,
  shortenAddress
} from './contracts/contractService'

const emptyProfile = { username: '', bio: '', subscriptionPrice: '' }
const emptyPost = { title: '', content: '', isPremium: false }
const defaultTips = {}

function App() {
  const [wallet, setWallet] = useState('')
  const [status, setStatus] = useState('Connect MetaMask and switch to the local Anvil chain.')
  const [profileForm, setProfileForm] = useState(emptyProfile)
  const [postForm, setPostForm] = useState(emptyPost)
  const [creators, setCreators] = useState([])
  const [posts, setPosts] = useState([])
  const [tipAmounts, setTipAmounts] = useState(defaultTips)
  const [handleTip, setHandleTip] = useState({ handle: '', amount: '0.01' })
  const [refreshKey, setRefreshKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (window.ethereum) {
      const reload = () => window.location.reload()
      window.ethereum.on('accountsChanged', reload)
      window.ethereum.on('chainChanged', reload)
      return () => {
        window.ethereum.removeListener('accountsChanged', reload)
        window.ethereum.removeListener('chainChanged', reload)
      }
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [refreshKey])

  const me = useMemo(() => wallet.toLowerCase(), [wallet])
  const currentCreator = creators.find((creator) => creator.address.toLowerCase() === me)

  useEffect(() => {
    if (currentCreator) {
      setProfileForm({
        username: currentCreator.username || '',
        bio: currentCreator.bio || '',
        subscriptionPrice: currentCreator.subscriptionPrice || ''
      })
    } else {
      setProfileForm(emptyProfile)
    }
  }, [currentCreator])

  async function handleConnect() {
    try {
      await switchToLocalhost()
      const { address } = await connectWallet()
      setWallet(address)
      setStatus('Wallet connected successfully.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setStatus(error.shortMessage || error.message)
    }
  }

  async function loadData() {
    try {
      setIsLoading(true)
      const { address, creatorRegistry, postManager, subscriptionManager, provider } = await getContracts()
      setWallet(address)

      const creatorAddresses = await creatorRegistry.getAllCreators()
      // Remove duplicates since registerCreator doesn't check if user in creatorList already
      const uniqueCreatorAddresses = [...new Set(creatorAddresses)]
      const creatorResults = await Promise.all(
        uniqueCreatorAddresses.map(async (creatorAddress) => {
          const creator = await creatorRegistry.getCreator(creatorAddress)
          if (!creator.exists) return null

          const balance = await provider.getBalance(creatorAddress)
          const subscribed =
            address.toLowerCase() === creatorAddress.toLowerCase()
              ? true
              : await subscriptionManager.isSubscribed(address, creatorAddress)

          return {
            address: creatorAddress,
            username: creator.username,
            bio: creator.bio,
            subscriptionPrice: fromWei(creator.subscriptionPrice),
            walletBalance: Number(fromWei(balance)).toFixed(4),
            isSubscribed: subscribed
          }
        })
      )
      setCreators(creatorResults.filter(Boolean))

      const allPosts = await postManager.getAllPosts()
      const hydratedPosts = await Promise.all(
        allPosts.map(async (post) => {
          const creator = creatorResults.find(
            (entry) => entry.address.toLowerCase() === post.creator.toLowerCase()
          )
          const canView =
            !post.isPremium ||
            post.creator.toLowerCase() === address.toLowerCase() ||
            creator?.isSubscribed

          return {
            id: Number(post.id),
            creator: post.creator,
            creatorName: creator?.username ? `${creator.username}.socio` : shortenAddress(post.creator),
            title: post.title,
            content: post.content,
            isPremium: post.isPremium,
            canView,
            createdAt: new Date(Number(post.createdAt) * 1000).toLocaleString()
          }
        })
      )

      setPosts(hydratedPosts.reverse())
      setStatus('Feed synced from the local chain.')
    } catch (error) {
      if (error.message && !error.message.includes('MetaMask')) {
        setStatus('Deploy contracts first, then connect wallet.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function registerCreator(event) {
    event.preventDefault()
    try {
      setStatus(currentCreator ? 'Updating profile...' : 'Registering creator...')
      const { creatorRegistry } = await getContracts()
      
      let tx;
      if (currentCreator) {
        tx = await creatorRegistry.updateCreator(
          profileForm.username,
          profileForm.bio,
          toWei(profileForm.subscriptionPrice)
        )
      } else {
        tx = await creatorRegistry.registerCreator(
          profileForm.username,
          profileForm.bio,
          toWei(profileForm.subscriptionPrice)
        )
      }
      
      await tx.wait()
      if (!currentCreator) setProfileForm(emptyProfile)
      setStatus(currentCreator ? 'Creator profile updated successfully.' : 'Creator profile registered.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setStatus(error.shortMessage || error.message)
    }
  }

  async function deactivateCreator() {
    if (!window.confirm("Are you sure you want to permanently delete your profile?")) return;
    try {
      setStatus('Deleting profile...')
      const { creatorRegistry } = await getContracts()
      const tx = await creatorRegistry.deactivateCreator()
      await tx.wait()
      setProfileForm(emptyProfile)
      setStatus('Creator profile deleted successfully.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setStatus(error.shortMessage || error.message)
    }
  }

  async function createPost(event) {
    event.preventDefault()
    try {
      setStatus('Publishing post...')
      const { postManager } = await getContracts()
      const tx = await postManager.createPost(postForm.title, postForm.content, postForm.isPremium)
      await tx.wait()
      setPostForm(emptyPost)
      setStatus('Post published.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      setStatus(error.shortMessage || error.message)
    }
  }

  async function subscribeToCreator(creatorAddress, subscriptionPrice) {
    try {
      alert(`Attempting to subscribe to ${creatorAddress} for ${subscriptionPrice} ETH`);
      setStatus('Subscribing... approve the MetaMask transaction.')
      const { subscriptionManager } = await getContracts()
      const tx = await subscriptionManager.subscribe(creatorAddress, {
        value: toWei(String(subscriptionPrice))
      })
      await tx.wait()
      alert('Subscription successful!');
      setStatus('Subscription successful. Premium posts are unlocked now.')
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(`Subscription Error: ${error.shortMessage || error.message}`);
      setStatus(error.shortMessage || error.message)
    }
  }

  async function tipCreator(creatorAddress, customAmount) {
    const amount = customAmount || tipAmounts[creatorAddress] || '0.01'

    try {
      alert(`Attempting to tip ${creatorAddress} ${amount} ETH`);
      setStatus('Sending tip... approve the MetaMask transaction.')
      const { subscriptionManager } = await getContracts()
      const tx = await subscriptionManager.tipCreator(creatorAddress, {
        value: toWei(String(amount))
      })
      await tx.wait()
      alert(`Tip successful!`);
      setStatus(`Tip of ${amount} ETH sent successfully.`)
      setTipAmounts((prev) => ({ ...prev, [creatorAddress]: '0.01' }))
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      alert(`Tip Error: ${error.shortMessage || error.message}`);
      setStatus(error.shortMessage || error.message)
    }
  }

  async function tipByHandle(event) {
    event.preventDefault()
    try {
      setStatus(`Resolving handle ${handleTip.handle}...`)
      const { creatorRegistry } = await getContracts()
      
      // Strip .socio if they typed it and trim whitespace
      const cleanHandle = handleTip.handle.replace('.socio', '').trim().toLowerCase()
      
      console.log('--- Handle Debugging ---');
      console.log('Original input:', `"${handleTip.handle}"`);
      console.log('Cleaned and lowercased:', `"${cleanHandle}"`);
      console.log('Available creators in state:');
      creators.forEach(c => console.log(`  - Username: "${c.username}" | Address: ${c.address}`));
      
      // Find the creator in our loaded state (case-insensitive search)
      const matchedCreator = creators.find(
        (c) => c.username && c.username.toLowerCase() === cleanHandle
      )
      
      if (!matchedCreator) {
        console.error('Creator not found in state!');
        throw new Error('Handle not found. Make sure the user has registered it (e.g. yash)')
      }
      
      const resolvedAddress = matchedCreator.address
      console.log('Resolving handle:', handleTip.handle, '->', resolvedAddress);
      
      await tipCreator(resolvedAddress, handleTip.amount)
      setHandleTip({ handle: '', amount: '0.01' })
    } catch (error) {
      alert(`Error: ${error.shortMessage || error.message}`);
      setStatus(error.shortMessage || error.message)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <h1>SocioNerd</h1>
            <p>Creator economy on-chain</p>
          </div>
        </div>

        <nav className="nav-list">
          <a href="#feed">Feed</a>
          <a href="#creators">Creators</a>
          <a href="#studio">Creator Studio</a>
        </nav>

        <div className="sidebar-card">
          <span className="label">Connected wallet</span>
          <strong>{wallet ? shortenAddress(wallet) : 'Not connected'}</strong>
          <button onClick={handleConnect}>{wallet ? 'Refresh wallet' : 'Connect MetaMask'}</button>
        </div>

        <div className="sidebar-card muted">
          <span className="label">Why this is better</span>
          <ul>
            <li>Direct creator tips</li>
            <li>Premium posts behind subscriptions</li>
            <li>No platform middleman</li>
          </ul>
        </div>
      </aside>

      <main className="main-layout">
        <header className="topbar">
          <div>
            <p className="eyebrow">Hackathon MVP</p>
          </div>
          <div className="wallet-chip">{wallet ? wallet : 'Connect MetaMask to begin'}</div>
        </header>

        <div className="status-bar">{isLoading ? 'Refreshing from chain...' : status}</div>

        <section className="hero-banner">
          <div>
            <p className="eyebrow">For creators</p>
            <h3>Post content, earn tips, and lock premium drops for subscribers.</h3>
            <p>
              This version fixes premium access, improves tipping UX, and gives the app a
              cleaner social-platform feel.
            </p>
          </div>
          <div className="hero-stats">
            <div>
              <strong>{creators.length}</strong>
              <span>Creators</span>
            </div>
            <div>
              <strong>{posts.length}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{posts.filter((post) => post.isPremium).length}</strong>
              <span>Premium</span>
            </div>
          </div>
        </section>

        <section id="feed" className="content-grid">
          <div className="feed-column">
            <div className="section-header">
              <div>
                <p className="eyebrow">Latest updates</p>
                <h3>Creator feed</h3>
              </div>
            </div>

            {posts.length === 0 && <div className="panel empty">No posts published yet.</div>}

            {posts.map((post) => {
              const postCreator = creators.find(
                (creator) => creator.address.toLowerCase() === post.creator.toLowerCase()
              )
              const mine = post.creator.toLowerCase() === me

              return (
                <article className="post-card" key={post.id}>
                  <div className="post-header">
                    <div className="avatar-circle">{post.creatorName.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <h4>{post.creatorName}</h4>
                      <p>{post.createdAt}</p>
                    </div>
                    <span className={post.isPremium ? 'badge premium' : 'badge public'}>
                      {post.isPremium ? 'Subscriber only' : 'Public'}
                    </span>
                  </div>

                  <h3 className="post-title">{post.title}</h3>

                  {post.canView ? (
                    <p className="post-content">{post.content}</p>
                  ) : (
                    <div className="locked-post">
                      <strong>Premium content locked</strong>
                      <p>
                        Subscribe to <b>{post.creatorName}</b> to unlock this post.
                      </p>
                      {!mine && postCreator && (
                        <button
                          type="button"
                          style={{ zIndex: 100, position: 'relative' }}
                          onClick={() =>
                            subscribeToCreator(post.creator, postCreator.subscriptionPrice)
                          }
                        >
                          Unlock for {postCreator.subscriptionPrice} ETH
                        </button>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <div id="creators" className="side-column">
            <section className="panel">
              <div className="section-header compact">
                <div>
                  <p className="eyebrow">Discover</p>
                  <h3>Top creators</h3>
                </div>
              </div>

              <div className="creator-stack">
                {creators.length === 0 && <p>No creators registered yet.</p>}
                {creators.map((creator) => {
                  const mine = creator.address.toLowerCase() === me
                  return (
                    <div className="creator-card" key={creator.address}>
                      <div className="creator-card-top">
                        <div className="avatar-circle large">
                          {creator.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4>{creator.username}.socio</h4>
                          <p>{creator.bio || 'No bio added yet.'}</p>
                          <span>{shortenAddress(creator.address)}</span>
                        </div>
                      </div>

                      <div className="creator-metrics">
                        <div>
                          <strong>{creator.subscriptionPrice} ETH</strong>
                          <span>Subscribe</span>
                        </div>
                        <div>
                          <strong>{creator.walletBalance} ETH</strong>
                          <span>Wallet balance</span>
                        </div>
                      </div>

                      {mine ? (
                        <div className="owner-chip">Your creator profile</div>
                      ) : (
                        <>
                          <div className="inline-actions">
                            <button
                              type="button"
                              style={{ zIndex: 100, position: 'relative' }}
                              onClick={() =>
                                subscribeToCreator(creator.address, creator.subscriptionPrice)
                              }
                              disabled={creator.isSubscribed}
                            >
                              {creator.isSubscribed ? 'Subscribed' : 'Subscribe'}
                            </button>
                            <div className="tip-group">
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={tipAmounts[creator.address] ?? '0.01'}
                                onChange={(e) =>
                                  setTipAmounts((prev) => ({
                                    ...prev,
                                    [creator.address]: e.target.value
                                  }))
                                }
                              />
                              <button
                                type="button"
                                className="secondary"
                                style={{ zIndex: 100, position: 'relative' }}
                                onClick={() => tipCreator(creator.address)}
                              >
                                Tip
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="panel">
              <div className="section-header compact">
                <div>
                  <p className="eyebrow">Quick Send</p>
                  <h3>Tip by handle</h3>
                </div>
              </div>
              <form onSubmit={tipByHandle} className="tip-by-handle-form">
                <input
                  type="text"
                  placeholder="e.g. yash.socio"
                  value={handleTip.handle}
                  onChange={(e) => setHandleTip({ ...handleTip, handle: e.target.value })}
                  required
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={handleTip.amount}
                    onChange={(e) => setHandleTip({ ...handleTip, amount: e.target.value })}
                    required
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="secondary">Send Tip</button>
                </div>
              </form>
            </section>

            <section id="studio" className="studio-grid">
              <form className="panel" onSubmit={registerCreator}>
                <div className="section-header compact">
                  <div>
                    <p className="eyebrow">Creator setup</p>
                    <h3>{currentCreator ? 'Update profile' : 'Create profile'}</h3>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Username"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows="4"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Subscription price in ETH"
                  value={profileForm.subscriptionPrice}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, subscriptionPrice: e.target.value })
                  }
                  required
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ flex: 1 }}>
                    {currentCreator ? 'Update profile' : 'Register creator'}
                  </button>
                  {currentCreator && (
                    <button 
                      type="button" 
                      onClick={deactivateCreator} 
                      style={{ background: '#ff4d4f', borderColor: '#ff4d4f', color: 'white' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>

              <form className="panel" onSubmit={createPost}>
                <div className="section-header compact">
                  <div>
                    <p className="eyebrow">Creator studio</p>
                    <h3>Publish a new post</h3>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Post title"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Share an update, tutorial, release note, or premium drop"
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  rows="6"
                  required
                />
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={postForm.isPremium}
                    onChange={(e) => setPostForm({ ...postForm, isPremium: e.target.checked })}
                  />
                  Make this subscriber-only
                </label>
                <button type="submit">Publish post</button>
              </form>
            </section>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
