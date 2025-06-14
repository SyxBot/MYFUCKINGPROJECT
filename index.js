const { trackStakes } = require('./services/stakeTracker');
const { updateDailyDAB, estimateForward } = require('./services/dabEstimator');

(async () => {
  console.log('🔐 Running read-only Virtuals monitor...');
  await trackStakes();
  
  // Example: Log today's DAB manually
  updateDailyDAB(3270); // <- your actual claimed DAB
  
  // Get forecast
  estimateForward(7);
  estimateForward(30);
})();
