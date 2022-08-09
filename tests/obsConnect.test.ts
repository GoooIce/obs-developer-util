/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { filter, throttleTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { WebSocketOpCode, Message } from '../src/obs-websocket/types';

describe('connect obs', () => {
  const helloMessage: Message<WebSocketOpCode.Hello> = {
    op: WebSocketOpCode.Hello,
    d: {
      obsWebSocketVersion: '5.0.0',
      rpcVersion: 1,
    },
  };
  const eventMessage: Message<WebSocketOpCode.Event> = {
    op: WebSocketOpCode.Event,
    d: {
      eventType: 'CurrentPreviewSceneChanged',
      eventIntent: 2,
      eventData: { sceneName: 'mov' },
    },
  };
  const responseMessage: Message<WebSocketOpCode.RequestResponse> = {
    op: WebSocketOpCode.RequestResponse,
    d: {
      requestId: '',
      requestStatus: { result: true, code: 100 },
      requestType: 'CreateInput',
      responseData: { sceneItemId: 123 },
    },
  };
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('op-0', () => {
    // const input = '-a-b-c|';
    // const expected = '-- 9ms a 9ms b 9ms c';
    testScheduler.run(({ cold, time, expectObservable, expectSubscriptions }) => {
      // const e1 = cold(input);
      // expectObservable(e1).toEqual(expected);
      const e1 = cold('-a--b--c---|');
      const e1subs = '  ^----------!';
      const t = time('  ---|          '); //t = 3
      const expected = '-a-----c---|';

      expectObservable(e1.pipe(throttleTime(t))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  test('op pipe', () => {
    testScheduler.run(({ expectObservable, cold }) => {
      const hotMessage = cold('-a-b-b-c--|', {
        a: helloMessage,
        b: eventMessage,
        c: responseMessage,
      });

      expectObservable(
        hotMessage.pipe(filter<Message>((value) => value.op === WebSocketOpCode.Event))
      ).toBe('---b-b----|', { b: eventMessage });
    });
  });

  test('hello op subject', () => {
    const identifyMessage = {
      op: WebSocketOpCode.Identify,
      d: { rpcVersion: 1, eventSubscriptions: 0 },
    };
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const websocketServer = hot<Message>('-a-|', { a: helloMessage });

      websocketServer.subscribe({
        next(value) {
          if (value.op === WebSocketOpCode.Hello)
            websocketServer.next({
              op: WebSocketOpCode.Identify,
              d: { rpcVersion: 1, eventSubscriptions: 0 },
            });
        },
        error(err) {
          console.log(err);
        },
        complete() {
          console.log('complete');
        },
      });

      // websocketServer.unsubscribe();

      const subscriptionsWithHello = websocketServer.subscriptions;
      console.log(subscriptionsWithHello);
      // expectObservable(websocketServer).toBe('-ba|', {
      //   a: helloMessage,
      //   b: identifyMessage,
      // });
    });
  });
});
