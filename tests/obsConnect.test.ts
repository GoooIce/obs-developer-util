import { throttleTime } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

const testScheduler = new TestScheduler((actual, expected) => {
  expect(actual).toBe(expected);
});

describe('tcr test', () => {
  it('true', () => {
    const t = 1 == 1;
    expect(t === true).toBe(true);
  });
});

describe('connect obs', () => {
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
});
