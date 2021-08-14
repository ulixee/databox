import * as Database from 'better-sqlite3';
import { Database as SqliteDatabase } from 'better-sqlite3';
import SessionsTable from '../models/SessionsTable';

interface IDbOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
}

interface IRelatedScriptInstance {
  id: string;
  startDate: number;
  defaultSessionId: string;
}

interface IRelatedSession {
  id: string;
}

export default class SessionsDb {
  private static dbByBaseDir: { [dir: string]: SessionsDb } = {};
  public readonly sessions: SessionsTable;
  public readonly readonly: boolean;
  private readonly databaseDir: string;
  private db: SqliteDatabase;

  constructor(databaseDir: string, dbOptions: IDbOptions = {}) {
    const { readonly = false, fileMustExist = false } = dbOptions;
    this.db = new Database(`${databaseDir}/databox-instances.db`, { readonly, fileMustExist });
    this.databaseDir = databaseDir;
    this.readonly = readonly;
    this.sessions = new SessionsTable(this.db);
  }

  public findLatestSessionId(script: {
    sessionName: string;
    scriptInstanceId: string;
    scriptEntrypoint?: string;
  }): string {
    const { sessionName, scriptEntrypoint, scriptInstanceId } = script;
    if (sessionName && scriptInstanceId) {
      // find default session if current not available
      const sessionRecord =
        this.sessions.findByName(sessionName, scriptInstanceId) ??
        this.sessions.findByName('default-session', scriptInstanceId);
      return sessionRecord?.id;
    }
    if (scriptEntrypoint) {
      const sessionRecords = this.sessions.findByScriptEntrypoint(scriptEntrypoint);
      if (!sessionRecords.length) return undefined;
      return sessionRecords[0].id;
    }
  }

  public findRelatedSessions(session: { scriptEntrypoint: string; scriptInstanceId: string }): {
    relatedSessions: IRelatedSession[];
    relatedScriptInstances: IRelatedScriptInstance[];
  } {
    const otherSessions = this.sessions.findByScriptEntrypoint(session.scriptEntrypoint);
    const relatedScriptInstances: IRelatedScriptInstance[] = [];
    const relatedSessions: IRelatedSession[] = [];
    const scriptDates = new Set<string>();
    for (const otherSession of otherSessions) {
      const key = `${otherSession.scriptInstanceId}_${otherSession.scriptStartDate}`;
      if (!scriptDates.has(key)) {
        relatedScriptInstances.push({
          id: otherSession.scriptInstanceId,
          startDate: new Date(otherSession.scriptStartDate).getTime(),
          defaultSessionId: otherSession.id,
        });
      }
      if (otherSession.scriptInstanceId === session.scriptInstanceId) {
        relatedSessions.unshift({ id: otherSession.id });
      }
      scriptDates.add(key);
    }
    return {
      relatedSessions,
      relatedScriptInstances,
    };
  }

  public close(): void {
    if (this.db) {
      this.db.close();
    }
    this.db = null;
    delete SessionsDb.dbByBaseDir[this.databaseDir];
  }

  public static shutdown(): void {
    for (const [key, db] of Object.entries(SessionsDb.dbByBaseDir)) {
      db.close();
      delete SessionsDb.dbByBaseDir[key];
    }
  }

  public static find(baseDir: string): SessionsDb {
    if (!this.dbByBaseDir[baseDir]) {
      this.dbByBaseDir[baseDir] = new SessionsDb(baseDir);
    }
    return this.dbByBaseDir[baseDir];
  }
}
