import { Database as SqliteDatabase } from 'better-sqlite3';
import SqliteTable from '@ulixee/commons/lib/SqliteTable';

export default class OutputTable extends SqliteTable<IOutputChangeRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(
      db,
      'Output',
      [
        ['type', 'TEXT'],
        ['path', 'TEXT'],
        ['value', 'TEXT'],
        ['lastCommandId', 'INTEGER'],
        ['lastExternalId', 'INTEGER'],
        ['timestamp', 'INTEGER'],
      ],
      true,
    );
  }

  public insert(record: IOutputChangeRecord): void {
    record.value = JSON.stringify(record.value);
    const { type, path, value, lastCommandId, lastExternalId, timestamp } = record;
    this.queuePendingInsert([type, path, value, lastCommandId, lastExternalId, timestamp]);
  }
}

export interface IOutputChangeRecord {
  type: string;
  path: string;
  value: string;
  lastCommandId: number;
  lastExternalId: number;
  timestamp: number;
}
