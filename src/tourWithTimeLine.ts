import { writeFileSync, existsSync } from 'fs';
import { map } from 'rxjs';
import * as vscode from 'vscode';
import { stopRecordCommandId } from './enum';
import { OBSSubject } from './obs-websocket/subject';

const _json_ld_template = {
  '@context': 'https://schema.org/',
  '@type': 'VideoObject',
  name: 'codetour video',
  hasPart: [
    {
      '@type': 'Clip',
      name: '前言',
      offset: '0',
    },
  ],
};

export function onDidToursRecord(_context: vscode.ExtensionContext) {
  // Check if the end-user has the CodeTour extension installed.
  const codeTourExtension = vscode.extensions.getExtension('vsls-contrib.codetour');
  if (codeTourExtension) {
    // Grab the extension API.
    const codeTourApi = codeTourExtension.exports;
    // 如果没有在录制 并且 .tour文件夹存在
    if (vscode.workspace.workspaceFolders) {
      const tourFolder = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.tours');

      if (existsSync(tourFolder.fsPath)) {
        // changeObsOutputConfig(tourFolder.uri.fsPath);
        ganVideoObject(_context, codeTourApi, vscode.workspace.workspaceFolders[0].uri.fsPath);
      }
    }

    // 将obs的output路径修改为当前路径.tour文件夹 ERROR: GetOutputSettings 没有找到output name相关定义
    // ganVideoObject(codeTourApi);
  }
}

function ganVideoObject(
  _context: vscode.ExtensionContext,
  codeTourApi: {
    onDidStartTour: (arg0: ([tour, stepNumber]: [{ title: string }, number]) => void) => void;
    onDidEndTour: (arg0: (tour: { title: string }) => void) => void;
  },
  tourPath: string
) {
  // Use the API object as needed
  codeTourApi.onDidStartTour(([tour, stepNumber]: [{ title: string }, number]) => {
    const obs = OBSSubject.getSubject();
    obs
      .GetRecordStatus()
      .pipe(map((res) => [res.responseData.outputDuration, res.responseData.outputTimecode]))
      .subscribe({
        next([_outputDuration, _outputTimecode]) {
          const part = {
            '@type': 'Clip',
            name: `${stepNumber}: ${tour.title}`,
            offset: `${_outputTimecode}`,
            duration: _outputDuration,
          };

          _json_ld_template.hasPart.push(part);
        },
      });
  });

  codeTourApi.onDidEndTour((tour: { title: string }) => {
    const part = {
      '@type': 'Clip',
      name: `结束语: ${tour.title}`,
      offset: '-1',
    };

    _json_ld_template.hasPart.push(part);

    writeFileSync(`${tourPath}/tourVideoObject.json`, JSON.stringify(_json_ld_template));

    _json_ld_template.hasPart = [
      {
        '@type': 'Clip',
        name: '前言',
        offset: '0',
      },
    ];

    const isRecording = _context.workspaceState.get('isRecording');
    if (isRecording) vscode.commands.executeCommand(stopRecordCommandId);
  });
}
