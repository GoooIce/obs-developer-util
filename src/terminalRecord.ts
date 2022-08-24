import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { count, filter, map, Observable, reduce, Subject, from } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Message } from './obs-websocket/types';
import { ganOBSRequest } from './obs-websocket/ganOBSRequest';
import { extensionKey } from './enum';

const terminalSceneName = 'Terminal';
const desktopSceneName = 'Desktop';

export function onDidChangeTerminalState(
  context: vscode.ExtensionContext,
  obs: WebSocketSubject<Message>
) {
  ganOBSRequest<'GetSceneList'>(obs, 'GetSceneList').subscribe({
    next(msg) {
      msg.responseData.scenes.forEach((value) => {
        if (value['sceneName'] === terminalSceneName) {
          createObsTerminal();

          // eslint-disable-next-line no-inner-declarations
          function changeScene<T>(sceneName: string) {
            return (_e: T): void => {
              const currObsSceneName = context.workspaceState.get('obs-scene');
              if (currObsSceneName === sceneName) return;
              ganOBSRequest<'SetCurrentProgramScene'>(obs, 'SetCurrentProgramScene', {
                sceneName: sceneName,
              }).subscribe({
                next: () => {
                  context.workspaceState.update('obs-scene', sceneName);
                },
              });
            };
          }

          const editorChange = changeScene(desktopSceneName);
          vscode.window.onDidChangeActiveTextEditor(editorChange);
          vscode.window.onDidChangeTextEditorSelection(editorChange);
          vscode.window.onDidCloseTerminal(editorChange);

          const terminalChange = changeScene(terminalSceneName);
          vscode.window.onDidChangeActiveTerminal(terminalChange);
          vscode.window.onDidOpenTerminal(terminalChange);
          vscode.window.onDidChangeTerminalState(terminalChange);
        }
      });
    },
  });
}

function createObsTerminal() {
  const writeEmitter = new vscode.EventEmitter<string>();
  const obs_td: vscode.TaskDefinition = { type: 'any' };

  let shellBuffer = '';

  const resetTerminal = () => {
    writeEmitter.fire('\x1b[2J');
    writeEmitter.fire('\x1b[0f');

    const cleanTerminal = vscode.workspace
      .getConfiguration(extensionKey)
      .get<boolean>('cleanTerminal');

    if (cleanTerminal) {
      writeEmitter.fire('\r\n\r\n> ');
      return;
    }

    writeEmitter.fire('当前终端中的命令都将跳过录制，\x1b[31m不支持多行命令。\x1b[0m\r\n\r\n> ');
  };

  const obs_opts: vscode.ExtensionTerminalOptions = {
    name: 'obs',
    pty: {
      onDidWrite: writeEmitter.event,
      open: resetTerminal,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      close: () => {},
      handleInput: (data) => {
        shellBuffer += data;
        writeEmitter.fire(data);
        if (data === '\r' || data === '\r\n') {
          vscode.tasks.executeTask(
            new vscode.Task(
              obs_td,
              vscode.TaskScope.Workspace,
              'OBS',
              extensionKey,
              new vscode.ShellExecution(shellBuffer)
            )
          );
          shellBuffer = '';
          resetTerminal();
        }
      },
    },
  };

  vscode.window.createTerminal(obs_opts);
}
