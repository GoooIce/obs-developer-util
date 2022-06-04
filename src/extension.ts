// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { webSocket } from 'rxjs/webSocket';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "obs-developer-util" is now active!');

  if (typeof global !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = require('ws');
  }
  const subject = webSocket('ws://192.168.1.254:4455');
  subject.subscribe({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    next: (msg: any) => {
      if (msg.op === 0) {
        vscode.window.showInformationMessage(`${msg.d.obsWebSocketVersion} with op ${msg.op}`);
      }
      // switch (msg.op) {
      // }
      // vscode.window.showInformationMessage(`message received: ${msg}`);
    }, // Called whenever there is a message from the server.
    error: (err) => vscode.window.showInformationMessage(err), // Called if at any point WebSocket API signals some kind of error.
    complete: () => vscode.window.showInformationMessage('链接结束'), // Called when connection is closed (for whatever reason).
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('obs-developer-util.helloWorld', () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from obs-developer-util!');
  });

  const myCommandId = 'obs-developer-util.helloBar';
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, () => {
      subject.next({
        op: 1,
        d: {
          rpcVersion: 1,
          // authentication: "Dj6cLS+jrNA0HpCArRg0Z/Fc+YHdt2FQfAvgD1mip6Y=",
          eventSubscriptions: 33,
        },
      });
      vscode.window.showInformationMessage(`Hello is sending... Keep going!`);
    })
  );

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  myStatusBarItem.command = myCommandId;
  context.subscriptions.push(myStatusBarItem);

  context.subscriptions.push(disposable);

  myStatusBarItem.text = `$(megaphone) line(s) selected`;
  myStatusBarItem.show();
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
