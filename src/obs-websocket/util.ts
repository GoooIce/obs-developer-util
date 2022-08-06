import * as crypto from 'crypto';
import { Message, WebSocketOpCode, EventSubscription } from './types';

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

export function needAuth(msg: Message<WebSocketOpCode.Hello>) {
  if (msg.d.authentication !== undefined) return true;
  return false;
}

export function genIdentifyMessage(
  msg: Message<WebSocketOpCode.Hello>,
  env: EventSubscription,
  password: string
) {
  const identify: Message<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: {
      rpcVersion: 1,
      eventSubscriptions: env,
    },
  };
  if (msg.d.authentication !== undefined)
    identify.d.authentication = genAuthString(msg.d.authentication, password);
  return identify;
}
