import * as vscode from 'vscode';
import { interval, take, tap, merge, timer } from 'rxjs';

const colorArr = ['#dd0531', '#f9e64f', '#007fff'];

function _peacock_color(color: string): void {
  const peacock_config = vscode.workspace.getConfiguration('peacock');
  peacock_config.update('color', color);
}
function resetWorkspaceColors() {
  const restWorkspaceColorsCommandId = 'peacock.resetWorkspaceColors';
  vscode.commands.executeCommand(restWorkspaceColorsCommandId);
}

const resetWorkspaceColors$ = interval(4000).pipe(
  take(1),
  tap({ next: () => resetWorkspaceColors() })
);

const tipWithThreeColors$ = interval(1000).pipe(
  take(3),
  tap({ next: (value) => _peacock_color(colorArr[value]) })
);

export const tipWithColors$ = merge(tipWithThreeColors$, resetWorkspaceColors$, timer(4050));
