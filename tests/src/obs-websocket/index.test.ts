// import * as index from '../../src/obs-websocket';
import { TestScheduler } from 'rxjs/testing';

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('index', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  // it('should export static websocket subject creator functions', () => {
  //   // expect(index.webSocket).toBeDefined();
  // });

  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  it.skip('auth', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
  });
});
