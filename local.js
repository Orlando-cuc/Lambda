'use strict';
const { handler } = require('./handler');

const idReporte = Number(process.argv[2] || 10);
const started = Date.now();
const fakeContext = {
  awsRequestId: `local-${Date.now()}`,
  getRemainingTimeInMillis: () => Math.max(0, 12 * 60 * 1000 - (Date.now() - started))
};

handler({ idReporte }, fakeContext)
  .then((result) => { console.log(JSON.stringify(result, null, 2)); process.exit(result.success ? 0 : 1); })
  .catch((error) => { console.error(error); process.exit(1); });
