// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as uuid from 'uuid';
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
// import { retry } from 'rxjs';
import { keychain } from './keychain';
import { tipWithColors$ } from './tipWithColors';
import { genIdentifyMessage } from './obs-websocket/util';
import {
  EventSubscription,
  WebSocketOpCode,
  WebSocketCloseCode,
  Message,
  // EventMessage,
  // OBSEventTypes,
  ResponseMessage,
  // OBSResponseTypes,
  OBSRequestTypes,
  RequestMessage,
} from './obs-websocket/types';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay,
  filter,
  map,
  Observable,
  // Observer,
  Subject,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Subscriber,
  // tap,
  // timer,
} from 'rxjs';

const extensionKey = 'OBS-DeveloperUtil';
const connectCommandId = `${extensionKey}.connect`;
// const reidentifyCommandId = `${extensionKey}.reidentify`;
const tipWithColorsCommandID = `${extensionKey}.tipWithColors`;
const recordCommandId = `${extensionKey}.startRecord`;
// TODO v2
// const recordWithVideoCommandId = `${extensionKey}.startRecordWithVideo`;
const stopRecordCommandId = `${extensionKey}.stopRecord`;
// TODO v2
// const stopRecordWithVideoCommandId = `${extensionKey}.stopRecordWithVideo`;

