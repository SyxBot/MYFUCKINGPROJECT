const StakeTracker = require('./services/stakeTracker');
const DabClaimer = require('./services/dabClaimer');
const TradeSimulator = require('./services/tradeSimulator');
const TelegramBot = require('./telegramBot');
const config = require('./config');

class VirtualsFarmerBot {
  constructor() {
    this.stakeTracker = new StakeTracker();
    this.dabClaimer = new DabClaimer();
    this.tradeSimulator = new TradeSimulator();
    this.telegramBot = config.telegram.enabled ? new TelegramBot() : null;
    this.isRunning = false;
  }

  async start() {
    console.log('🚀 Starting Virtuals Farmer Bot...');
    this.isRunning = true;

    try {
      // Initialize services
      await this.stakeTracker.initialize();
      await this.dabClaimer.initialize();
      await this.tradeSimulator.initialize();
      
      if (this.telegramBot) {
        await this.telegramBot.start();
      }

      console.log('✅ All services initialized successfully');

      // Start main bot loop
      this.runMainLoop();

    } catch (error) {
      console.error('❌ Failed to start bot:', error);
      process.exit(1);
    }
  }

  async runMainLoop() {
    while (this.isRunning) {
      try {
        console.log('🔄 Running bot cycle...');

        // Track stakes
        await this.stakeTracker.checkStakes();

        // Claim DAB tokens
        await this.dabClaimer.claimRewards();

        // Run trade simulations
        await this.tradeSimulator.runSimulations();

        // Wait before next cycle
        await this.sleep(config.bot.cycleInterval);

      } catch (error) {
        console.error('❌ Error in main loop:', error);
        await this.sleep(5000); // Wait 5 seconds before retrying
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 Stopping Virtuals Farmer Bot...');
    this.isRunning = false;
    
    if (this.telegramBot) {
      await this.telegramBot.stop();
    }
    
    console.log('✅ Bot stopped successfully');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received SIGINT, shutting down gracefully...');
  if (global.bot) {
    await global.bot.stop();
  }
  process.exit(0);
});

// Start the bot
async function main() {
  const bot = new VirtualsFarmerBot();
  global.bot = bot;
  await bot.start();
}

main().catch(console.error);