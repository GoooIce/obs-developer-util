// import { writeFile } from 'fs';
import { map } from 'rxjs';
import * as vscode from 'vscode';
import { OBSSubject } from './obs-websocket/subject';

export function onDidToursRecord(_context: vscode.ExtensionContext) {
  // Check if the end-user has the CodeTour extension installed.
  const codeTourExtension = vscode.extensions.getExtension('vsls-contrib.codetour');
  if (codeTourExtension) {
    // Grab the extension API.
    const codeTourApi = codeTourExtension.exports;

    // Use the API object as needed
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    codeTourApi.onDidStartTour(([tour, stepNumber]: [{ title: string }, number]) => {
      console.log('Tour started: ', tour.title);
      const obs = OBSSubject.getSubject();
      obs
        .GetRecordStatus()
        .pipe(map((res) => [res.responseData.outputDuration, res.responseData.outputTimecode]))
        .subscribe();
      if (vscode.workspace.workspaceFolders) console.log(vscode.workspace.workspaceFolders);
    });

    codeTourApi.onDidEndTour((tour: { title: string }) => {
      console.log('Tour ended: ', tour.title);
    });
  }
}
