jest.unmock('../../../src/obs-websocket/subject');
jest.unmock('jest-websocket-mock');
import WS from 'jest-websocket-mock';
import { OBSSubject } from '../../../src/obs-websocket/subject';
// import { TestScheduler } from 'rxjs/testing';

describe('subject', () => {
  let ws: WS;
  // let testScheduler: TestScheduler;
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ws = new WS('ws://localhost:4455');
    // testScheduler = new TestScheduler((actual, expected) => {
    //   expect(actual).toEqual(expected);
    // });
  });
  afterEach(() => WS.clean());

  it('sigleton', () => {
    // testScheduler.run(({ expectObservable, expectSubscriptions }) => {});
    const obs1 = OBSSubject.getSubject();
    const obs2 = OBSSubject.getSubject();

    expect(obs1).toBe(obs2);
  });

  it('onOpen singleton', () => {
    let turnObject = true;
    const obs = OBSSubject.getSubject();
    const obs_ext = OBSSubject.getSubject();
    obs_ext.onOpen$.subscribe({
      next: () => {
        turnObject = false;
      },
    });
    obs.onOpen$.next();

    expect(turnObject).toBeFalsy();
  });
});
