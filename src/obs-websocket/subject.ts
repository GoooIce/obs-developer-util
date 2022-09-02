// import * as uuid from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { filter, forkJoin, map, Observable, Observer, Subject, tap } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig, webSocket } from 'rxjs/webSocket';
import { ganOBSRequest } from './ganOBSRequest';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  EventSubscription,
  Message,
  OBSRequestTypes,
  RequestMessage,
  ResponseMessage,
  WebSocketOpCode,
} from './types';
import { needAuth, genAuthString } from './util';

interface OnWebSocketLife {
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
}

type OBSWebSocketSubject = WebSocketSubject<Message>;
type OBSWebSocketSubjectConfig = WebSocketSubjectConfig<Message>;

export class OBSSubject implements OnWebSocketLife {
  private static obs_subject: OBSSubject | undefined;

  /**When obs-websocket server hello op message include auth message,
   * onAuth$ Subscription will be run. Then {@link password$}.next(string)
   * send a password to server.
   */
  onAuth$: Subject<void>;
  /**used by obs.{@link onAuth$}.subscribe({next: () => obs.password$.next('password')})
   * send password to obs-websocket server
   */
  password$: Subject<string>;

  onOpen$: Subject<void>;
  onClose$: Subject<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError$: Subject<any>;
  onComplete$: Subject<void>;

  onIdentified$: Subject<boolean>;

  private readonly _ws_subject$: OBSWebSocketSubject;
  // private _config: WebSocketSubjectConfig<Message>;

  private _next(msg: Message) {
    this._ws_subject$.next(msg);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  private _needAuth(msg: Message) {}

  private constructor(config: OBSWebSocketSubjectConfig) {
    this.onClose$ = new Subject();
    this.onOpen$ = new Subject();
    this.onAuth$ = new Subject();
    this.onError$ = new Subject();
    this.onComplete$ = new Subject();
    this.onIdentified$ = new Subject();
    this.password$ = new Subject();
    this._ws_subject$ = webSocket(config);

    // When Identified do onIdentified
    this._ws_subject$.pipe(filter((msg) => msg.op === WebSocketOpCode.Identified)).subscribe({
      next: () => {
        this.onIdentified$.next(true);
      },
    });

    //#region 登录验证
    const identify$ = this._ws_subject$.pipe(
      filter((msg) => msg.op === WebSocketOpCode.Hello)
    ) as Observable<Message<WebSocketOpCode.Hello>>;

    // identify$.subscribe();
    // need auth
    const identifyOnAuth$ = identify$.pipe(
      filter((msg) => needAuth(msg)),
      tap(() => this.onAuth$.next())
    );
    forkJoin([identifyOnAuth$, this.password$]).subscribe({
      next: this._auth_with_password_observer_next,
    });

    // dont need auth
    identify$.pipe(filter((msg) => !needAuth(msg))).subscribe({
      next: this._auth_without_password_observer_next,
    });
    //#endregion

    this._ws_subject$.subscribe(this._ws_subject_observer);
  }

  private _identify_msg: Message<WebSocketOpCode.Identify> = {
    op: WebSocketOpCode.Identify,
    d: {
      rpcVersion: 1,
      eventSubscriptions: EventSubscription.All,
    },
  };

  private _auth_without_password_observer_next = () => {
    this._next(this._identify_msg);
  };

  private _auth_with_password_observer_next = ([msg, password]: [
    Message<WebSocketOpCode.Hello>,
    string
  ]) => {
    if (msg.d.authentication)
      this._identify_msg.d.authentication = genAuthString(msg.d.authentication, password);
    this._next(this._identify_msg);
  };

  private _ws_subject_observer: Observer<Message> = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    next: () => {}, // Called whenever there is a message from the server.
    error: (err) => this.onError$.next(err), // Called if at any point WebSocket API signals some kind of error.
    complete: () => {
      this.onComplete$.next();
    },
  };

  public static getSubject(config?: OBSWebSocketSubjectConfig) {
    if (this.obs_subject) return this.obs_subject;
    if (undefined === config) {
      config = {
        url: 'ws://localhost:4455',
      };
    }
    this.obs_subject = new this(config);
    return this.obs_subject;
  }

  public static unsubscribe() {
    this.obs_subject?.onAuth$.unsubscribe();
    this.obs_subject?.onIdentified$.unsubscribe();
    this.obs_subject?.password$.unsubscribe();
    this.obs_subject?.onClose$.unsubscribe();
    this.obs_subject?.onComplete$.unsubscribe();
    this.obs_subject?.onError$.unsubscribe();
    this.obs_subject?._ws_subject$.unsubscribe();
    OBSSubject.obs_subject = undefined;
  }

  public _api(
    requestType: keyof OBSRequestTypes,
    requestData?: OBSRequestTypes[typeof requestType]
  ): Observable<ResponseMessage<typeof requestType>> {
    return ganOBSRequest<typeof requestType>(this._ws_subject$, requestType, requestData);
  }

  public GetRecordStatus() {
    return this._api('GetRecordStatus') as unknown as Observable<
      ResponseMessage<'GetRecordStatus'>
    >;
  }
}
