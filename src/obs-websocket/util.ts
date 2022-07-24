import * as crypto from 'crypto';

export function genAuthString(
  { salt, challenge }: { salt: string; challenge: string },
  password: string
) {
  const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('base64');
  const authString = crypto
    .createHash('sha256')
    .update(hash + challenge)
    .digest('base64');
  return authString;
}
