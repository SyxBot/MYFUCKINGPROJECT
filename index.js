const { trackStakes } = require('./services/stakeTracker');

(async () => {
  console.log('🔐 Running read-only Virtuals monitor...');
  await trackStakes();
})();
