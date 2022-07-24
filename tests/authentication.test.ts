import * as sha256 from 'crypto-js/sha256';
import * as Base64 from 'crypto-js/enc-base64';

function genAuthString({ salt, challenge }, password) {
  // throw new Error('Function not implemented');
  const hash = Base64.stringify(sha256(password + salt));

  return Base64.stringify(sha256(hash + challenge));
}

describe('authentication', () => {
  it('gen obs auth string', () => {
    const salt = 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=';
    const challenge = '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=';
    const password = 'password';
    const authString = genAuthString({ salt, challenge }, password);
    expect(authString).toBe('ab');
  });
});
