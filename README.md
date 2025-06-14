
# 🚜 Virtuals Farmer Bot

An automated farming bot for virtual assets that tracks stakes, claims DAB tokens, and simulates trading opportunities.

## 🌟 Features

- **🏦 Stake Tracking**: Monitor multiple staking pools and automatically claim rewards
- **💎 DAB Token Claiming**: Auto-claim DAB tokens when thresholds are met  
- **📈 Trade Simulation**: Analyze arbitrage and swap opportunities
- **🤖 Telegram Integration**: Optional notifications via Telegram bot
- **⚙️ Configurable**: Extensive configuration options for all features

## 📁 Project Structure

```
virtuals-farmer-bot/
├── index.js              # Main entry point
├── config.js             # Configuration settings
├── abi/
│   └── staking.json      # Smart contract ABI
├── services/
│   ├── stakeTracker.js   # Stake monitoring service
│   ├── dabClaimer.js     # DAB token claiming service
│   └── tradeSimulator.js # Trading simulation service
├── telegramBot.js        # Optional Telegram integration
├── package.json          # Dependencies
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install ethers dotenv
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Blockchain Configuration
RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key_here
STAKING_CONTRACT=0x...
DAB_TOKEN_CONTRACT=0x...

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Configure Settings

Edit `config.js` to customize:
- Bot cycle intervals
- Staking pool IDs
- Claim thresholds
- Trading parameters
- Notification preferences

### 4. Run the Bot

```bash
npm start
```

## ⚙️ Configuration Options

### Bot Settings
- `cycleInterval`: How often the bot runs (default: 1 minute)
- `maxRetries`: Maximum retry attempts for failed operations
- `retryDelay`: Delay between retries

### Staking Settings
- `stakingPoolIds`: Array of pool IDs to monitor
- `autoRestake`: Automatically restake claimed rewards
- `minStakeAmount`: Minimum amount for staking operations

### DAB Claiming
- `autoClaimThreshold`: Minimum DAB amount to trigger auto-claim
- `claimInterval`: Time between claim attempts
- `maxClaimGas`: Gas limit for claim transactions

### Trading Simulation
- `enabled`: Enable/disable trading features
- `simulationOnly`: Run simulations without executing trades
- `profitThreshold`: Minimum profit percentage for opportunities
- `maxTradeAmount`: Maximum amount per trade

## 🔧 Services Overview

### StakeTracker
- Monitors staking positions across multiple pools
- Automatically claims rewards when profitable
- Supports auto-restaking of claimed rewards
- Provides detailed pool information and statistics

### DabClaimer  
- Tracks pending DAB token rewards
- Claims rewards when threshold is met
- Manages claim timing to optimize gas usage
- Reports balance updates

### TradeSimulator
- Analyzes arbitrage opportunities across DEXs
- Simulates token swap profitability
- Calculates fees, slippage, and net profits
- Can execute trades when profitable (if enabled)

### TelegramBot (Optional)
- Sends notifications for important events
- Customizable notification types
- Real-time updates on bot activities
- Error reporting and alerts

## 🛡️ Security Features

- Private keys stored in environment variables
- Configurable gas limits and prices
- Simulation mode for safe testing
- Error handling and retry mechanisms
- Graceful shutdown handling

## 📊 Monitoring

The bot provides detailed console logging for:
- Stake positions and rewards
- Claim transactions and results  
- Trading opportunities and simulations
- Error messages and retry attempts
- Performance statistics

## ⚠️ Disclaimer

This bot is for educational and research purposes. Use at your own risk:
- Test thoroughly in simulation mode first
- Never share your private keys
- Start with small amounts
- Monitor gas prices and network congestion
- Understand the risks of automated trading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the console logs for error details
2. Verify your configuration settings
3. Ensure sufficient balance for gas fees
4. Test with simulation mode enabled

---

**Happy Farming! 🚜💰**
