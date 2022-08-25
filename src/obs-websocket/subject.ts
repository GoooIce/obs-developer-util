import { Subject } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { Message } from './types';

interface OnWebSocketLife {
  onOpen$: Subject<void>;
  onClose$: Subject<void>;
}

export class OBSSubject implements OnWebSocketLife {
  onOpen$: Subject<void> = new Subject();
  onClose$: Subject<void> = new Subject();
  private _obs_ws_subject$: WebSocketSubject<Message>;
  private _config: WebSocketSubjectConfig<Message>;
}
