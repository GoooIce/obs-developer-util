jest.unmock('../../src/timeLapse');
import { makeLapseObservable } from '../../src/timeLapse';
import { TestScheduler } from 'rxjs/testing';

describe('timeLapse', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('timeLapse$', () => {
    testScheduler.run(({ expectObservable }) => {
      const colors = '1000ms a 999ms b 999ms c 999ms d 49ms (e|)';

      expectObservable(makeLapseObservable(1000)).toBe(colors);
    });
  });
});
