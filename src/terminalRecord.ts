import * as vscode from 'vscode';
import { Subject } from 'rxjs';
import { Message } from './obs-websocket/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function onDidChangeTerminalState(context: vscode.ExtensionContext, obs: Subject<Message>) {
  // vscode.window.onDidChangeTerminalState((e) => {
  //   console.log(e);
  // });

  const writeEmitter = new vscode.EventEmitter<string>();
  const obs_td: vscode.TaskDefinition = { type: 'any' };
  const task: vscode.Task = new vscode.Task(
    obs_td,
    vscode.TaskScope.Workspace,
    'ooo',
    'yarn',
    new vscode.ShellExecution('yarn')
  );

  const obs_opts: vscode.ExtensionTerminalOptions = {
    name: 'obs',
    pty: {
      onDidWrite: writeEmitter.event,
      open: () => writeEmitter.fire('\x1b[31mHello world\x1b[0m\r\n'),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      close: () => {},
      handleInput: (data) => {
        // console.log(data);
        writeEmitter.fire(data);
        if (data === '\r' || data === '\r\n') {
          writeEmitter.fire('\r\n Task Running: \r\n');
          console.log('new task');
          vscode.tasks.executeTask(task);
        }
      },
    },
  };

  vscode.window.createTerminal(obs_opts);
}
