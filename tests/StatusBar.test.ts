jest.unmock('../src/StatusBar');
import { StatusBar } from '../src/StatusBar';
// import * as vscode from 'vscode';

describe('given StatusBar', () => {
  it('should create an instance', () => {
    expect(new StatusBar()).toBeTruthy();
  });

  describe('connect obs with status bar', () => {
    const statusBar = new StatusBar();
    it('do not have connect url', () => {
      statusBar.updateStatus('Empty');
      expect(statusBar.recordItem.text).toEqual('Empty');
    });
  });
});
