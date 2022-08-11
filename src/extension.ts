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
  EventMessage,
  OBSEventTypes,
  ResponseMessage,
  OBSResponseTypes,
  OBSRequestTypes,
  RequestMessage,
} from './obs-websocket/types';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delay,
  filter,
  map,
  Observable,
  Observer,
  Subject,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Subscriber,
  tap,
  timer,
} from 'rxjs';

const extensionKey = 'OBS-DeveloperUtil';
const connectCommandId = `${extensionKey}.connect`;
const reidentifyCommandId = `${extensionKey}.reidentify`;
const tipWithColorsCommandID = `${extensionKey}.tipWithColors`;
const recordCommandId = `${extensionKey}.startRecord`;
const recordWithVideoCommandId = `${extensionKey}.startRecordWithVideo`;
const stopRecordCommandId = `${extensionKey}.stopRecord`;
const stopRecordWithVideoCommandId = `${extensionKey}.stopRecordWithVideo`;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function ganOBSRequest<T extends keyof OBSRequestTypes>(
  OBS_WS_subject$: WebSocketSubject<Message>,
  responseMessage$: Observable<ResponseMessage>,
  requestType: T,
  requestData?: OBSRequestTypes[T]
): Observable<ResponseMessage> {
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
    filter((msg) => msg.requestId === _uuid && msg.requestType === requestType)
  );
}
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('obs-developer-util is now active!');

  // create a new status bar item that we can now manage
  const myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.workspaceState.update('videoProgress', -1);
  context.workspaceState.update('isConnected', false);
  // OBS Websocket rxjs var
  let OBS_WS_subject$: WebSocketSubject<Message>;
  let responseMessage$: Observable<ResponseMessage>;
  let eventMediaInputPlaybackEnded$: Observable<OBSEventTypes['MediaInputPlaybackEnded']>;

  // vscode observable
  const videoProgress$ = new Subject<number>();
  let videoProgressObserver: Observer<number>;

  const statusBarItem$ = new Subject<string>();
  statusBarItem$
    .pipe(
      tap({
        next(value) {
          myStatusBarItem.text = value;
        },
      })
    )
    .subscribe();

  const videoProgressFun = (
    progress: { report: (arg0: { increment: number; message?: string }) => void },
    token: { onCancellationRequested: (arg0: () => void) => void }
  ) => {
    token.onCancellationRequested(() => {
      console.log('User canceled the long running operation');
    });

    progress.report({ increment: 0 });

    const p = new Promise<void>((reject) => {
      videoProgressObserver = {
        next(value) {
          // if (value >= 100) reject();
          progress.report({ increment: value, message: `%` });

          timer(1000)
            .pipe(
              tap(() => {
                // async newMethodName(op,d,requestId,requestType,requestData,inputName,filter)
                ganOBSRequest<'GetMediaInputStatus'>(
                  OBS_WS_subject$,
                  responseMessage$,
                  'GetMediaInputStatus',
                  {
                    inputName: 'mov',
                  }
                ).subscribe({
                  next(msg) {
                    const responseData: OBSResponseTypes['GetMediaInputStatus'] =
                      msg.responseData as OBSResponseTypes['GetMediaInputStatus'];
                    const mediaCursor = responseData.mediaCursor;
                    const mediaDuration = responseData.mediaDuration;
                    const videoState = ~~((mediaCursor / mediaDuration) * 100);
                    // console.log(mediaCursor, ' : ', mediaDuration, ', ', videoState);

                    const videoProgressState =
                      context.workspaceState.get<number>('videoProgress') || 0;

                    if (videoProgressState === -1)
                      context.workspaceState.update('videoProgress', videoState);

                    if (videoProgressState <= videoState)
                      videoProgress$.next(videoState - videoProgressState);
                  },
                });
              })
            )
            .subscribe();
        },
        error(err) {
          console.log(err);
        },
        complete() {
          reject();
          context.workspaceState.update('videoProgress', -1);
          OBS_WS_subject$.next({
            op: WebSocketOpCode.Request,
            d: {
              requestId: '',
              requestType: 'SetSceneItemEnabled',
              requestData: {
                sceneItemEnabled: false,
                sceneName: '屏幕采集',
                sceneItemId: 0,
              },
            },
          });

          console.log('video complete');
        },
      };
      videoProgress$.subscribe(videoProgressObserver);
      // videoProgress$.complete();
    });
    return p;
  };

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
  const disposable = vscode.commands.registerCommand(tipWithColorsCommandID, async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    // vscode.window.showInformationMessage('Hello World from obs-developer-util!');
    tipWithColors$.subscribe();
  });

  context.subscriptions.push(
    vscode.commands.registerCommand(reidentifyCommandId, () => {
      // vscode.extensions.getExtension();
      // vscode.env.
      // vscode.commands.registerTextEditorCommand
      vscode.window.setStatusBarMessage('正在播放片头', 1000);

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

      OBS_WS_subject$.next(req);
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

      OBS_WS_subject$.next(req);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(recordWithVideoCommandId, () => {
      // event no.256 : MediaInputPlaybackEnded
      // get scene item msg
      console.log('send msg to obs, will start record with video');

      console.log(
        'context: ',
        // context.extension.id,
        // env_identified,
        context.workspaceState.get('isConnected')
      );

      vscode.window.setStatusBarMessage('is connected', 1000);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(stopRecordWithVideoCommandId, () => {
      console.log('send msg to obs, will stop record with video');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(connectCommandId, () => {
      if (context.workspaceState.get('isConnected')) {
        return tipWithColors$.subscribe({
          complete: () => vscode.commands.executeCommand(recordCommandId),
        });
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
          // TODO: 根据询问录制状态，设置bar item状态 stop-circle
          myStatusBarItem.text = `$(circle-filled) OBS: Start Record`;
        },
      });
      /** Observable WebSocketOpCode.Event */
      const eventWebsocketOp$ = OBS_WS_subject$.pipe(
        filter((msg) => msg.op === WebSocketOpCode.Event),
        map((msg) => msg.d)
      ) as Observable<EventMessage>;

      // eventType === MediaInputPlaybackStarted
      const eventMediaInputPlaybackStarted$ = eventWebsocketOp$.pipe(
        filter((d) => d.eventType === 'MediaInputPlaybackStarted'),
        map((d) => d.eventData)
      ) as Observable<OBSEventTypes['MediaInputPlaybackStarted']>;

      eventMediaInputPlaybackStarted$.subscribe({
        next(event) {
          // start process with anim
          const videoProgressState = context.workspaceState.get<number>('videoProgress');

          if (videoProgressState === -1)
            vscode.window.withProgress(
              { location: vscode.ProgressLocation.Window, title: `OBS Playing ${event.inputName}` },
              videoProgressFun
            );
        },
      });

      // eventType === MediaInputPlaybackEnded
      eventMediaInputPlaybackEnded$ = eventWebsocketOp$.pipe(
        filter((msg) => msg.eventType === 'MediaInputPlaybackEnded'),
        map((msg) => msg.eventData)
      ) as Observable<OBSEventTypes['MediaInputPlaybackEnded']>;

      eventMediaInputPlaybackEnded$.subscribe({
        next(event) {
          if (event.inputName === 'mov') videoProgress$.complete();
        },
      });

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
      const setSceneItemEnabled$ = responseMessage$.pipe(
        filter((msg) => msg.requestType === 'SetSceneItemEnabled'),
        map((msg) => msg.responseData)
      ) as Observable<OBSResponseTypes['SetSceneItemEnabled']>;

      setSceneItemEnabled$.subscribe({
        next() {
          vscode.window.showInformationMessage('playing video');
        },
      });

      // Rewrite with operator
      OBS_WS_subject$.subscribe({
        next: async (msg: Message) => {
          if (WebSocketOpCode.RequestResponse === msg.op) {
            console.log(
              `${msg.d.requestStatus.code}  + ${msg.d.requestType} + ${msg.d.responseData}`
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

  myStatusBarItem.text = `$(eye) OBS: Connect`;
  myStatusBarItem.show();

  // return { subject_next: (value: Message) => subject.next(value) };
  // subOpCode0.unsubscribe();
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
