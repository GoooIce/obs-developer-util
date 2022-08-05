// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
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
const recordCommandId = `${extensionKey}.startRecord`;
const recordWithVideoCommandId = `${extensionKey}.startRecordWithVideo`;
const stopRecordCommandId = `${extensionKey}.stopRecord`;
const stopRecordWithVideoCommandId = `${extensionKey}.stopRecordWithVideo`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('obs-developer-util is now active!');

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  let subject: WebSocketSubject<Message>;

  if (typeof global !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = require('ws');
  }

  const observer = {
    next: (e: CloseEvent) => {
      const config = vscode.workspace.getConfiguration(extensionKey);
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
      setInterval(() => {
        if (4 <= i) subscriber.complete();
        if (1 == i) {
          subscriber.next('#dd0531');
        }
        if (2 == i) {
          subscriber.next('#f9e64f');
        }
        if (3 == i) {
          subscriber.next('#007fff');
        }
        i++;
      }, 1000);
    });

    color$.subscribe({
      next(color) {
        peacock_config.update('color', color);
      },
      complete() {
        vscode.commands.executeCommand('peacock.resetWorkspaceColors');
        vscode.commands.executeCommand(recordCommandId);
      },
      error(err) {
        vscode.window.showErrorMessage(err);
      },
    });
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(reidentifyCommandId, () => {
      // vscode.extensions.getExtension();
      // vscode.env.
      // vscode.commands.registerTextEditorCommand
      vscode.window.setStatusBarMessage('正在播放片头');

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
    vscode.commands.registerCommand(recordCommandId, () => {
      const req: Message<WebSocketOpCode.Request> = {
        op: WebSocketOpCode.Request,
        d: {
          requestType: 'StartRecord',
          requestId: 'f819dcf0-89cc-11eb-8f0e-382c4ac93b9c',
        },
      };

      subject.next(req);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(stopRecordCommandId, () => {
      console.log('send msg to obs, will stop record');
      const req: Message<WebSocketOpCode.Request> = {
        op: WebSocketOpCode.Request,
        d: {
          requestType: 'StopRecord',
          requestId: 'f819dcf0-89cc-11eb-8f0e-382c4ac93b99',
        },
      };

      subject.next(req);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(recordWithVideoCommandId, () => {
      console.log('send msg to obs, will start record with video');

      console.log(
        'context: ',
        context.extension.id,
        // env_identified,
        context.workspaceState.get('isConnected')
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(stopRecordWithVideoCommandId, () => {
      console.log('send msg to obs, will stop record with video');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(connectCommandId, () => {
      const config = vscode.workspace.getConfiguration(extensionKey);
      const obs_ws_address = config.get<string>('address', 'localhost:4455');
      const serverConfig: WebSocketSubjectConfig<Message> = {
        url: `ws://${obs_ws_address}`,
        closeObserver: observer,
      };
      subject = webSocket(serverConfig);
      // vscode.window.showInformationMessage(`connecting`);
      subject.subscribe({
        next: async (msg: Message) => {
          if (WebSocketOpCode.Hello === msg.op) {
            vscode.window.showInformationMessage(`${msg.d.obsWebSocketVersion} with op ${msg.op}`);
            const password = await keychain?.getPassword(extensionKey, obs_ws_address);
            subject.next(genIdentifyMessage(msg, EventSubscription.Outputs, `${password}`));
          }
          if (WebSocketOpCode.Identified === msg.op) {
            vscode.window.showInformationMessage(`连接OBS成功，可以开始正常操作了。`);
            context.workspaceState.update('isConnected', true);
            // vscode.commands.executeCommand('setContext', 'OBS-DeveloperUtil.env_identified', true);
          }
          if (WebSocketOpCode.Event === msg.op) {
            vscode.window.showInformationMessage(
              `event no.${msg.d.eventIntent} : ${msg.d.eventType}`
            );
          }
          if (WebSocketOpCode.RequestResponse === msg.op) {
            console.log(`${msg.d.requestStatus}  + ${msg.d.requestType}`);
            if (msg.d.requestType === 'SetSceneItemEnabled') {
              vscode.window.showInformationMessage('playing video');
            }

            // switch (msg.d.requestType) {
            //   case RequestStatus.:

            //     break;

            //   default:
            //     break;
            // }
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

  myStatusBarItem.text = `$(eye)connect obs`;
  myStatusBarItem.show();

  // return { subject_next: (value: Message) => subject.next(value) };
  // subOpCode0.unsubscribe();
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
