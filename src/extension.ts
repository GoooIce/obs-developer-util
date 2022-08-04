// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { webSocket, WebSocketSubjectConfig } from 'rxjs/webSocket';
// import { retry } from 'rxjs';
import { keychain } from './keychain';
import { genIdentifyMessage } from './obs-websocket/util';
import {
  EventSubscription,
  WebSocketOpCode,
  WebSocketCloseCode,
  Message,
} from './obs-websocket/types';
import { Observable, Subscriber } from 'rxjs';

const extensionKey = 'OBS-DeveloperUtil';
const connectCommandId = `${extensionKey}.connect`;
const reidentifyCommandId = `${extensionKey}.reidentify`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('obs-developer-util is now active!');

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

  if (typeof global !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = require('ws');
  }
  const config = vscode.workspace.getConfiguration(extensionKey);
  // TODO: need reload
  const obs_ws_address = config.get<string>('address', 'localhost:4455');

  const observer = {
    next: (e: CloseEvent) => {
      const obs_ws_address = config.get<string>('address', 'localhost:4455');
      if (WebSocketCloseCode.AuthenticationFailed === e.code) {
        vscode.window.showInputBox().then(async (input_value) => {
          await keychain?.setPassword(extensionKey, obs_ws_address, `${input_value}`);
          vscode.window.showInformationMessage(`retry connecting`);
          vscode.commands.executeCommand(connectCommandId);
        });
      }
      if (WebSocketCloseCode.CantConnect === e.code) {
        vscode.window
          .showWarningMessage(
            `${obs_ws_address} 连接失败,请检查obs-websocket状态或输入其他地址,[帮助](http://miantu.net)`,
            '修改地址'
          )
          .then(() => {
            vscode.window.showInputBox().then(async (input_value) => {
              config.update('address', input_value);
              vscode.commands.executeCommand(connectCommandId);
            });
          });
      } else {
        vscode.window.showErrorMessage(`${e.code} + ${e.reason}, [帮助](http://miantu.net)`);
      }
    },
    error: (err: ErrorEvent) => console.error('Observer got an error: ' + err),
    complete: () => console.log('Observer got a complete notification'),
  };

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(`${extensionKey}.tipWithColors`, async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from obs-developer-util!');
    const peacock_config = vscode.workspace.getConfiguration('peacock');
    let i = 1;
    const color$ = new Observable((subscriber: Subscriber<string>) => {
      setTimeout(() => {
        if (4 > i) subscriber.complete();
        subscriber.next(i % 2 == 1 ? '#42b883' : '#f00');
        i++;
      }, 10000);
    });

    color$.subscribe({
      next(color) {
        console.log(color);

        peacock_config.update('color', color);
      },
      complete() {
        // vscode.commands.executeCommand('peacock.resetWorkspaceColors');
      },
      error(err) {
        vscode.window.showErrorMessage(err);
      },
    });
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(reidentifyCommandId, () => {
      // subject.next({
      //   op: WebSocketOpCode.Reidentify,
      //   d: {
      //     eventSubscriptions: 1 << 7,
      //   },
      // });
      // TODO: use di
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(connectCommandId, () => {
      const serverConfig: WebSocketSubjectConfig<Message> = {
        url: `ws://${obs_ws_address}`,
        closeObserver: observer,
      };
      const subject = webSocket(serverConfig);
      // vscode.window.showInformationMessage(`connecting`);
      subject.subscribe({
        next: async (msg: Message) => {
          if (msg.op === WebSocketOpCode.Hello) {
            vscode.window.showInformationMessage(`${msg.d.obsWebSocketVersion} with op ${msg.op}`);
            const password = await keychain?.getPassword(extensionKey, obs_ws_address);
            subject.next(genIdentifyMessage(msg, EventSubscription.Outputs, `${password}`));
          }
          if (msg.op === WebSocketOpCode.Identified) {
            // console.log(msg);
            vscode.window.showInformationMessage(`连接OBS成功，可以开始正常操作了。`);
          }
          if (msg.op === WebSocketOpCode.Event) {
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

  myStatusBarItem.command = connectCommandId;
  context.subscriptions.push(myStatusBarItem);

  context.subscriptions.push(disposable);

  myStatusBarItem.text = `$(eye) connect obs`;
  myStatusBarItem.show();
  // subOpCode0.unsubscribe();
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
