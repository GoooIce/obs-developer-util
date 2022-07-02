/* eslint-disable jest/expect-expect */
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from "../../extension";
// import { WebSocket } from "ws";
// import { webSocket } from 'rxjs/webSocket';

suite('Extension Test Suite', async () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test with emmmmmm', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
