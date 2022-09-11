import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { interval, tap, Subscription, merge, combineLatestWith } from 'rxjs';

import { exitZenModeId, isZenModeState, toggleZenModeId } from './enum';

import { OBSSubject } from './obs-websocket/subject';

export function makeLapseObservable(timeSpeed: number) {
  // const getOBS = vscode.extensions.getExtension(extensionKey)?.exports.getOBS;
  const obs = OBSSubject.getSubject(); // getOBS();
  const timeRecord$ = interval(100).pipe(
    tap(() => {
      obs.PauseRecord().subscribe();
    })
  );
  const timeLapse$ = interval(timeSpeed).pipe(
    tap({
      next: () => {
        obs.ResumeRecord().subscribe();
      },
    }),
    combineLatestWith(timeRecord$)
  );

  return timeLapse$;

  // return merge(timeLapse$, timeRecord$);
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
