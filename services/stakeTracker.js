const { ethers } = require('ethers');
const { rpcUrl, walletAddress } = require('../config');
const stakingAbi = require('../abi/staking.json');

const STAKING_CONTRACT_ADDRESS = '0x60a203ddcDE45fbfb325bdeEA93824B5726b4dF8';

async function trackStakes() {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const staking = new ethers.Contract(STAKING_CONTRACT_ADDRESS, stakingAbi, provider);

    try {
        const stakedAmount = await staking.stakedAmountOf(walletAddress);
        console.log(`🪙 Wallet ${walletAddress} has staked: ${ethers.formatUnits(stakedAmount, 18)} tokens`);
    } catch (error) {
        console.error('❌ Error fetching staked amount:', error);
    }
}

module.exports = { trackStakes };
