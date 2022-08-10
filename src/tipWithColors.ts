import * as vscode from 'vscode';
import { interval, take, finalize, map } from 'rxjs';

export function tipWithColors(then_callback?: () => {}) {
  const peacock_config = vscode.workspace.getConfiguration('peacock');
  const colorArr = ['#dd0531', '#f9e64f', '#007fff'];
  const colorSource$ = interval(1000).pipe(
    take(3),
    map((value) => {
      peacock_config.update('color', colorArr[value]);
    }),
    finalize(() => {
      vscode.commands.executeCommand('peacock.resetWorkspaceColors');
      if (then_callback) return then_callback;
    })
  );

  colorSource$.subscribe();
}
