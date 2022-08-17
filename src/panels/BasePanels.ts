import * as vscode from 'vscode';

export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

export class BasePanel {
  public static currentPanel: BasePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  // private _extensionUri: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    // this._extensionUri = extensionUri;
    this._panel = panel;
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);

    this._panel.onDidDispose(this.dispose, null, this._disposables);
    this._setWebviewMessageListener(this._panel.webview);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public postMessage(msg: any) {
    this._panel.webview.postMessage(msg);
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case 'hello':
            vscode.window.showInformationMessage(text);
            // // eslint-disable-next-line no-case-declarations
            // const clapperboard_1 = this._getUri(webview, ['lottie', 'clapperboard-1.json']);

            // webview.postMessage({ uri: clapperboard_1 });
            return;
        }
      },
      undefined,
      this._disposables
    );
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    // const rxjsUri = this._getUri(webview, [
    //   'node_modules',
    //   'rxjs',
    //   'dist',
    //   'bundles',
    //   'rxjs.umd.js',
    // ]);
    // <script type="module" src="${rxjsUri}"></script>;
    // const toolkitUri = this._getUri(webview, [
    //   'node_modules',
    //   '@vscode',
    //   'webview-ui-toolkit',
    //   'dist',
    //   'toolkit.js',
    // ]);
    // const mainUri = this._getUri(webview, ['src', 'webview-ui', 'main.js']);
    // const lottieUri = this._getUri(webview, [
    //   'node_modules',
    //   '@lottiefiles',
    //   'lottie-player',
    //   'dist',
    //   'lottie-player.js',
    // ]);
    // const clapperboard_1 = this._getUri(webview, ['lottie', 'clapperboard-1.json']);
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.css']);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, ['webview-ui', 'build', 'assets', 'index.js']);

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; img-src *; script-src *; style-src *;"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="${scriptUri}"></script>
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
