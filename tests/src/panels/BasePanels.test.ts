jest.unmock('../../../src/panels/BasePanels');
import { BasePanel } from '../../../src/panels/BasePanels';
import * as vscode from 'vscode';

describe('BasePanel', () => {
  const uri = {
    parse: jest.fn(),
    file: jest.fn(),
    joinPath: jest.fn(),
    from: jest.fn(),
    constructor: jest.fn(),
    scheme: 'mock_scheme',
    authority: 'string',
    path: 'path_string',
    query: 'query_string',
    fragment: 'fragment_string',
    fsPath: 'fsPath_string',
    with: jest.fn(),
    toString: jest.fn(),
    toJSON: jest.fn(),
  };

  it('render', () => {
    BasePanel.render(uri);
    expect(vscode.window.createWebviewPanel).toHaveBeenCalled();
  });
  it('dispose', () => {
    BasePanel.render(uri);
    expect(BasePanel.currentPanel).toBeDefined();
    BasePanel.currentPanel.dispose();
    expect(BasePanel.currentPanel).toBeUndefined();
  });
});
