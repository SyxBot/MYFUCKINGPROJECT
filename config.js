
module.exports = {
  // Bot settings
  bot: {
    cycleInterval: 60000, // 1 minute in milliseconds
    maxRetries: 3,
    retryDelay: 5000
  },

  // Blockchain settings
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    privateKey: process.env.PRIVATE_KEY || '',
    stakingContract: process.env.STAKING_CONTRACT || '0x...',
    dabTokenContract: process.env.DAB_TOKEN_CONTRACT || '0x...',
    gasLimit: 500000,
    gasPrice: '20000000000' // 20 gwei
  },

  // Staking settings
  staking: {
    minStakeAmount: '100000000000000000000', // 100 tokens in wei
    autoRestake: true,
    stakingPoolIds: [1, 2, 3] // Pool IDs to monitor
  },

  // DAB claiming settings
  dab: {
    autoClaimThreshold: '1000000000000000000', // 1 DAB token in wei
    claimInterval: 3600000, // 1 hour in milliseconds
    maxClaimGas: 300000
  },

  // Trade simulation settings
  trading: {
    enabled: true,
    maxTradeAmount: '50000000000000000000', // 50 tokens in wei
    profitThreshold: 0.05, // 5% profit threshold
    slippageTolerance: 0.02, // 2% slippage
    simulationOnly: true // Set to false for real trading
  },

  // Telegram bot settings
  telegram: {
    enabled: false,
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    notifications: {
      stakes: true,
      claims: true,
      trades: true,
      errors: true
    }
  },

  // Logging settings
  logging: {
    level: 'info',
    logFile: './bot.log',
    maxLogSize: '10MB'
  }
};
