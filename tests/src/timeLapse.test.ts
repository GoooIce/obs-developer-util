jest.unmock('../../src/timeLapse');
import { makeLapseObservable } from '../../src/timeLapse';
import { TestScheduler } from 'rxjs/testing';
import { take } from 'rxjs';
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

  it('timeLapse$ 1000ms', () => {
    testScheduler.run(({ expectObservable }) => {
      const timeLine = 'a 4999ms b 4999ms (c|)';
      const values = {
        a: 0,
        b: 1,
        c: 2,
      };
      const _$ = makeLapseObservable(5000).pipe(take(3));
      // _$.subscribe(console.log);

      expectObservable(_$).toBe(timeLine, values);
    });
  });

  it('timeLapse$ 3', () => {
    testScheduler.run(({ expectObservable }) => {
      const timeLine = 'a 4999ms b 4999ms (c|)';
      const values = {
        a: 0,
        b: 1,
        c: 2,
      };
      const _$ = makeLapseObservable(5000).pipe(take(3));

      expectObservable(_$).toBe(timeLine, values);
    });
  });
});
