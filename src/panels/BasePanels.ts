import * as vscode from 'vscode';
import { recordCommandId } from '../enum';

export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

// function uriToUrl(uri: vscode.Uri) {
//   return `${uri.scheme}://${uri.authority}${uri.path}`;
// }

export class BasePanel {
  public static currentPanel: BasePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    this._panel.onDidDispose(this.dispose, null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview, extensionUri);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _setWebviewMessageListener(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // const clapperboard_1 = getUri(webview, extensionUri, ['out', 'lottie', 'timer-2.json']);
    webview.onDidReceiveMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (message: any) => {
        const command = message.command;
        // const text = message.text;

        switch (command) {
          // case 'hello':
          //   webview.postMessage({ command: 'lottie', message: uriToUrl(clapperboard_1) });
          //   return;
          case 'player-complete':
            // vscode.window.showInformationMessage('complete');
            vscode.commands.executeCommand(recordCommandId);
            BasePanel.currentPanel?.dispose();
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    const baseUri = getUri(webview, extensionUri, ['out']);
    const toolkitUri = getUri(webview, extensionUri, [
      'node_modules',
      '@vscode',
      'webview-ui-toolkit',
      'dist',
      'toolkit.js',
    ]);
    const mainUri = getUri(webview, extensionUri, ['out', 'webview-ui', 'index.js']);
    const lottieUri = getUri(webview, extensionUri, [
      'node_modules',
      '@lottiefiles',
      'lottie-player',
      'dist',
      'lottie-player.js',
    ]);
    //
    const clapperboard_1 = getUri(webview, extensionUri, ['out', 'lottie', 'timer-2.json']);
    // <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} sha256-SycxdxQ2BxUxdxtxCHqGt00ATy3JXSz+X3sPlsXoM8s=; script-src ${webview.cspSource} ;">
    //src = '${clapperboard_1}';
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width,initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${lottieUri}"></script>
          <script type="module" src="${mainUri}"></script>
          <title>Hello World!</title>
        </head>
        <body>
          <input data=${baseUri} hidden/>
          <lottie-player
            autoplay
            src = '${clapperboard_1}'
            mode="normal"
            style="width: 320px"
          >
          </lottie-player>
        </body>
      </html>
    `;
  }

  public static render(extensionUri: vscode.Uri) {
    if (BasePanel.currentPanel) {
      BasePanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'basePanel',
        'BasePanel',
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );
      BasePanel.currentPanel = new BasePanel(panel, extensionUri);
    }
  }

  public dispose() {
    BasePanel.currentPanel = undefined;

    this._panel.dispose();

    this._disposables.map((disposable) => {
      disposable.dispose();
    });
  }
}
