import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase, Transaction } from 'better-sqlite3';
import * as Path from 'path';
import Log from '@ulixee/commons/lib/Logger';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';
import SessionTable from '../models/SessionTable';
import SessionsDb from './SessionsDb';
import SessionState from '../lib/SessionState';
import OutputTable from '../models/OutputTable';

const { log } = Log(module);

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

export default class SessionDb {
  private static byId = new Map<string, SessionDb>();

  public get readonly(): boolean {
    return this.db?.readonly;
  }

  public readonly output: OutputTable;
  public readonly session: SessionTable;
  public readonly sessionId: string;

  private readonly batchInsert?: Transaction;
  private readonly saveInterval: NodeJS.Timeout;

  private db: SqliteDatabase;
  private readonly tables: SqliteTable<any>[] = [];

  constructor(baseDir: string, id: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.sessionId = id;
    this.db = new Database(`${baseDir}/databox-instance-${id}.db`, { readonly, fileMustExist });
    if (!readonly) {
      this.saveInterval = setInterval(this.flush.bind(this), 5e3).unref();
    }

    this.session = new SessionTable(this.db);
    this.output = new OutputTable(this.db);

    this.tables.push(
      this.session,
      this.output,
    );

    if (!readonly) {
      this.batchInsert = this.db.transaction(() => {
        for (const table of this.tables) {
          try {
            table.runPendingInserts();
          } catch (error) {
            if (String(error).match('attempt to write a readonly database')) {
              clearInterval(this.saveInterval);
              this.db = null;
            }
            log.error('SessionDb.flushError', {
              sessionId: this.sessionId,
              error,
              table: table.tableName,
            });
          }
        }
      });
    }
  }

  public close(): void {
    clearInterval(this.saveInterval);
    if (this.db) {
      this.flush();
      this.db.close();
    }
    this.db = null;
  }

  public flush(): void {
    if (this.batchInsert) {
      try {
        this.batchInsert.immediate();
      } catch (error) {
        if (String(error).match(/attempt to write a readonly database/)) {
          clearInterval(this.saveInterval);
        }
        throw error;
      }
    }
  }

  public unsubscribeToChanges(): void {
    for (const table of this.tables) table.unsubscribe();
  }

  public static getCached(sessionId: string, basePath: string, fileMustExist = false): SessionDb {
    if (!this.byId.get(sessionId)?.db?.open) {
      this.byId.set(
        sessionId,
        new SessionDb(basePath, sessionId, {
          readonly: true,
          fileMustExist,
        }),
      );
    }
    return this.byId.get(sessionId);
  }

  public static findWithRelated(scriptArgs: ISessionLookupArgs): ISessionLookup {
    let { dataLocation, sessionId } = scriptArgs;

    const ext = Path.extname(dataLocation);
    if (ext === '.db') {
      sessionId = Path.basename(dataLocation, ext);
      dataLocation = Path.dirname(dataLocation);
    }

    // NOTE: don't close db - it's from a shared cache
    const sessionsDb = SessionsDb.find(dataLocation);
    if (!sessionId) {
      sessionId = sessionsDb.findLatestSessionId(scriptArgs);
      if (!sessionId) return null;
    }

    const activeSession = SessionState.registry.get(sessionId);
    const sessionDb = activeSession?.db ?? this.getCached(sessionId, dataLocation, true);
    const session = sessionDb.session.get();
    const related = sessionsDb.findRelatedSessions(session);

    return {
      ...related,
      dataLocation,
      sessionDb,
      sessionState: activeSession,
    };
  }
}

export interface ISessionLookup {
  sessionDb: SessionDb;
  dataLocation: string;
  sessionState: SessionState;
  relatedSessions: { id: string }[];
  relatedScriptInstances: { id: string; startDate: number; defaultSessionId: string }[];
}

export interface ISessionLookupArgs {
  scriptInstanceId: string;
  sessionName: string;
  scriptEntrypoint: string;
  dataLocation: string;
  sessionId: string;
}
