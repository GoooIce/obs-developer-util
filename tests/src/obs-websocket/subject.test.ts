/* eslint-disable @typescript-eslint/no-unused-vars */
jest.unmock('../../../src/obs-websocket/subject');
jest.unmock('../../../src/obs-websocket/util');
// jest.unmock('jest-websocket-mock');
// import WS from 'jest-websocket-mock';
// learn how to mock with
// github.com/ReactiveX/rxjs/blob/47fa8d555754b18887baf15e22eb3dd91bf8bfea/spec/observables/dom/webSocket-spec.ts
import { firstValueFrom } from 'rxjs';
import { OBSSubject } from '../../../src/obs-websocket/subject';
import {
  EventSubscription,
  Message,
  WebSocketCloseCode,
  WebSocketOpCode,
} from '../../../src/obs-websocket/types';
import { webSocket } from 'rxjs/webSocket';
// import { TestScheduler } from 'rxjs/testing';

const root: any =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  global;

enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
class MockWebSocket {
  static sockets: Array<MockWebSocket> = [];
  static get lastSocket(): MockWebSocket {
    const socket = MockWebSocket.sockets;
    const length = socket.length;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return length > 0 ? socket[length - 1] : undefined!;
  }

  static clearSockets(): void {
    MockWebSocket.sockets.length = 0;
  }

  sent: string[] = [];
  handlers: any = {};
  readyState: WebSocketState = WebSocketState.CONNECTING;
  closeCode: any;
  closeReason: any;
  binaryType?: string;

  constructor(public url: string, public protocol: string) {
    MockWebSocket.sockets.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  get lastMessageSent(): string {
    const sent = this.sent;
    const length = sent.length;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return length > 0 ? sent[length - 1] : undefined!;
  }

  triggerClose(e: Partial<CloseEvent>): void {
    this.readyState = WebSocketState.CLOSED;
    this.trigger('close', e);
  }

  triggerMessage(data: any): void {
    const messageEvent = {
      data: data,
      origin: 'mockorigin',
      ports: undefined as any,
      source: root,
    };

    this.trigger('message', messageEvent);
  }

  open(): void {
    this.readyState = WebSocketState.OPEN;
    this.trigger('open', {});
  }

  close(code: any, reason: any): void {
    if (this.readyState < WebSocketState.CLOSING) {
      this.readyState = WebSocketState.CLOSING;
      this.closeCode = code;
      this.closeReason = reason;
    }
  }

  trigger(this: any, name: string, e: any) {
    if (this['on' + name]) {
      this['on' + name](e);
    }

    const lookup = this.handlers[name];
    if (lookup) {
      for (let i = 0; i < lookup.length; i++) {
        lookup[i](e);
      }
    }
  }
}

describe('subject', () => {
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
    d: { rpcVersion: 1, eventSubscriptions: EventSubscription.All },
  };
  const identifyOpMsgWithAuth: Message<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: {
      rpcVersion: 1,
      eventSubscriptions: EventSubscription.All,
      authentication: '1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=',
    },
  };

  const identifiedOpMsg: Message<WebSocketOpCode.Identified> = {
    op: WebSocketOpCode.Identified,
    d: {
      negotiatedRpcVersion: 1,
    },
  };
  // let testScheduler: TestScheduler;
  // let obs: OBSSubject;
  let __ws: any;

  function setupMockWebSocket() {
    __ws = root.WebSocket;
    root.WebSocket = MockWebSocket;
  }

  function teardownMockWebSocket() {
    root.WebSocket = __ws;
    MockWebSocket.clearSockets();
  }

  describe('object behavior', () => {
    beforeEach(() => {
      setupMockWebSocket();
      // obs = OBSSubject.getSubject({ url: 'ws://mysocket' });
    });

    afterEach(() => {
      teardownMockWebSocket();
      OBSSubject.unsubscribe();
    });
    it('singleton', () => {
      const obs1 = OBSSubject.getSubject({ url: 'ws://mysocket' });
      const obs2 = OBSSubject.getSubject();
      const socket = MockWebSocket.lastSocket;
      expect(socket.url).toEqual('ws://mysocket');
      expect(obs1).toBe(obs2);
      socket.open();
      expect(MockWebSocket.sockets.length).toBe(1);
    });
  });

