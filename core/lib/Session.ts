import { v1 as uuidv1 } from 'uuid';
import Log from '@ulixee/commons/lib/Logger';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ISessionCreateOptions from '@ulixee/databox-interfaces/ISessionCreateOptions';
import SessionState from './SessionState';
import { IOutputChangeRecord } from '../models/OutputTable';

const { log } = Log(module);

export default class Session extends TypedEventEmitter<{
  closing: void;
  closed: void;
}> {
  private static readonly byId: { [id: string]: Session } = {};

  public readonly id: string;
  public readonly databaseDir: string;

  public sessionState: SessionState;
  public resumeCounter = 0;

  public get isClosing(): boolean {
    return this._isClosing;
  }

  protected readonly logger: IBoundLog;

  private _isClosing = false;

  constructor(readonly options: ISessionCreateOptions) {
    super();
    this.id = uuidv1();
    Session.byId[this.id] = this;
    this.logger = log.createChild(module, { sessionId: this.id });
    this.sessionState = new SessionState(this.id, options.scriptInstanceMeta);
    this.sessionState.recordSession({
      sessionOptions: {},
    });
  }

  public recordOutput(changes: IOutputChangeRecord[]): void {
    this.sessionState.recordOutputChanges(changes);
  }

  public close(): Promise<void> {
    delete Session.byId[this.id];
    if (this._isClosing) return;
    this.emit('closing');
    this._isClosing = true;
    const start = log.info('Session.Closing', {
      sessionId: this.id,
    });

    log.stats('Session.Closed', {
      sessionId: this.id,
      parentLogId: start,
    });
    this.emit('closed');
    this.sessionState.close();
  }

  public static get(sessionId: string): Session {
    if (!sessionId) return null;
    return this.byId[sessionId];
  }
}
