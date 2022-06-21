import { StatusBar } from '../src/StatusBar';
import * as vscode from 'vscode';

describe('StatusBar', () => {
  it('should create an instance', () => {
    expect(new StatusBar()).toBeTruthy();
  });

  it('register 3 status bar items', () => {
    // const createStatusBarItem = vscode.window.createStatusBarItem() as unknown as jest.Mock<{}>;
    const statusBar = new StatusBar();
    statusBar.register();
    expect(vscode.window.createStatusBarItem).toBeCalledTimes(3);
  });
});