  describe('auth behavior', () => {
    beforeEach(() => {
      setupMockWebSocket();
      // obs = OBSSubject.getSubject({ url: 'ws://mysocket' });
    });

    afterEach(() => {
      teardownMockWebSocket();
      OBSSubject.unsubscribe();
    });

    // afterAll(() => {
    //   teardownRootWebSocket();
    // });
    it('auth failed', () => {
      let isAuthFailed = false;
      let isAuthFailedCloseCode = false;
      const obs = OBSSubject.getSubject({ url: 'ws://mysocket' });
      obs.onClose$.subscribe((e) => {
        // dont allow exec
        if (e.code === WebSocketCloseCode.AuthenticationFailed) isAuthFailedCloseCode = true;
      });

      obs.onAuth$.subscribe({
        error: (e) => {
          isAuthFailed = true;
        },
      });
      const socket = MockWebSocket.lastSocket;
      socket.open();
      // socket close with Auth Faild message
      socket.triggerClose({ code: WebSocketCloseCode.AuthenticationFailed });
      expect(isAuthFailedCloseCode).toBeFalsy();
      expect(isAuthFailed).toBeTruthy();
    });

    it('if dont need auth client should receive hello messages until identified', () => {
      let identifiedReceived = false;
      const obs = OBSSubject.getSubject({ url: 'ws://mysocket' });

      obs.onIdentified$.subscribe((x) => {
        identifiedReceived = x;
      });

      const socket = MockWebSocket.lastSocket;
      expect(socket.url).toEqual('ws://mysocket');

      socket.open();
      socket.triggerMessage(JSON.stringify(helloOpMsg));
      expect(socket.lastMessageSent).toEqual(JSON.stringify(identifyOpMsg));
      socket.triggerMessage(JSON.stringify(identifiedOpMsg));
      expect(identifiedReceived).toBeTruthy();
    });

    it('if need auth, client should receive hello message util onAuth$.next', () => {
      let onAuthReceived = false;
      let identifiedReceived = false;
      const obs = OBSSubject.getSubject({ url: 'ws://mysocket' });

      obs.onIdentified$.subscribe((x) => {
        identifiedReceived = x;
      });

      obs.onAuth$.subscribe(() => {
        onAuthReceived = true;
        obs.password$.next(password);
      });

      const socket = MockWebSocket.lastSocket;
      socket.open();
      socket.triggerMessage(JSON.stringify(helloOpMsgWithAuth));
      expect(onAuthReceived).toBeTruthy();
      expect(socket.lastMessageSent).toEqual(JSON.stringify(identifyOpMsgWithAuth));
      socket.triggerMessage(JSON.stringify(identifiedOpMsg));
      expect(identifiedReceived).toBeTruthy();
    });
  });
});

/*


// it('sigleton', () => {
//   // testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
//   const obs1 = OBSSubject.getSubject();
//   const obs2 = OBSSubject.getSubject();

//   expect(obs1).toBe(obs2);
// });

// it('onOpen singleton', () => {
//   let foo = true;
//   const obs = OBSSubject.getSubject();
//   const obs_ext = OBSSubject.getSubject();
//   obs_ext.onOpen$.subscribe({
//     next: () => {
//       foo = false;
//     },
//   });
//   obs.onOpen$.next();

//   expect(foo).toBeFalsy();
// });

// it('onAuth', () => {
//   const obs = OBSSubject.getSubject();
//   obs.onAuth$.subscribe({
//     next: (value) => {
//       obs.password$.next(password);
//     },
//   });

//   // ws.connected;
//   ws.send(helloOpMsgWithAuth);
//   expect(ws).toReceiveMessage(identifyOpMsgWithAuth);
// });

// it('identified', () => {
//   return new Promise<void>((done) => {
//     let foo = false;
//     const obs = OBSSubject.getSubject();
//     obs.onIdentified$.subscribe({
//       next: (value) => {
//         foo = value;
//         expect(foo).toBeTruthy();
//         done();
//       },
//     });
//     expect(foo).toBeFalsy();
//     ws.send({
//       op: WebSocketOpCode.Identified,
//       d: {
//         negotiatedRpcVersion: 1,
//       },
//     });

//     return firstValueFrom(obs.onIdentified$);
//   });
// });
// });
*/