/**gan obs request and give back an observable response */
function ganOBSRequest<T extends keyof OBSRequestTypes>(
  OBS_WS_subject$: WebSocketSubject<Message>,
  responseMessage$: Observable<ResponseMessage>,
  requestType: T,
  requestData?: OBSRequestTypes[T]
): Observable<ResponseMessage<T>> {
  const _uuid = uuid.v1();
  const requestD: RequestMessage = {
    requestId: _uuid,
    requestType: requestType,
    requestData: requestData,
  } as RequestMessage<T>;
  OBS_WS_subject$.next({
    op: WebSocketOpCode.Request,
    d: requestD,
  });
  return responseMessage$.pipe(
    filter((msg) => msg.requestType === requestType && msg.requestId === _uuid)
  ) as unknown as Observable<ResponseMessage<T>>;
}

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
  let OBS_WS_subject$: WebSocketSubject<Message>;
  let responseMessage$: Observable<ResponseMessage>;
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

  const observer = {
    next: (e: CloseEvent) => {
      const obs_ws_address = config.get<string>('address', 'localhost:4455');
      if (WebSocketCloseCode.AuthenticationFailed === e.code) {
        vscode.window
          .showInputBox({ placeHolder: 'password', title: 'OBS WebSocket Password' })
          .then(async (input_value) => {
            await keychain?.setPassword(extensionKey, obs_ws_address, `${input_value}`);
            vscode.window.showInformationMessage(`retry connecting`);
            vscode.commands.executeCommand(connectCommandId);
          });
      }
      if (WebSocketCloseCode.CantConnect === e.code) {
        vscode.window
          .showWarningMessage(
            `${obs_ws_address} 连接失败,请检查obs-websocket状态或输入其他地址,[帮助](https://github.com/GoooIce/obs-developer-util/issues)`,
            '修改地址'
          )
          .then(() => {
            vscode.window
              .showInputBox({ placeHolder: 'localhost:4455', title: 'OBS WebSocket Address' })
              .then(async (input_value) => {
                config.update('address', input_value);
                vscode.commands.executeCommand(connectCommandId);
              });
          });
      } else {
        vscode.window.showErrorMessage(
          `${e.code} + ${e.reason}, [帮助](https://github.com/GoooIce/obs-developer-util/issues)`
        );
        statusBarItem$.next();
      }
    },
    error: (err: ErrorEvent) => console.error('Observer got an error: ' + err),
    complete: () => console.log('Observer got a complete notification'),
  };

  /**tip with colors used peacock command */
  const disposable = vscode.commands.registerCommand(tipWithColorsCommandID, async () => {
    tipWithColors$.subscribe();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(recordCommandId, () => {
      if (!context.workspaceState.get('isRecording')) {
        ganOBSRequest<'StartRecord'>(OBS_WS_subject$, responseMessage$, 'StartRecord').subscribe({
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
        ganOBSRequest<'StopRecord'>(OBS_WS_subject$, responseMessage$, 'StopRecord').subscribe({
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
        closeObserver: observer,
      };
      OBS_WS_subject$ = webSocket(serverConfig);

      /** Observable WebSocketOpCode.Hello */
      const helloWebSocketOp$ = OBS_WS_subject$.pipe(
        filter((msg) => msg.op === WebSocketOpCode.Hello)
      ) as Observable<Message<WebSocketOpCode.Hello>>;

      helloWebSocketOp$.subscribe({
        next: async (msg) => {
          const password = await keychain?.getPassword(extensionKey, obs_ws_address);
          OBS_WS_subject$.next(
            genIdentifyMessage(msg, EventSubscription.MediaInputs, `${password}`)
          );
        },
      });

      /** Observable WebSocketOpCode.Identified */
      const identifiedWebSocketOp$ = OBS_WS_subject$.pipe(
        filter((msg) => msg.op === WebSocketOpCode.Identified)
      ) as Observable<Message<WebSocketOpCode.Identified>>;

      identifiedWebSocketOp$.subscribe({
        next() {
          context.workspaceState.update('isConnected', true);
          statusBarItem$.next();
          // request record status
          ganOBSRequest<'GetRecordStatus'>(
            OBS_WS_subject$,
            responseMessage$,
            'GetRecordStatus'
          ).subscribe({
            next(msg) {
              if (msg.requestStatus) {
                context.workspaceState.update('isRecording', msg.responseData.outputActive);
                statusBarItem$.next();
              }
            },
          });
        },
      });

      /** Observable WebSocketOpCode.Event */
      // const eventWebsocketOp$ = OBS_WS_subject$.pipe(
      //   filter((msg) => msg.op === WebSocketOpCode.Event),
      //   map((msg) => msg.d)
      // ) as Observable<EventMessage>;

      // eventType === MediaInputPlaybackStarted
      // const eventMediaInputPlaybackStarted$ = eventWebsocketOp$.pipe(
      //   filter((d) => d.eventType === 'MediaInputPlaybackStarted'),
      //   map((d) => d.eventData)
      // ) as Observable<OBSEventTypes['MediaInputPlaybackStarted']>;

      // eventMediaInputPlaybackStarted$.subscribe({
      //   next(event) {
      //     // start process with anim
      //     const videoProgressState = context.workspaceState.get<number>('videoProgress');

      //     // if (videoProgressState === -1)
      //   },
      // });

      // eventType === MediaInputPlaybackEnded
      // eventMediaInputPlaybackEnded$ = eventWebsocketOp$.pipe(
      //   filter((msg) => msg.eventType === 'MediaInputPlaybackEnded'),
      //   map((msg) => msg.eventData)
      // ) as Observable<OBSEventTypes['MediaInputPlaybackEnded']>;

      // eventMediaInputPlaybackEnded$.subscribe({
      //   next(event) {
      //     if (event.inputName === 'mov') videoProgress$.complete();
      //   },
      // });

      /** Observable WebSocketOpCode.RequestResponse */
      responseMessage$ = OBS_WS_subject$.pipe(
        filter((msg) => msg.op === WebSocketOpCode.RequestResponse),
        map((msg) => msg.d)
      ) as Observable<ResponseMessage>;
      // requestType === GetMediaInputStatus
      // const getMediaInputStatusResponse$ = responseMessage$.pipe(
      //   filter((msg) => msg.requestType === 'GetMediaInputStatus'),
      //   map((msg) => msg.responseData)
      // ) as Observable<OBSResponseTypes['GetMediaInputStatus']>;

      // requestType === SetSceneItemEnabled
      // const setSceneItemEnabled$ = responseMessage$.pipe(
      //   filter((msg) => msg.requestType === 'SetSceneItemEnabled'),
      //   map((msg) => msg.responseData)
      // ) as Observable<OBSResponseTypes['SetSceneItemEnabled']>;

      // setSceneItemEnabled$.subscribe({
      //   next() {
      //     vscode.window.showInformationMessage('playing video');
      //   },
      // });

      // Rewrite with operator
      OBS_WS_subject$.subscribe({
        next: async (msg: Message) => {
          if (WebSocketOpCode.Hello === msg.op) {
            console.log('hello');
          }
          if (WebSocketOpCode.RequestResponse === msg.op) {
            console.log(`${msg.d.requestType} : result : ${msg.d.requestStatus.result}`);
          }
        }, // Called whenever there is a message from the server.
        error: (err) => vscode.window.showInformationMessage(err), // Called if at any point WebSocket API signals some kind of error.
        complete: () => {
          vscode.window.showInformationMessage('链接结束');
          context.workspaceState.update('isConnected', false);
          context.workspaceState.update('isRecording', false);
        }, // Called when connection is closed (for whatever reason).
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
