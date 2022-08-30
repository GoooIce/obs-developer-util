/* eslint-disable @typescript-eslint/no-unused-vars */
jest.unmock('../../../src/obs-websocket/subject');
jest.unmock('../../../src/obs-websocket/util');
jest.unmock('jest-websocket-mock');
import WS from 'jest-websocket-mock';
import { OBSSubject } from '../../../src/obs-websocket/subject';
import { Message, WebSocketOpCode } from '../../../src/obs-websocket/types';
// import { TestScheduler } from 'rxjs/testing';

describe('subject', () => {
  let ws: WS;
  const password = 'supersecretpassword';
  const helloOpMsg: Message<WebSocketOpCode.Hello> = {
    op: WebSocketOpCode.Hello,
    d: { obsWebSocketVersion: '5.0.0', rpcVersion: 1 },
  };
  const helloOpMsgWithAuth: Message<WebSocketOpCode.Hello> = {
    op: WebSocketOpCode.Hello,
    d: {
      obsWebSocketVersion: '5.0.0',
      rpcVersion: 1,
      authentication: {
        challenge: '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=',
        salt: 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=',
      },
    },
  };
  const identifyOpMsg: Message<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: { rpcVersion: 1 },
  };
  const identifyOpMsgWithAuth: Message<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: { rpcVersion: 1, authentication: '1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=' },
  };

  const identifiedOpMsg: Message<WebSocketOpCode.Identified> = {
    op: WebSocketOpCode.Identified,
    d: {
      negotiatedRpcVersion: 1,
    },
  };
  // let testScheduler: TestScheduler;
  beforeEach(() => {
    ws = new WS('ws://localhost:4455', { jsonProtocol: true });
    // testScheduler = new TestScheduler((actual, expected) => {
    //   expect(actual).toEqual(expected);
    // });
  });
  afterEach(() => WS.clean());

  it('jest-websocket-mock work', () => {
    const client = new WebSocket('ws://localhost:4455');
    client.send('{"result":true, "count":42}');

    expect(ws).toReceiveMessage({ result: true, count: 42 });
    // expect(ws).toHaveReceivedMessages(['hello']);
  });

  it('obssubject next send message', () => {
    const obs = OBSSubject.getSubject();
    obs.next(identifyOpMsg);
    expect(ws).toReceiveMessage(identifiedOpMsg);
  });

  it('sigleton', () => {
    // testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
    const obs1 = OBSSubject.getSubject();
    const obs2 = OBSSubject.getSubject();

    expect(obs1).toBe(obs2);
  });

  it('onOpen singleton', () => {
    let foo = true;
    const obs = OBSSubject.getSubject();
    const obs_ext = OBSSubject.getSubject();
    obs_ext.onOpen$.subscribe({
      next: () => {
        foo = false;
      },
    });
    obs.onOpen$.next();

    expect(foo).toBeFalsy();
  });

  it('onAuth', () => {
    const obs = OBSSubject.getSubject();
    obs.onAuth$.subscribe({
      next: (value) => {
        obs.password$.next(password);
      },
    });

    // ws.connected;
    ws.send(helloOpMsgWithAuth);
    expect(obs.identified).toBeFalsy();
    ws.send({
      op: WebSocketOpCode.Identified,
      d: {
        negotiatedRpcVersion: 1,
      },
    });
    expect(obs.identified).toBeTruthy();
  });
});
