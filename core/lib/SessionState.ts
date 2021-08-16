import * as fs from 'fs';
import { IBoundLog } from '@ulixee/commons/interfaces/ILog';
import Log from '@ulixee/commons/lib/Logger';
import IScriptInstanceMeta from '@ulixee/databox-interfaces/IScriptInstanceMeta';
import ISessionCreateOptions from '@ulixee/databox-interfaces/ISessionCreateOptions';
import SessionsDb from '../dbs/SessionsDb';
import SessionDb from '../dbs/SessionDb';
import { IOutputChangeRecord } from '../models/OutputTable';

const { log } = Log(module);

export default class SessionState {
  public static registry = new Map<string, SessionState>();

  public readonly sessionId: string;
  public readonly db: SessionDb;

  public nextCommandMeta: { commandId: number; startDate: Date; sendDate: Date };

  private readonly scriptInstanceMeta: IScriptInstanceMeta;
  private readonly createDate = new Date();

  private readonly logger: IBoundLog;

  private closeDate?: Date;

  private isClosing = false;

  constructor(
    sessionId: string,
    scriptInstanceMeta: IScriptInstanceMeta,
  ) {
    this.sessionId = sessionId;
    this.scriptInstanceMeta = scriptInstanceMeta;
    this.logger = log.createChild(module, {
      sessionId,
    });
    SessionState.registry.set(sessionId, this);

    fs.mkdirSync(SessionDb.databaseDir, { recursive: true });
    this.db = new SessionDb(sessionId);
    if (scriptInstanceMeta) {
      fs.mkdirSync(SessionsDb.databaseDir, { recursive: true });
      const sessionsDb = SessionsDb.find();
      const sessionsTable = sessionsDb.sessions;
      sessionsTable.insert(
        sessionId,
        this.createDate.getTime(),
        scriptInstanceMeta.id,
        scriptInstanceMeta.entrypoint,
        scriptInstanceMeta.startDate,
      );
    }
  }

  public recordOutputChanges(changes: IOutputChangeRecord[]): void {
    this.nextCommandMeta = null;
    for (const change of changes) {
      this.db.output.insert(change);
    }
  }

  public recordSession(options: {
    sessionOptions: ISessionCreateOptions;
  }): void {
    const { scriptInstanceMeta, ...optionsToStore } = options.sessionOptions;
    this.db.session.insert(
      this.sessionId,
      this.createDate,
      this.scriptInstanceMeta?.id,
      this.scriptInstanceMeta?.entrypoint,
      this.scriptInstanceMeta?.startDate,
      optionsToStore,
    );
  }

  public close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.logger.stats('SessionState.Closing');
    this.closeDate = new Date();
    this.db.session.close(this.sessionId, this.closeDate);
    this.db.flush();
    this.db.close();
    SessionState.registry.delete(this.sessionId);
  }
}
