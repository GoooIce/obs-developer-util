import * as vscode from 'vscode';

const StatusBarAlignment = vscode.StatusBarAlignment.Right;

export type ConnectStatus = 'Empty' | 'UrlError' | 'Connected' | 'FailedConnect' | 'ServerError';

export const StatusBar = class StatusBar {
  updateStatus(status: ConnectStatus) {
    this.recordItem.text = status;
    this.streamItem.text = status;
  }
  streamItem: vscode.StatusBarItem;
  recordItem: vscode.StatusBarItem;
  constructor() {
    this.streamItem = vscode.window.createStatusBarItem(StatusBarAlignment, 101);
    this.recordItem = vscode.window.createStatusBarItem(StatusBarAlignment, 102);
  }
  public register(): vscode.StatusBarItem[] {
    return [this.recordItem, this.streamItem];
  }
};

// export default {
//   StatusBar,
// };
