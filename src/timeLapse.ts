import * as vscode from 'vscode';

import { Subscription, timer } from 'rxjs';

import { exitZenModeId, isZenModeState, toggleZenModeId } from './enum';

import { OBSSubject } from './obs-websocket/subject';

export function makeLapseObservable(timeSpeed: number) {
  return timer(0, timeSpeed);
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
  let pauseTimer: Subscription;

  context.subscriptions.push(
    vscode.commands.registerCommand(toggleZenModeId, () => {
      context.workspaceState.update(isZenModeState, true);
      vscode.commands.executeCommand('workbench.action.toggleZenMode');
      const isRecording = context.workspaceState.get('isRecording');
      if (isRecording) {
        const timeLapse$ = makeLapseObservable(config.timeSpeed);
        const obs = OBSSubject.getSubject();
        obs.SetCurrentProgramScene('Desktop').subscribe();
        obs.GetRecordStatus().subscribe((x) => {
          // Todo: 存储时间戳
          // if (x.responseData.outputPaused) obs.ResumeRecord().subscribe();
          console.log(x.responseData);
        });
        // obs.PauseRecord().subscribe();

        timeLapseSubscription = timeLapse$.subscribe({
          next: () => {
            obs.ResumeRecord().subscribe(() => {
              pauseTimer = timer(1000).subscribe(() => obs.PauseRecord().subscribe());
            });
          },
          complete: () => {
            obs.ResumeRecord().subscribe();
          },
        });
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(exitZenModeId, () => {
      context.workspaceState.update(isZenModeState, false);
      vscode.commands.executeCommand('workbench.action.exitZenMode');
      const isRecording = context.workspaceState.get('isRecording');
      if (isRecording) {
        timeLapseSubscription.unsubscribe();
        pauseTimer.unsubscribe();
        const obs = OBSSubject.getSubject();
        obs.GetRecordStatus().subscribe((x) => {
          // Todo: 存储时间戳
          if (x.responseData.outputPaused) obs.ResumeRecord().subscribe();
          console.log(x.responseData);
        });
      }
    })
  );
}
