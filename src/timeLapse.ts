import * as vscode from 'vscode';
import { interval, tap, Subscription, timer, merge } from 'rxjs';

import { exitZenModeId, isZenModeState, toggleZenModeId } from './enum';

import { OBSSubject } from './obs-websocket/subject';

export function makeLapseObservable(timeSpeed: number) {
  const timeLapse$ = interval(timeSpeed).pipe(
    tap(() => {
      // const getOBS = vscode.extensions.getExtension(extensionKey)?.exports.getOBS;
      const obs = OBSSubject.getSubject(); // getOBS();
      obs._api('ResumeRecord').subscribe();
    })
  );
  const timeRecord$ = interval(timeSpeed + 100).pipe(
    tap(() => {
      // const getOBS = vscode.extensions.getExtension(extensionKey)?.exports.getOBS;
      const obs = OBSSubject.getSubject(); // getOBS();
      obs._api('PauseRecord').subscribe();
    })
  );

  return merge(timeLapse$, timeRecord$);
}

export function onDidZenMode(
  context: vscode.ExtensionContext,
  config: {
    obs_ws_address?: string;
    autoConnect?: boolean | undefined;
    visual_cue?: string;
    timeSpeed: number;
  }
) {
  let timeLapseSubscription: Subscription;

  context.subscriptions.push(
    vscode.commands.registerCommand(toggleZenModeId, () => {
      if (config.timeSpeed < 1000) {
        vscode.window.showErrorMessage('请勿设置小于');
      }
      // vscode.window.showInformationMessage('zen');
      context.workspaceState.update(isZenModeState, true);
      vscode.commands.executeCommand('workbench.action.toggleZenMode');
      const isRecording = context.workspaceState.get('isRecording');
      if (isRecording) {
        const timeLapse$ = makeLapseObservable(config.timeSpeed);

        timeLapseSubscription = timeLapse$.subscribe();
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(exitZenModeId, () => {
      // vscode.window.showInformationMessage('exit zen');
      context.workspaceState.update(isZenModeState, true);
      vscode.commands.executeCommand('workbench.action.exitZenMode');
      const isRecording = context.workspaceState.get('isRecording');
      if (isRecording) {
        timeLapseSubscription.unsubscribe();
      }
    })
  );
}
