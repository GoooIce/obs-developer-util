jest.unmock('../src/obs-websocket/util');
import { IncomingMessage, WebSocketOpCode } from '../src/obs-websocket/types';
import { genAuthString, needAuth } from '../src/obs-websocket/util';

describe('authentication', () => {
  it('server need auth', () => {
    const msg: IncomingMessage<WebSocketOpCode.Hello> = {
      op: WebSocketOpCode.Hello,
      d: {
        obsWebSocketVersion: '5.0.0',
        rpcVersion: 1,
        authentication: {
          salt: 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=',
          challenge: '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=',
        },
      },
    };
    expect(needAuth(msg)).toBe(true);
  });
  it('server do not need auth', () => {
    const msg: IncomingMessage<WebSocketOpCode.Hello> = {
      op: WebSocketOpCode.Hello,
      d: {
        obsWebSocketVersion: '5.0.0',
        rpcVersion: 1,
      },
    };
    expect(needAuth(msg)).toBe(false);
  });
  it('gen obs auth string', () => {
    const salt = 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=';
    const challenge = '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=';
    const password = 'supersecretpassword';
    const authString = genAuthString({ salt, challenge }, password);
    expect(authString).toBe('1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=');
  });
});
