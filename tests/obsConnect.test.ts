import { filter, throttleTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { WebSocketOpCode, Message } from '../src/obs-websocket/types';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toBe(expected);
});

describe('connect obs', () => {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('op-0', () => {
    // const input = '-a-b-c|';
    // const expected = '-- 9ms a 9ms b 9ms c';
    testScheduler.run(({ cold, time, expectObservable, expectSubscriptions }) => {
      // const e1 = cold(input);
      // expectObservable(e1).toEqual(expected);
      const e1 = cold('-a--b--c---|');
      const e1subs = '  ^----------!';
      const t = time('  ---|          '); //t = 3
      const expected = '-aaa-----c---|';

      expectObservable(e1.pipe(throttleTime(t))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  test('op pipe', () => {
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
    const responesMessage: Message<WebSocketOpCode.RequestResponse> = {
      op: WebSocketOpCode.RequestResponse,
      d: {
        requestId: '',
        requestStatus: { result: true, code: 100 },
        requestType: 'CreateInput',
        responseData: { sceneItemId: 123 },
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    testScheduler.run(({ cold, hot, time, expectObservable, expectSubscriptions }) => {
      const hotMessage = cold('-a-b-b-c--|', {
        a: helloMessage,
        b: eventMessage,
        c: responesMessage,
      });

      const event$ = hotMessage.pipe(filter((value) => value.op === WebSocketOpCode.Event));
      expect('--b--c-').toEqual('asd');

      expectObservable(event$).toBe('-b-c--|');
    });
  });
});
