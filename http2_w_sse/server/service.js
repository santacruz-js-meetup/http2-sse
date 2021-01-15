// module.exports = (input, callback) => {
// 	setTimeout(() => 	callback(null, input + ' 42'), 10000);
// }

const { workerData, parentPort } = require('worker_threads')

// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
setTimeout(() => 	parentPort.postMessage(42), 10000);