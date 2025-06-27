const assert = require('assert');
const { classifyText } = require('../lib/classifier');

(async () => {
  const res = await classifyText('Spent 100 SAR at Store');
  assert.strictEqual(res.amount, '100');
  assert.strictEqual(res.currency, 'SAR');
  console.log('All tests passed');
})();
