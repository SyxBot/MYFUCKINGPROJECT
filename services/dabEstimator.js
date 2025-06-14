
const fs = require('fs');
const path = './.dab-log.json';

function updateDailyDAB(newAmount) {
  const now = new Date().toISOString().slice(0, 10);
  let log = {};

  if (fs.existsSync(path)) {
    log = JSON.parse(fs.readFileSync(path));
  }

  log[now] = newAmount;
  fs.writeFileSync(path, JSON.stringify(log, null, 2));
  console.log(`✅ Logged ${newAmount} DAB for ${now}`);
}

function estimateForward(days = 30) {
  if (!fs.existsSync(path)) {
    console.log('⚠️ No DAB history found.');
    return;
  }

  const log = JSON.parse(fs.readFileSync(path));
  const values = Object.values(log).map(Number);
  if (values.length === 0) return;

  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const projected = average * days;

  console.log(`📈 Avg DAB/day: ${average.toFixed(2)}`);
  console.log(`🔮 Projected DAB in ${days} days: ${projected.toFixed(2)}`);
}

module.exports = { updateDailyDAB, estimateForward };
