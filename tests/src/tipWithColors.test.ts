/* eslint-disable @typescript-eslint/no-unused-vars */
jest.unmock('../../src/tipWithColors');
import * as vscode from 'vscode';
import { tipWithColors$ } from '../../src/tipWithColors';
import { TestScheduler } from 'rxjs/testing';
// import { tap } from 'rxjs';

vscode.workspace.getConfiguration = jest.fn().mockImplementation((section) => {
  return {
    get: jest.fn().mockImplementation((key) => 'mock_value'),
    update: jest.fn().mockImplementation(() => 'mock_update'),
  };
});

describe('tipWithColors', () => {
  let testScheduler: TestScheduler;
  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('tipWithColors$', () => {
    testScheduler.run(({ expectObservable }) => {
      const colors = '1000ms a 999ms b 999ms c 999ms d 49ms (e|)';
      const values = { a: 0, b: 1, c: 2, d: 0, e: 0 };

      expectObservable(tipWithColors$).toBe(colors, values);
    });
  });
});
