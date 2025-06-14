const { trackStakes } = require('./services/stakeTracker');

async function main() {
  console.log('🔐 Running read-only Virtuals monitor...');
  await trackStakes();
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));