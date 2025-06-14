const { ethers } = require('ethers');
const config = require('../config');

class DabClaimer {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.dabContract = null;
    this.lastClaimTime = 0;
  }

  async initialize() {
    console.log('🔧 Initializing DAB Claimer...');

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Initialize DAB token contract (you'll need the ABI)
    // this.dabContract = new ethers.Contract(config.blockchain.dabTokenContract, dabAbi, this.wallet);

    console.log('✅ DAB Claimer initialized');
  }

  async claimRewards() {
    try {
      console.log('💎 Checking DAB rewards...');

      // Mock implementation - replace with actual contract calls
      const pendingRewards = ethers.parseEther('5.0'); // Mock 5 DAB tokens

      if (pendingRewards > ethers.parseEther(config.dab.autoClaimThreshold)) {
        console.log('🎯 Claiming DAB rewards...');
        // const tx = await this.dabContract.claimRewards();
        // await tx.wait();
        console.log('✅ DAB rewards claimed successfully');
        return true;
      }

      console.log('📊 No DAB rewards to claim yet');
      return false;
    } catch (error) {
      console.error('❌ Error claiming DAB rewards:', error);
      return false;
    }
  }
}

async function autoClaimDAB() {
  const claimer = new DabClaimer();
  await claimer.initialize();
  await claimer.claimRewards();
}

module.exports = { DabClaimer, autoClaimDAB };


class DabClaimer {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.dabContract = null;
    this.lastClaimTime = 0;
  }

  async initialize() {
    console.log('🔧 Initializing DAB Claimer...');

    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

    // Basic ERC20 ABI for DAB token interactions
    const erc20Abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function transfer(address to, uint256 amount) returns (bool)',
      'function claimDailyReward() external',
      'function getPendingRewards(address user) view returns (uint256)'
    ];

    this.dabContract = new ethers.Contract(
      config.blockchain.dabTokenContract,
      erc20Abi,
      this.wallet
    );

    console.log('✅ DAB Claimer initialized');
  }

  async claimRewards() {
    console.log('💎 Checking DAB rewards...');

    try {
      // Check if enough time has passed since last claim
      const now = Date.now();
      if (now - this.lastClaimTime < config.dab.claimInterval) {
        console.log('⏰ Not enough time passed since last claim');
        return;
      }

      const userAddress = await this.wallet.getAddress();
      const pendingRewards = await this.getPendingRewards(userAddress);

      console.log(`💰 Pending DAB rewards: ${ethers.formatEther(pendingRewards)} DAB`);

      if (pendingRewards >= ethers.parseEther(config.dab.autoClaimThreshold)) {
        await this.executeClaim();
        this.lastClaimTime = now;
      } else {
        console.log('💸 Rewards below threshold, skipping claim');
      }

    } catch (error) {
      console.error('❌ Error claiming DAB rewards:', error);
    }
  }

  async getPendingRewards(userAddress) {
    try {
      return await this.dabContract.getPendingRewards(userAddress);
    } catch (error) {
      console.error('❌ Error getting pending rewards:', error);
      return ethers.parseEther('0');
    }
  }

  async executeClaim() {
    try {
      console.log('🎯 Claiming DAB rewards...');

      const tx = await this.dabContract.claimDailyReward({
        gasLimit: config.dab.maxClaimGas,
        gasPrice: config.blockchain.gasPrice
      });

      console.log(`📝 DAB claim transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log('✅ DAB rewards claimed successfully');

      // Check new balance
      const userAddress = await this.wallet.getAddress();
      const balance = await this.dabContract.balanceOf(userAddress);
      console.log(`💰 New DAB balance: ${ethers.formatEther(balance)} DAB`);

    } catch (error) {
      console.error('❌ Error executing DAB claim:', error);
    }
  }

  async getBalance() {
    try {
      const userAddress = await this.wallet.getAddress();
      const balance = await this.dabContract.balanceOf(userAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Error getting DAB balance:', error);
      return '0';
    }
  }
}

module.exports = DabClaimer;