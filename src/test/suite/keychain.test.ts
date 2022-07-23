import { keychain } from '../../keychain';

/* eslint-disable jest/expect-expect */
import * as assert from 'assert';

suite('Keychain Test Suite', async () => {
  test('set&get it', async () => {
    // https://github.com/microsoft/vscode/issues/68738#issuecomment-469839556
    await keychain?.setPassword('test', 'test', 'password');
    const pw = await keychain?.getPassword('test', 'test');
    assert.equal('password', pw);
  });
});
