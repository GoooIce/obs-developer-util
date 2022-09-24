import * as vscode from 'vscode';
// Check if the end-user has the CodeTour extension installed.
const codeTourExtension = vscode.extensions.getExtension('vsls-contrib.codetour');
if (codeTourExtension) {
  // Grab the extension API.
  const codeTourApi = codeTourExtension.exports;

  // Use the API object as needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  codeTourApi.onDidStartTour(([tour, stepNumber]: [{ title: string }, number]) => {
    console.log('Tour started: ', tour.title);
  });

  codeTourApi.onDidEndTour((tour: { title: string }) => {
    console.log('Tour ended: ', tour.title);
  });
}
