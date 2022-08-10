import * as vscode from 'vscode';
import { interval, take, finalize, map, timer } from 'rxjs';

const colorArr = ['#dd0531', '#f9e64f', '#007fff'];

export function _peacock_color(color: string): void {
  const peacock_config = vscode.workspace.getConfiguration('peacock');
  peacock_config.update('color', color);
}
function resetWorkspaceColors() {
  const restWorkspaceColorsCommandId = 'peacock.resetWorkspaceColors';
  vscode.commands.executeCommand(restWorkspaceColorsCommandId);
}
export const tipWithColors$ = interval(1000).pipe(
  take(3),
  map((value) => {
    _peacock_color(colorArr[value]);
  }),
  finalize(() => {
    timer(1000).subscribe(() => {
      resetWorkspaceColors();
    });
  })
);
