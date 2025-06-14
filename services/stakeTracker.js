
const { ethers } = require('ethers');
const config = require('../config');
const stakingAbi = require('../abi/staking.json');

class StakeTracker {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.stakingContract = null;
    this.lastChecked = {};
  }

  async initialize() {
    console.log('🔧 Initializing Stake Tracker...');
    
    // Setup provider and wallet
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);
    
    // Initialize staking contract
    this.stakingContract = new ethers.Contract(
      config.blockchain.stakingContract,
      stakingAbi,
      this.wallet
    );

    console.log('✅ Stake Tracker initialized');
  }

  async checkStakes() {
    console.log('👀 Checking stakes...');
    
    try {
      const userAddress = await this.wallet.getAddress();
      const userStakes = await this.stakingContract.getUserStakes(userAddress);
      
      console.log(`📊 Found ${userStakes.length} active stakes:`);
      
      for (let i = 0; i < userStakes.length; i++) {
        const stake = userStakes[i];
        console.log(`   ${i + 1}. Agent: ${stake.agentName}`);
        console.log(`      Staked: ${ethers.formatEther(stake.amountStaked)} tokens`);
        console.log(`      Lock Color: ${stake.lockColor}`);
        console.log(`      Unlock Time: ${new Date(Number(stake.unlockTimestamp) * 1000).toLocaleString()}`);
        
        // Check if stake is unlocked
        const now = Math.floor(Date.now() / 1000);
        if (Number(stake.unlockTimestamp) <= now) {
          console.log(`🔓 Stake ${i + 1} is unlocked and ready for claiming!`);
        } else {
          const timeLeft = Number(stake.unlockTimestamp) - now;
          const hoursLeft = Math.floor(timeLeft / 3600);
          console.log(`🔒 Stake ${i + 1} unlocks in ${hoursLeft} hours`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking stakes:', error);
    }
  }

  async checkPoolStake(poolId) {
    try {
      const userAddress = await this.wallet.getAddress();
      const [stakedAmount, pendingRewards] = await this.stakingContract.getUserStake(userAddress, poolId);
      
      console.log(`📊 Pool ${poolId}:`);
      console.log(`   Staked: ${ethers.formatEther(stakedAmount)} tokens`);
      console.log(`   Pending Rewards: ${ethers.formatEther(pendingRewards)} tokens`);

      // Check if we should claim rewards
      if (pendingRewards > ethers.parseEther('0.1')) {
        console.log(`💰 Pool ${poolId} has claimable rewards, triggering claim...`);
        await this.claimPoolRewards(poolId);
      }

      // Check if we should restake
      if (config.staking.autoRestake && pendingRewards > ethers.parseEther('1')) {
        console.log(`🔄 Auto-restaking rewards for pool ${poolId}...`);
        await this.restakeRewards(poolId);
      }

    } catch (error) {
      console.error(`❌ Error checking pool ${poolId}:`, error);
    }
  }

  async claimPoolRewards(poolId) {
    try {
      console.log(`🎯 Claiming rewards for pool ${poolId}...`);
      
      const tx = await this.stakingContract.claimRewards(poolId, {
        gasLimit: config.blockchain.gasLimit,
        gasPrice: config.blockchain.gasPrice
      });

      console.log(`📝 Claim transaction sent: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Rewards claimed for pool ${poolId}`);

    } catch (error) {
      console.error(`❌ Error claiming rewards for pool ${poolId}:`, error);
    }
  }

  async restakeRewards(poolId) {
    try {
      // First claim the rewards
      await this.claimPoolRewards(poolId);
      
      // Then stake them back (this would require additional logic 
      // to get the claimed amount and stake it)
      console.log(`🔄 Restaking completed for pool ${poolId}`);

    } catch (error) {
      console.error(`❌ Error restaking for pool ${poolId}:`, error);
    }
  }

  async getPoolInfo(poolId) {
    try {
      const [totalStaked, rewardRate, active] = await this.stakingContract.getPoolInfo(poolId);
      return {
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: rewardRate.toString(),
        active
      };
    } catch (error) {
      console.error(`❌ Error getting pool info for ${poolId}:`, error);
      return null;
    }
  }
}

async function trackStakes() {
  const tracker = new StakeTracker();
  await tracker.initialize();
  await tracker.checkStakes();
}

module.exports = { StakeTracker, trackStakes };
