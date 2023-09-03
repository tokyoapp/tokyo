const worker = require('vite-plugin-wrap-worker');

module.exports = {
  plugins: [worker()],
};
