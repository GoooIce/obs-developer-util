/* eslint-disable @typescript-eslint/no-unused-vars */
// import * as uuid from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  combineLatestWith,
  filter,
  forkJoin,
  lastValueFrom,
  map,
  Observable,
  Observer,
  pipe,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig, webSocket } from 'rxjs/webSocket';
import { ganOBSRequest } from './ganOBSRequest';

import {
  EventMessage,
  EventSubscription,
  Message,
  OBSEventTypes,
  OBSRequestTypes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RequestMessage,
  ResponseMessage,
  WebSocketCloseCode,
  WebSocketOpCode,
} from './types';
import { needAuth, genAuthString } from './util';

interface OnWebSocketLife {
  onOpen$: Subject<void>;
  onClose$: Subject<CloseEvent>;
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
  onClose$: Subject<CloseEvent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError$: Subject<ErrorEvent>;
  onComplete$: Subject<void>;

  onIdentified$: Subject<boolean>;

  private readonly _ws_subject$: OBSWebSocketSubject;
  // private _config: WebSocketSubjectConfig<Message>;

  private _next(msg: Message) {
    this._ws_subject$.next(msg);
  }

  private _closeObserver = {
    next: (e: CloseEvent) => {
      if (WebSocketCloseCode.AuthenticationFailed === e.code) {
        return this.onAuth$.error(e);
      }
      // if (WebSocketCloseCode.CantConnect === e.code) {
      //   return this.onError$.next(e);
      // }
      this.onClose$.next(e);
    },
    error: (err: ErrorEvent) => this.onError$.next(err),
    complete: () => console.log('Observer got a complete notification'),
  };

  private constructor(config: OBSWebSocketSubjectConfig) {
    this.onClose$ = new Subject();
    this.onOpen$ = new Subject();
    this.onAuth$ = new Subject();
    this.onError$ = new Subject();
    this.onComplete$ = new Subject();
    this.onIdentified$ = new Subject();
    this.password$ = new Subject();

    if (undefined === config.closeObserver) config.closeObserver = this._closeObserver;

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
    // const identifyOnAuth$ =
    identify$
      .pipe(
        filter((msg) => needAuth(msg)),
        tap(() => this.onAuth$.next()),
        combineLatestWith(this.password$)
      )
      .subscribe({
        next: this._auth_with_password_observer_next,
      });

    // forkJoin([lastValueFrom(identifyOnAuth$), this.password$]).subscribe({
    //   next: this._auth_with_password_observer_next,
    // });

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
      OBSSubject.unsubscribe();
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

  public fromEvent<T extends keyof OBSEventTypes>(eventType: T) {
    const event$ = this._ws_subject$.pipe(
      filter((msg) => WebSocketOpCode.Event === msg.op),
      map((msg) => msg.d as EventMessage<T>)
    );
    return event$.pipe(filter((msg) => msg.eventType === eventType)) as unknown as Observable<
      EventMessage<T>
    >;
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

  public GetSceneList() {
    return this._api('GetSceneList') as unknown as Observable<ResponseMessage<'GetSceneList'>>;
  }

  public SetCurrentProgramScene(sceneName: string) {
    return this._api('SetCurrentProgramScene', {
      sceneName: sceneName,
    }) as unknown as Observable<ResponseMessage<'SetCurrentProgramScene'>>;
  }
}
