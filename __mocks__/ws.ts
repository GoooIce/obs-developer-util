export { WebSocket as default } from 'mock-socket';

if (typeof global !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).WebSocket = require('mock-socket');
}
