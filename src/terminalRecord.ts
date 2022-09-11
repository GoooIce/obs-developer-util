import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { count, filter, map, Observable, reduce, Subject, from } from 'rxjs';

import { extensionKey, isZenModeState } from './enum';
import { OBSSubject } from './obs-websocket/subject';

const terminalSceneName = 'Terminal';
const desktopSceneName = 'Desktop';

export function onDidChangeTerminalState(context: vscode.ExtensionContext) {
  const obs = OBSSubject.getSubject();
  obs.GetSceneList().subscribe({
    next(msg) {
      msg.responseData.scenes.forEach((value) => {
        if (value['sceneName'] === terminalSceneName) {
          createObsTerminal(context);

          // eslint-disable-next-line no-inner-declarations
          function changeScene<T>(sceneName: string) {
            return (_e: T): void => {
              const currObsSceneName = context.workspaceState.get('obs-scene');
              if (currObsSceneName === sceneName) return;
              obs.SetCurrentProgramScene(sceneName).subscribe({
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

function createObsTerminal(context: vscode.ExtensionContext) {
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

    writeEmitter.fire(
      '当前终端中的命令都将跳过录制\r\n\x1b[31m\tZen Mode 不生效\x1b[0m\r\n\x1b[31m\t不支持多行命令。\x1b[0m\r\n\r\n> '
    );
  };

  const terminalHandleInput = (data: string): void => {
    if (data === '\x7f') {
      // Backspace
      if (shellBuffer.length === 0) {
        return;
      }
      shellBuffer = shellBuffer.substring(0, shellBuffer.length - 1);
      // Move cursor backward
      writeEmitter.fire('\x1b[D');
      // Delete character
      writeEmitter.fire('\x1b[P');
      return;
    }
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
  };

  const obs_opts: vscode.ExtensionTerminalOptions = {
    name: 'obs',
    pty: {
      onDidWrite: writeEmitter.event,
      open: resetTerminal,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      close: () => {},
      handleInput: terminalHandleInput,
    },
  };

  vscode.window.createTerminal(obs_opts);

  vscode.tasks.onDidStartTask((e) => {
    if (context.workspaceState.get(isZenModeState)) {
      return;
    }
    const obs = OBSSubject.getSubject();
    // console.log(e.execution.task.name, 'task start');
    if ('OBS' === e.execution.task.name) {
      obs._api('PauseRecord').subscribe();
    }
  });
  // vscode.tasks.onDidStartTaskProcess((e) => console.dir(e));
  vscode.tasks.onDidEndTask((e) => {
    if (context.workspaceState.get(isZenModeState)) {
      return;
    }
    const obs = OBSSubject.getSubject();
    // console.log(e.execution.task.name, 'task start');
    if ('OBS' === e.execution.task.name) {
      obs._api('ResumeRecord').subscribe();
    }
  });
  // vscode.tasks.onDidEndTaskProcess((e) => console.dir(e));
}
