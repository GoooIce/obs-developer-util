import { keychain } from '../../keychain';

/* eslint-disable jest/expect-expect */
import * as assert from 'assert';

suite('Keychain Test Suite', async () => {
  await keychain?.setPassword('test', 'test', 'password');
  test('get it', async () => {
    const pw = await keychain?.getPassword('test', 'test');
    assert.equal('password', pw);
  });
  test('del it', async () => {
    await keychain?.deletePassword('test', 'test');
    const pw = keychain?.getPassword('test', 'test');
    assert.equal('', pw);
  });
});
