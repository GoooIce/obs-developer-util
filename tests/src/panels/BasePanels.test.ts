jest.unmock('../../../src/panels/BasePanels');
import { BasePanel } from '../../../src/panels/BasePanels';
import * as vscode from 'vscode';

describe('BasePanel', () => {
  it('render', () => {
    BasePanel.render();
    expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
  });
});
