jest.unmock('../../../src/obs-websocket/subject');
jest.unmock('../../../src/obs-websocket/util');
// jest.unmock('jest-websocket-mock');
// import WS from 'jest-websocket-mock';
// learn how to mock with
// github.com/ReactiveX/rxjs/blob/47fa8d555754b18887baf15e22eb3dd91bf8bfea/spec/observables/dom/webSocket-spec.ts
import { config } from 'rxjs';
import { OBSSubject } from '../../../src/obs-websocket/subject';
import {
  EventMessage,
  EventSubscription,
  Message,
  WebSocketCloseCode,
  WebSocketOpCode,
} from '../../../src/obs-websocket/types';

config.onUnhandledError = () => {
  //TODO: bad hack
  // config.onUnhandledError = () => {
  // this.onError$.next(e);
  // };
};

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
    // config.onUnhandledError = null;
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
        error: () => {
          isAuthFailed = true;
        },
      });

      // obs.onError$.subscribe((e) => console.log(e));
      const socket = MockWebSocket.lastSocket;
      socket.open();
      // socket close with Auth Failed message
      socket.triggerClose({
        code: WebSocketCloseCode.AuthenticationFailed,
        reason: 'AuthenticationFailed',
      });
      expect(isAuthFailedCloseCode).toBeTruthy();
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
  describe('event behavior', () => {
    const sceneChangeEventMessage: Message<WebSocketOpCode.Event> = {
      op: 5,
      d: {
        eventType: 'CurrentProgramSceneChanged',
        eventIntent: 1,
        eventData: {
          sceneName: 'foo',
        },
      } as EventMessage<'CurrentProgramSceneChanged'>,
    };
    beforeEach(() => {
      setupMockWebSocket();
      // obs = OBSSubject.getSubject({ url: 'ws://mysocket' });
    });

    afterEach(() => {
      teardownMockWebSocket();
      OBSSubject.unsubscribe();
    });
    it('fromEvent should work', () => {
      let sceneChange = false;
      const obs = OBSSubject.getSubject({ url: 'ws://mysocket' });
      obs.fromEvent('CurrentProgramSceneChanged').subscribe((e) => {
        if (e.eventType === 'CurrentProgramSceneChanged') {
          sceneChange = true;
        }
      });
      const socket = MockWebSocket.lastSocket;
      socket.open();
      socket.triggerMessage(JSON.stringify(sceneChangeEventMessage));
      expect(sceneChange).toBeTruthy();
    });
  });
});
