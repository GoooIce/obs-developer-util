/* eslint-disable jest/expect-expect */
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from "../../extension";
// import { WebSocket } from "ws";
import { webSocket } from 'rxjs/webSocket';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Sample test 3', () => {
    if (typeof global !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).WebSocket = require('ws');
    }
    const subject = webSocket('ws://localhost:4455');
    subject.subscribe({
      next: (msg) => console.log('message received: ' + msg), // Called whenever there is a message from the server.
      error: (err) => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      complete: () => console.log('complete'), // Called when connection is closed (for whatever reason).
    });
    subject.next('Hello');
  });
});
