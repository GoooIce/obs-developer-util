jest.unmock('../src/obs-websocket/util');
import { genAuthString } from '../src/obs-websocket/util';

describe('authentication', () => {
  it('gen obs auth string', () => {
    const salt = 'lM1GncleQOaCu9lT1yeUZhFYnqhsLLP1G5lAGo3ixaI=';
    const challenge = '+IxH4CnCiqpX1rM9scsNynZzbOe4KhDeYcTNS3PDaeY=';
    const password = 'supersecretpassword';
    const authString = genAuthString({ salt, challenge }, password);
    expect(authString).toBe('1Ct943GAT+6YQUUX47Ia/ncufilbe6+oD6lY+5kaCu4=');
  });
});
