import * as vscode from 'vscode';
import { Observable, Subscriber } from 'rxjs';

export function tipWithColors(then_callback?: () => {}) {
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
      // vscode.commands.executeCommand(recordCommandId);
      if (then_callback) then_callback();
    },
    error(err) {
      vscode.window.showErrorMessage(err);
    },
  });
}
