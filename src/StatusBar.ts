import * as vscode from 'vscode';

export const StatusBar = class StatusBar {
  status: string;
  statusBarItem: vscode.StatusBarItem;
  constructor() {
    this.status = 'Ready';
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'obs-developer-util.BarWithOBS';
  }
  register() {
    return '';
  }
};

// export default {
//   StatusBar,
// };
