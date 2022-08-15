// import { tipWithWebview } from '....src\tipWithWebview';
import { TestScheduler } from 'rxjs/testing';

describe.skip('tipWithWebview', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it.skip('', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
  });
});
