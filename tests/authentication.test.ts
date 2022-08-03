jest.unmock('../src/obs-websocket/util');
import { EventSubscription, Message, WebSocketOpCode } from '../src/obs-websocket/types';
import { genAuthString, needAuth, genIdentifyMessage } from '../src/obs-websocket/util';

describe('authentication', () => {
  const salt = 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=';
  const challenge = '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=';
  const password = 'supersecretpassword';
  const rightAuthString = '1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=';
  const needAuthMsg: Message<WebSocketOpCode.Hello> = {
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
  const doNotNeedAuthMsg: Message<WebSocketOpCode.Hello> = {
    op: WebSocketOpCode.Hello,
    d: {
      obsWebSocketVersion: '5.0.0',
      rpcVersion: 1,
    },
  };
  it('server need auth', () => {
    expect(needAuth(needAuthMsg)).toBe(true);
  });
  it('server do not need auth', () => {
    expect(needAuth(doNotNeedAuthMsg)).toBe(false);
  });
  it('gen obs auth string', () => {
    expect(genAuthString({ salt, challenge }, password)).toBe(rightAuthString);
  });
  it('re back hello op by identify', () => {
    const outWithAuthMsg: Message<WebSocketOpCode.Identify> = genIdentifyMessage(
      needAuthMsg,
      EventSubscription.None,
      password
    );
    expect(outWithAuthMsg).toStrictEqual({
      op: 1,
      d: {
        rpcVersion: 1,
        authentication: rightAuthString,
        eventSubscriptions: 0,
      },
    });
    const outWithOutAuthMsg: Message<WebSocketOpCode.Identify> = genIdentifyMessage(
      doNotNeedAuthMsg,
      EventSubscription.None,
      ''
    );
    expect(outWithOutAuthMsg).toStrictEqual({
      op: 1,
      d: {
        rpcVersion: 1,
        eventSubscriptions: 0,
      },
    });
  });
});
