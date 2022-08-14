import { tipWithWebview } from '....src\tipWithWebview';
import { TestScheduler } from 'rxjs/testing';

describe('tipWithWebview', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
  });
});
