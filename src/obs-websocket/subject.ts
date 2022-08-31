// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { filter, map, Observable, Subject, tap } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig, webSocket } from 'rxjs/webSocket';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventSubscription, Message, RequestMessage, WebSocketOpCode } from './types';
import { needAuth, genIdentifyMessage } from './util';

interface OnWebSocketLife {
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
}

type OBSWebSocketSubject = WebSocketSubject<Message>;
type OBSWebSocketSubjectConfig = WebSocketSubjectConfig<Message>;

export class OBSSubject implements OnWebSocketLife {
  private static obs_subject: OBSSubject;
  onAuth$: Subject<void>;
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError$: Subject<any>;
  onComplete$: Subject<void>;
  password$: Subject<string>;
  identified: boolean;
  onIdentified$: Subject<boolean>;
  private readonly _ws_subject$: OBSWebSocketSubject;
  // private _config: WebSocketSubjectConfig<Message>;

  public next(msg: Message) {
    this._ws_subject$.next(msg);
  }

  private constructor(config: OBSWebSocketSubjectConfig) {
    this.onClose$ = new Subject();
    this.onOpen$ = new Subject();
    this.onAuth$ = new Subject();
    this.onError$ = new Subject();
    this.onComplete$ = new Subject();
    this.onIdentified$ = new Subject();
    this.password$ = new Subject();
    this.identified = false;
    this._ws_subject$ = webSocket(config);

    const onAuth$ = this.onAuth$;
    const password$ = this.password$;

    this._ws_subject$.pipe(filter((msg) => msg.op === WebSocketOpCode.Identified)).subscribe({
      next: () => {
        this.onIdentified$.next(true);
      },
    });

    const identify$ = this._ws_subject$.pipe(
      filter((msg) => msg.op === WebSocketOpCode.Hello)
    ) as Observable<Message<WebSocketOpCode.Hello>>;

    identify$.subscribe();
    // need auth
    identify$.pipe(filter((msg) => needAuth(msg))).subscribe({
      next(msg) {
        onAuth$.next();
        password$.subscribe({
          next(password) {
            OBSSubject.obs_subject._ws_subject$.next(
              genIdentifyMessage(msg, EventSubscription.All, password)
            );
          },
        });
      },
    });

    // dont need auth
    identify$.pipe(filter((msg) => !needAuth(msg))).subscribe({
      next(msg) {
        OBSSubject.obs_subject._ws_subject$.next(
          genIdentifyMessage(msg, EventSubscription.All, '')
        );
      },
    });

    this._ws_subject$.subscribe({
      next: (msg: Message) => {
        if (WebSocketOpCode.RequestResponse === msg.op) {
          console.log(`${msg.d.requestType} : result : ${msg.d.requestStatus.result}`);
        }
      }, // Called whenever there is a message from the server.
      error: (err) => this.onError$.next(err), // Called if at any point WebSocket API signals some kind of error.
      complete: () => {
        this.onComplete$.next();
      },
    });
  }

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
}
