import worker from 'vite-plugin-wrap-worker';
import solidPlugin from 'vite-plugin-solid';

export default {
  plugins: [worker(), solidPlugin()],
};
