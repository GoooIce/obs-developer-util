// import { existsSync } from 'fs';
// import { config } from 'process';
import { map } from 'rxjs';
import * as vscode from 'vscode';
import { stopRecordCommandId } from './enum';
import { OBSSubject } from './obs-websocket/subject';
import { videoObjectTemplate, endPart } from './video_object_json';

export function onDidToursRecord(
  _context: vscode.ExtensionContext,
  config: {
    obs_ws_address?: string;
    autoConnect?: boolean | undefined;
    visual_cue?: string;
    timeSpeed?: number;
    stopRecordWithTour?: boolean;
  }
) {
  // Check if the end-user has the CodeTour extension installed.
  const codeTourExtension = vscode.extensions.getExtension('vsls-contrib.codetour');
  if (codeTourExtension) {
    // Grab the extension API.
    const codeTourApi = codeTourExtension.exports;
    // 如果没有在录制 并且 .tour文件夹存在
    // if (vscode.workspace.workspaceFolders) {
    //   const tourFolder = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.tours');

    //   if (existsSync(tourFolder.fsPath)) {
    //   }
    // }
    ganVideoObject(config, _context, codeTourApi);

    // 将obs的output路径修改为当前路径.tour文件夹 ERROR: GetOutputSettings 没有找到output name相关定义
    // ganVideoObject(codeTourApi);
  }
}

interface TourType {
  steps?: [{ file: string; description: string; line: number }];
  title?: string;
}

// TODO: 关联 .tour steps的描述字段
function ganVideoObject(
  config: {
    obs_ws_address?: string;
    autoConnect?: boolean | undefined;
    visual_cue?: string;
    timeSpeed?: number;
    stopRecordWithTour?: boolean;
  },
  _context: vscode.ExtensionContext,
  codeTourApi: {
    onDidStartTour: (arg0: ([tour, stepNumber]: [{ title: string }, number]) => void) => void;
    onDidEndTour: (arg0: (tour: { title: string }) => void) => void;
  }
) {
  // Use the API object as needed
  codeTourApi.onDidStartTour(([tour, stepNumber]: [TourType, number]) => {
    const obs = OBSSubject.getSubject();
    obs
      .GetRecordStatus()
      .pipe(map((res) => res.responseData))
      .subscribe({
        next(resData) {
          const part = {
            '@type': 'Clip',
            name: `${stepNumber}: ${tour.title}`,
            offset: resData.outputTimecode,
            duration: resData.outputDuration,
            description: '',
          };
          if (tour.steps) part.description = tour.steps[stepNumber].description;
          videoObjectTemplate.hasPart.push(part);
        },
      });
  });

  codeTourApi.onDidEndTour((_tour: { title: string }) => {
    const obs = OBSSubject.getSubject();
    obs
      .GetRecordStatus()
      .pipe(map((res) => res.responseData))
      .subscribe({
        next(resData) {
          endPart.offset = resData.outputTimecode;
          endPart.duration = resData.outputDuration;

          videoObjectTemplate.hasPart.push(endPart);

          const isRecording = _context.workspaceState.get('isRecording');
          if (isRecording && config.stopRecordWithTour)
            vscode.commands.executeCommand(stopRecordCommandId);
        },
      });
  });
}
