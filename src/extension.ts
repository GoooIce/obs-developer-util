// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
// import { retry } from 'rxjs';
import { keychain } from './keychain';
import { tipWithColors$ } from './tipWithColors';
// import { genIdentifyMessage } from './obs-websocket/util';
import {
  // EventSubscription,
  // WebSocketOpCode,
  // WebSocketCloseCode,
  Message,
} from './obs-websocket/types';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay,
  // filter,
  // Observable,
  // Observer,
  Subject,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Subscriber,
  // tap,
  // timer,
} from 'rxjs';
import { BasePanel } from './panels/BasePanels';
import { onDidChangeTerminalState } from './terminalRecord';
import {
  extensionKey,
  connectCommandId,
  tipWithPanelCommandID,
  tipWithColorsCommandID,
  recordCommandId,
  stopRecordCommandId,
} from './enum';
// import { ganOBSRequest } from './obs-websocket/ganOBSRequest';
import { OBSSubject } from './obs-websocket/subject';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('obs-developer-util is now active!');
  const config = vscode.workspace.getConfiguration(extensionKey);

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.workspaceState.update('videoProgress', -1);
  context.workspaceState.update('isConnected', false);
  context.workspaceState.update('isRecording', false);
  // OBS Websocket rxjs var
  let obs: OBSSubject;
  // let eventMediaInputPlaybackEnded$: Observable<OBSEventTypes['MediaInputPlaybackEnded']>;

  // vscode observable
  // const videoProgress$ = new Subject<number>();
  // let videoProgressObserver: Observer<number>;
  const obs_name = 'OBS';

  const statusBarItem$ = new Subject<void>();
  statusBarItem$.subscribe({
    next() {
      const isConnected = context.workspaceState.get('isConnected');
      const isRecording = context.workspaceState.get('isRecording');
      if (isConnected) {
        if (isRecording) myStatusBarItem.text = `$(vm-active) ${obs_name}: Stop Recording`;
        else myStatusBarItem.text = `$(vm-outline) ${obs_name}: Start Recording`;
      } else {
        myStatusBarItem.text = `$(vm-connect) ${obs_name}: Connect`;
      }
    },
  });

  if (typeof global !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).WebSocket = require('ws');
  }

  // const observer = {
  //   next: (e: CloseEvent) => {
  //     const obs_ws_address = config.get<string>('address', 'localhost:4455');
  //     if (WebSocketCloseCode.AuthenticationFailed === e.code) {
  //       vscode.window
  //         .showInputBox({ placeHolder: 'password', title: 'OBS WebSocket Password' })
  //         .then(async (input_value) => {
  //           await keychain?.setPassword(extensionKey, obs_ws_address, `${input_value}`);
  //           vscode.window.showInformationMessage(`retry connecting`);
  //           vscode.commands.executeCommand(connectCommandId);
  //         });
  //     }
  //     if (WebSocketCloseCode.CantConnect === e.code) {
  //       vscode.window
  //         .showWarningMessage(
  //           `${obs_ws_address} 连接失败,请检查obs-websocket状态或输入其他地址,[帮助](https://github.com/GoooIce/obs-developer-util/issues)`,
  //           '修改地址'
  //         )
  //         .then(() => {
  //           vscode.window
  //             .showInputBox({ placeHolder: 'localhost:4455', title: 'OBS WebSocket Address' })
  //             .then(async (input_value) => {
  //               config.update('address', input_value);
  //               vscode.commands.executeCommand(connectCommandId);
  //             });
  //         });
  //     } else {
  //       vscode.window.showErrorMessage(
  //         `${e.code} + ${e.reason}, [帮助](https://github.com/GoooIce/obs-developer-util/issues)`
  //       );
  //       statusBarItem$.next();
  //     }
  //   },
  //   error: (err: ErrorEvent) => console.error('Observer got an error: ' + err),
  //   complete: () => console.log('Observer got a complete notification'),
  // };

  context.subscriptions.push(
    vscode.commands.registerCommand(tipWithPanelCommandID, () => {
      BasePanel.render(context.extensionUri);
    })
  );

  /**tip with colors used peacock command */
  const disposable = vscode.commands.registerCommand(tipWithColorsCommandID, async () => {
    tipWithColors$.subscribe();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(recordCommandId, () => {
      if (!context.workspaceState.get('isRecording')) {
        obs._api('StartRecord').subscribe({
          next(msg) {
            if (msg.requestStatus) {
              context.workspaceState.update('isRecording', true);
              statusBarItem$.next();
            }
          },
        });
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(stopRecordCommandId, () => {
      if (context.workspaceState.get('isRecording'))
        obs._api('StopRecord').subscribe({
          next(msg) {
            if (msg.requestStatus) {
              context.workspaceState.update('isRecording', false);
              statusBarItem$.next();
            }
          },
        });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(connectCommandId, () => {
      const isConnected = context.workspaceState.get('isConnected');
      const isRecording = context.workspaceState.get('isRecording');
      if (isConnected && !isRecording) {
        return tipWithColors$.subscribe({
          complete: () => vscode.commands.executeCommand(recordCommandId),
        });
      }

      if (isConnected && isRecording) {
        return vscode.commands.executeCommand(stopRecordCommandId);
      }

      const config = vscode.workspace.getConfiguration(extensionKey);
      const obs_ws_address = config.get<string>('address', 'localhost:4455');
      const serverConfig: WebSocketSubjectConfig<Message> = {
        url: `ws://${obs_ws_address}`,
      };
      obs = OBSSubject.getSubject(serverConfig);

      obs.onAuth$.subscribe({
        async next() {
          const _save_password = (await keychain?.getPassword(extensionKey, obs_ws_address)) || '';
          if ('' !== _save_password) return obs.password$.next(_save_password);
          vscode.window
            .showInputBox({ placeHolder: 'password', title: 'OBS WebSocket Password' })
            .then(async (input_value) => {
              if (input_value && '' !== input_value) {
                await keychain?.setPassword(extensionKey, obs_ws_address, `${input_value}`);
                return obs.password$.next(input_value);
              }

              // if got empty input_value rerun subscribe.
              obs.onAuth$.next();
            });
        },
        complete() {
          statusBarItem$.next();
        },
        error(err) {
          console.log(err);
        },
      });

      obs.onIdentified$.subscribe({
        next() {
          context.workspaceState.update('isConnected', true);
          statusBarItem$.next();
          // request record status
          obs.GetRecordStatus().subscribe({
            next(msg) {
              if (msg.requestStatus) {
                context.workspaceState.update('isRecording', msg.responseData.outputActive);
                statusBarItem$.next();
              }
            },
          });

          onDidChangeTerminalState(context);
        },
      });

      // Rewrite with operator
      obs.onComplete$.subscribe({
        next: () => {
          vscode.window.showInformationMessage('链接结束');
          context.workspaceState.update('isConnected', false);
          context.workspaceState.update('isRecording', false);
        }, // Called when connection is closed (for whatever reason).
      });
      obs.onError$.subscribe({
        next: (err) => {
          vscode.window.showInformationMessage(err);
          context.workspaceState.update('isConnected', false);
          context.workspaceState.update('isRecording', false);
        },
      });
    })
  );

  myStatusBarItem.command = connectCommandId;
  context.subscriptions.push(myStatusBarItem);

  context.subscriptions.push(disposable);

  statusBarItem$.next();
  myStatusBarItem.show();

  /**auto connect with config */
  const autoConnect = config.get<boolean>('autoConnect');
  if (autoConnect) vscode.commands.executeCommand(connectCommandId);
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
