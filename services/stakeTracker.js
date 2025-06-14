const { ethers } = require('ethers');
const { rpcUrl, walletAddress } = require('../config');
const stakingAbi = require('../abi/staking.json');

// Replace with actual contract address
const STAKING_CONTRACT_ADDRESS = process.env.STAKING_CONTRACT || '0xYourStakingContract';

class StakeTracker {
  constructor() {
    this.provider = null;
    this.stakingContract = null;
  }

  async initialize() {
    console.log('🔧 Initializing Stake Tracker...');

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.stakingContract = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, this.provider);

    console.log('✅ Stake Tracker initialized');
  }

  async checkStakes() {
    console.log('👀 Checking stakes...');

    try {
      const stakes = await this.stakingContract.getUserStakes(walletAddress);

      console.log(`🔍 Stakes for wallet ${walletAddress}:`);
      stakes.forEach(s => {
        const daysLeft = (Number(s.unlockTime) * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
        console.log(`• Agent: ${s.agent} | Amount: ${ethers.formatUnits(s.amount, 18)} | Unlocks in: ${daysLeft.toFixed(1)} days`);
      });

    } catch (error) {
      console.error('❌ Error checking stakes:', error);
    }
  }
}

async function trackStakes() {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, provider);

  const stakes = await staking.getUserStakes(walletAddress);

  console.log(`🔍 Stakes for wallet ${walletAddress}:`);
  stakes.forEach(s => {
    const daysLeft = (Number(s.unlockTime) * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
    console.log(`• Agent: ${s.agent} | Amount: ${ethers.formatUnits(s.amount, 18)} | Unlocks in: ${daysLeft.toFixed(1)} days`);
  });
}

module.exports = { StakeTracker, trackStakes };