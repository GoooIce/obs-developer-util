import * as uuid from 'uuid';
import { WebSocketSubject } from 'rxjs/webSocket';
import {
  WebSocketOpCode,
  Message,
  // EventMessage,
  // OBSEventTypes,
  ResponseMessage,
  // OBSResponseTypes,
  OBSRequestTypes,
  RequestMessage,
} from './types';
import { filter, map, Observable } from 'rxjs';

/**gan obs request and give back an observable response */
export function ganOBSRequest<T extends keyof OBSRequestTypes>(
  OBS_WS_subject$: WebSocketSubject<Message>,
  requestType: T,
  requestData?: OBSRequestTypes[T]
): Observable<ResponseMessage<T>> {
  const _uuid = uuid.v1();
  const responseMessage$ = OBS_WS_subject$.pipe(
    filter((msg) => msg.op === WebSocketOpCode.RequestResponse),
    map((msg) => msg.d)
  ) as Observable<ResponseMessage>;
  const requestD: RequestMessage = {
    requestId: _uuid,
    requestType: requestType,
    requestData: requestData,
  } as RequestMessage<T>;
  OBS_WS_subject$.next({
    op: WebSocketOpCode.Request,
    d: requestD,
  });
  return responseMessage$.pipe(
    filter((msg) => msg.requestType === requestType && msg.requestId === _uuid)
  ) as unknown as Observable<ResponseMessage<T>>;
}
