jest.unmock('../../src/timeLapse');
import { makeLapseObservable } from '../../src/timeLapse';
import { TestScheduler } from 'rxjs/testing';
import { map, take, tap } from 'rxjs';
import { OBSSubject } from '../../src/obs-websocket/subject';

OBSSubject.getSubject = jest.fn().mockReturnValue({
  ResumeRecord: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
  PauseRecord: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
});

describe('timeLapse', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('timeLapse$', () => {
    testScheduler.run(({ expectObservable }) => {
      const timeLine = '1000ms a 2000ms a 3000ms a 4000ms a |';
      // makeLapseObservable(1000).pipe(take(4), tap(console.log));

      expectObservable(
        makeLapseObservable(1000).pipe(
          map(() => 0),
          take(4)
        )
      ).toBe(timeLine, { a: 0 });
    });
  });
});
