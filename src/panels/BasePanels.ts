import * as vscode from 'vscode';

export class BasePanel {
  public static currentPanel: BasePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel) {
    this._panel = panel;
  }

  public static render() {
    if (BasePanel.currentPanel) {
      BasePanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'basePanel',
        'BasePanel',
        vscode.ViewColumn.Two,
        {}
      );
      BasePanel.currentPanel = new BasePanel(panel);
    }
  }
}
