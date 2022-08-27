import { Subject } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig, webSocket } from 'rxjs/webSocket';
import { Message } from './types';

interface OnWebSocketLife {
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
}

type OBSWebSocketSubject = WebSocketSubject<Message>;
type OBSWebSocketSubjectConfig = WebSocketSubjectConfig<Message>;

export class OBSSubject implements OnWebSocketLife {
  private static obs_subject: OBSSubject;
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
  private readonly _ws_subject$: OBSWebSocketSubject;
  // private _config: WebSocketSubjectConfig<Message>;

  private constructor(config: OBSWebSocketSubjectConfig) {
    this.onClose$ = new Subject();
    this.onOpen$ = new Subject();
    this._ws_subject$ = webSocket(config);
  }

  public static getSubject(config?: OBSWebSocketSubjectConfig) {
    if (this.obs_subject) return this.obs_subject;
    if (undefined === config) {
      config = {
        url: 'localhost:4455',
      };
    }
    this.obs_subject = new this(config);
    return this.obs_subject;
  }
}
