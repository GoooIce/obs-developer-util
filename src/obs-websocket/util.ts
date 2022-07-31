import * as crypto from 'crypto';
import { IncomingMessage, WebSocketOpCode, EventSubscription, OutgoingMessage } from './types';

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

export function needAuth(msg: IncomingMessage<WebSocketOpCode.Hello>) {
  if (msg.d.authentication !== undefined) return true;
  return false;
}

export function genIdentifyMessage(
  msg: IncomingMessage<WebSocketOpCode.Hello>,
  env: EventSubscription,
  password: string
) {
  const identify: OutgoingMessage<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: {
      rpcVersion: 1,
      eventSubscriptions: 0,
    },
  };
  if (msg.d.authentication !== undefined)
    identify.d.authentication = genAuthString(msg.d.authentication, password);
  return identify;
}
