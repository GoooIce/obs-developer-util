// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { webSocket, WebSocketSubjectConfig } from 'rxjs/webSocket';
// import { retry } from 'rxjs';
import { keychain } from './keychain';
import { genIdentifyMessage } from './obs-websocket/util';
import { EventSubscription } from './obs-websocket/types';

const extensionKey = 'OBS-DeveloperUtil';
const connectCommandId = `${extensionKey}.connect`;
const reidentifyCommandId = `${extensionKey}.reidentify`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('obs-developer-util is now active!');

  if (typeof global !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = require('ws');
  }
  const config = vscode.workspace.getConfiguration(extensionKey);
  const obs_ws_address = config.get<string>('address', 'localhost:4455');
  const obs_ws_password = await keychain?.getPassword(extensionKey, obs_ws_address);
  if (obs_ws_password) {
    vscode.window.showInformationMessage(obs_ws_password);
  }
  type OpCode = {
    op: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    d?: any;
  };
  const observer = {
    next: (e: CloseEvent) => {
      vscode.window.showErrorMessage(e.reason);
      console.log('Observer got a next value: ' + e.reason);
    },
    error: (err: ErrorEvent) => console.error('Observer got an error: ' + err),
    complete: () => console.log('Observer got a complete notification'),
  };
  const serverConfig: WebSocketSubjectConfig<OpCode> = {
    url: `ws://${obs_ws_address}`,
    closeObserver: observer,
  };
  const subject = webSocket(serverConfig);

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(`${extensionKey}.helloWorld`, () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from obs-developer-util!');
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(reidentifyCommandId, () => {
      subject.next({
        op: 3,
        d: {
          eventSubscriptions: 1 << 7,
        },
      });
      vscode.window.showInformationMessage(`$(eye) op3 is sending... Keep going!`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(connectCommandId, () => {
      vscode.window.showInformationMessage(`connecting`);
      subject.subscribe({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        next: (msg: any) => {
          if (msg.op === 0) {
            vscode.window.showInformationMessage(`${msg.d.obsWebSocketVersion} with op ${msg.op}`);
            subject.next(genIdentifyMessage(msg, EventSubscription.Outputs, ''));
          }
          if (msg.op === 2) {
            console.log(msg);
          }
          if (msg.op === 5) {
            vscode.window.showInformationMessage(
              `event no.${msg.d.eventIntent} : ${msg.d.eventType}`
            );
          }
        }, // Called whenever there is a message from the server.
        error: (err) => vscode.window.showInformationMessage(err), // Called if at any point WebSocket API signals some kind of error.
        complete: () => {
          vscode.window.showInformationMessage('链接结束');
        }, // Called when connection is closed (for whatever reason).
      });
    })
  );

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  myStatusBarItem.command = connectCommandId;
  context.subscriptions.push(myStatusBarItem);

  context.subscriptions.push(disposable);

  myStatusBarItem.text = `$(eye) line(s) selected`;
  myStatusBarItem.show();
  // subOpCode0.unsubscribe();
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
